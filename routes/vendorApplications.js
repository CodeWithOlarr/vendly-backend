import express           from "express"
import VendorApplication from "../models/VendorApplication.js"
import Vendor            from "../models/Vendor.js"
import User              from "../models/User.js"
import protect           from "../middleware/protect.js"
import admin             from "../middleware/admin.js"
import * as Brevo        from "@getbrevo/brevo"

const router = express.Router()

// ===== Brevo Email Helper =====
async function sendEmail({ to, subject, html }) {
  const apiInstance = new Brevo.TransactionalEmailsApi()
  apiInstance.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY

  const email          = new Brevo.SendSmtpEmail()
  email.subject        = subject
  email.htmlContent    = html
  email.sender         = { name: "Vendly", email: process.env.EMAIL_USER }
  email.to             = [{ email: to }]

  await apiInstance.sendTransacEmail(email)
  console.log("✅ Email sent to", to)
}

// @POST /api/vendor-applications — submit application
router.post("/", protect, async (req, res) => {
  try {
    const { storeName, category, location, description, phone, instagram } = req.body

    const existing = await VendorApplication.findOne({ user: req.user._id })
    if (existing) {
      return res.status(400).json({
        message: `You already have a ${existing.status} application`,
        status:  existing.status,
      })
    }

    if (req.user.role === "vendor") {
      return res.status(400).json({ message: "You are already a vendor" })
    }

    const application = await VendorApplication.create({
      user: req.user._id,
      storeName,
      category,
      location,
      description,
      phone,
      instagram,
    })

    // Notify admin by email
    try {
      await sendApplicationEmail(req.user.name, storeName, req.user.email)
    } catch (emailErr) {
      console.error("Admin notification email failed:", emailErr.message)
    }

    return res.status(201).json(application)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @GET /api/vendor-applications/mine
router.get("/mine", protect, async (req, res) => {
  try {
    const application = await VendorApplication.findOne({ user: req.user._id })
    return res.json(application || null)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @GET /api/vendor-applications — admin only
router.get("/", protect, admin, async (req, res) => {
  try {
    const applications = await VendorApplication
      .find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
    return res.json(applications)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @PUT /api/vendor-applications/:id — admin approve or reject
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { status, adminNote } = req.body
    const application = await VendorApplication
      .findById(req.params.id)
      .populate("user", "name email")

    if (!application) {
      return res.status(404).json({ message: "Application not found" })
    }

    application.status    = status
    application.adminNote = adminNote || ""
    await application.save()

    if (status === "approved") {
      await User.findByIdAndUpdate(application.user._id, { role: "vendor" })

      const slug = application.storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")

      const existingVendor = await Vendor.findOne({ slug })
      if (!existingVendor) {
        await Vendor.create({
          name:        application.storeName,
          slug:        `${slug}-${Date.now()}`,
          category:    application.category,
          location:    application.location,
          description: application.description,
          rating:      0,
          reviews:     0,
          sales:       0,
          joined:      new Date().getFullYear().toString(),
          verified:    true,
          banner:      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=300&fit=crop",
          avatar:      application.storeName.slice(0, 2).toUpperCase(),
          color:       "bg-blue-600",
        })
      }

      try {
        await sendApprovalEmail(application.user.email, application.user.name, application.storeName)
      } catch (emailErr) {
        console.error("Approval email failed:", emailErr.message)
      }
    }

    if (status === "rejected") {
      try {
        await sendRejectionEmail(application.user.email, application.user.name, adminNote)
      } catch (emailErr) {
        console.error("Rejection email failed:", emailErr.message)
      }
    }

    return res.json(application)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// ===== Email Functions =====
async function sendApplicationEmail(userName, storeName, userEmail) {
  await sendEmail({
    to:      process.env.EMAIL_USER,
    subject: `New Vendor Application — ${storeName}`,
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;max-width:520px;">
        <div style="background:#1E3A5F;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#2563EB;margin:0;font-size:28px;">Vendly</h1>
        </div>
        <h2 style="color:#2563EB;">New Vendor Application</h2>
        <p><strong>Applicant:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Store Name:</strong> ${storeName}</p>
        <p>Login to your admin dashboard to review and approve or reject this application.</p>
        <a href="https://vendly-store.vercel.app/admin/vendor-applications"
          style="display:inline-block;background:#2563EB;color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:700;margin-top:16px;">
          Review Application →
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">© 2026 Vendly. All rights reserved.</p>
      </div>
    `,
  })
}

async function sendApprovalEmail(to, name, storeName) {
  await sendEmail({
    to,
    subject: "Your Vendly Vendor Application is Approved!",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:16px;">
        <div style="background:#1E3A5F;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#2563EB;margin:0;font-size:28px;">Vendly</h1>
        </div>
        <h2 style="color:#1f2937;">Congratulations, ${name}! 🎉</h2>
        <p style="color:#6b7280;">Your vendor application for <strong>${storeName}</strong> has been approved!</p>
        <p style="color:#6b7280;">You can now login to your Vendly account and access your Vendor Dashboard to start adding products.</p>
        <a href="https://vendly-store.vercel.app/vendor/dashboard"
          style="display:inline-block;background:#2563EB;color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:700;margin-top:16px;">
          Go to Vendor Dashboard →
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">© 2026 Vendly. All rights reserved.</p>
      </div>
    `,
  })
}

async function sendRejectionEmail(to, name, reason) {
  await sendEmail({
    to,
    subject: "Update on your Vendly Vendor Application",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:16px;">
        <div style="background:#1E3A5F;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#2563EB;margin:0;font-size:28px;">Vendly</h1>
        </div>
        <h2 style="color:#1f2937;">Hi ${name},</h2>
        <p style="color:#6b7280;">Thank you for applying to become a vendor on Vendly. After careful review, we are unable to approve your application at this time.</p>
        ${reason ? `<p style="color:#6b7280;"><strong>Reason:</strong> ${reason}</p>` : ""}
        <p style="color:#6b7280;">You are welcome to apply again after addressing the concerns above.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">© 2026 Vendly. All rights reserved.</p>
      </div>
    `,
  })
}

export default router