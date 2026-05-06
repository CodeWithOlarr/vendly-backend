import express from "express"
import Order from "../models/Order.js"
import protect from "../middleware/protect.js"

const router = express.Router()

// @POST /api/orders
router.post("/", protect, async (req, res) => {
  try {
    const { items, deliveryAddress, totalPrice, deliveryPrice, taxPrice } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" })
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      deliveryAddress,
      totalPrice,
      deliveryPrice,
      taxPrice,
    })

    return res.status(201).json(order)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @GET /api/orders/mine
router.get("/mine", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    return res.json(orders)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

export default router