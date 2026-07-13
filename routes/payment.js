import express from "express";
import axios from "axios";
import Order from "../models/Order.js";
import protect from "../middleware/protect.js";
import User from "../models/User.js";
import { sendOrderConfirmationEmail } from "../utils/emailService.js";

const router = express.Router();

// @POST /api/payment/initialize
// Initialize payment — called when user clicks Pay
router.post("/initialize", protect, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Make sure this order belongs to the logged in user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Initialize payment with Paystack
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: req.user.email,
        amount: order.totalPrice * 100, // Paystack uses kobo (multiply by 100)
        reference: `vendly_${orderId}_${Date.now()}`,
        callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
        metadata: {
          orderId,
          userId: req.user._id,
          userName: req.user.name,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.json({
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
      accessCode: response.data.data.access_code,
    });
  } catch (error) {
    console.error(
      "Paystack init error:",
      error.response?.data || error.message,
    );
    return res.status(500).json({ message: "Payment initialization failed" });
  }
});

// @POST /api/payment/verify
// Verify payment after redirect
router.post("/verify", protect, async (req, res) => {
  try {
    const { reference } = req.body;

    // Verify with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const { status, metadata, amount } = response.data.data;

    if (status !== "success") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    // Update order as paid
    const order = await Order.findById(metadata.orderId).populate(
      "user",
      "name email",
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentMethod = "Paystack";
    order.paymentReference = reference;
    await order.save();

    // ✅ Send confirmation email
    try {
      await sendOrderConfirmationEmail(
        order.user.email,
        order.user.name,
        order,
      );
    } catch (emailErr) {
      console.error("Order email failed:", emailErr.message);
    }

    return res.json({
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Paystack verify error:",
      error.response?.data || error.message,
    );
    return res.status(500).json({ message: "Payment verification failed" });
  }
});

// @POST /api/payment/webhook
// Paystack webhook — called by Paystack server directly
router.post("/webhook", async (req, res) => {
  try {
    const hash = require("crypto")
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const { event, data } = req.body;

    if (event === "charge.success") {
      const orderId = data.metadata?.orderId;
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          isPaid: true,
          paidAt: new Date(),
          paymentReference: data.reference,
        });
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.sendStatus(200);
  }
});

export default router;
