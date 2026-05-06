import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

const router = express.Router()

// Helper to generate token
function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" })
}

// @POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ message: "Email already registered" })
    }

    const user = await User.create({ name, email, phone, password })

    res.status(201).json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      phone: user.phone,
      role:  user.role,
      token: generateToken(user._id),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
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

    res.json({
      _id:   user._id,
      name:  user.name,
      email: user.email,
      phone: user.phone,
      role:  user.role,
      token: generateToken(user._id),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router