import express  from "express"
import jwt      from "jsonwebtoken"
import User     from "../models/User.js"
import protect  from "../middleware/protect.js"
import {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
} from "../utils/emailService.js"

const router = express.Router()

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" })
}

// @POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    const exists = await User.findOne({ email })
    if (exists) {
      // If exists but not verified — resend OTP
      if (!exists.isVerified) {
        const otp       = generateOTP()
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
        exists.otp       = otp
        exists.otpExpiry = otpExpiry
        await exists.save()
        await sendOTPEmail(email, otp, exists.name)
        return res.status(200).json({
          message:     "Account exists but not verified. New OTP sent.",
          email,
          needsVerification: true,
        })
      }
      return res.status(400).json({ message: "Email already registered" })
    }

    // Generate OTP
    const otp       = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    // Create user — not verified yet
    const user = await User.create({
      name,
      email,
      phone,
      password,
      otp,
      otpExpiry,
      isVerified: false,
    })

    // Send OTP email
    await sendOTPEmail(email, otp, name)

    return res.status(201).json({
      message:           "Registration successful. Check your email for OTP.",
      email,
      needsVerification: true,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" })
    }

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP code" })
    }

    // Check expiry
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired. Please register again." })
    }

    // Verify user
    user.isVerified = true
    user.otp        = null
    user.otpExpiry  = null
    await user.save()

    // Send welcome email
    await sendWelcomeEmail(email, user.name)

    return res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      phone: user.phone,
      role:  user.role,
      token: generateToken(user._id),
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @POST /api/auth/resend-otp
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" })
    }

    const otp       = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    user.otp        = otp
    user.otpExpiry  = otpExpiry
    await user.save()

    await sendOTPEmail(email, otp, user.name)

    return res.json({ message: "New OTP sent to your email" })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    // Block unverified users
    if (!user.isVerified) {
      // Resend OTP automatically
      const otp       = generateOTP()
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)
      user.otp        = otp
      user.otpExpiry  = otpExpiry
      await user.save()
      await sendOTPEmail(email, otp, user.name)

      return res.status(403).json({
        message:           "Account not verified. A new OTP has been sent to your email.",
        email,
        needsVerification: true,
      })
    }

    return res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      phone: user.phone,
      role:  user.role,
      token: generateToken(user._id),
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")
    if (!user) return res.status(404).json({ message: "User not found" })
    return res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      phone: user.phone,
      role:  user.role,
      token: req.headers.authorization.split(" ")[1],
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})


// @PUT /api/auth/profile — update profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone } = req.body
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: "User not found" })

    if (name)  user.name  = name
    if (phone) user.phone = phone
    await user.save()

    return res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      phone: user.phone,
      role:  user.role,
      token: req.headers.authorization.split(" ")[1],
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @PUT /api/auth/password — change password
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: "User not found" })

    // Check current password
    const isMatch = await user.matchPassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" })
    }

    user.password = newPassword
    await user.save()

    return res.json({ message: "Password updated successfully" })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: "No account found with this email" })
    }

    const otp       = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    user.otp       = otp
    user.otpExpiry = otpExpiry
    await user.save()

    await sendPasswordResetEmail(email, otp, user.name)

    return res.json({
      message: "Password reset code sent to your email",
      email,
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return res.status(500).json({ message: error.message,
      details: error.response?.body || error.response?.text || null
     })
  }
})

// @POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP code" })
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired. Please try again." })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" })
    }

    user.password  = newPassword
    user.otp       = null
    user.otpExpiry = null
    await user.save()

    return res.json({ message: "Password reset successfully" })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

export default router