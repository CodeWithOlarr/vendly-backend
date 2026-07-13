import express from "express"
import Product from "../models/Product.js"
import Order   from "../models/Order.js"
import User    from "../models/User.js"
import vendorApplication from "../models/VendorApplication.js"
import protect from "../middleware/protect.js"
import admin   from "../middleware/admin.js"

const router = express.Router()

// All admin routes are protected + admin only
router.use(protect, admin)

// ---- STATS ----
router.get("/stats", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments()
    const totalOrders   = await Order.countDocuments()
    const totalUsers    = await User.countDocuments()
    const pendingApplications = await vendorApplication.countDocuments({ status: "pending" })

    const orders      = await Order.find()
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0)

    const recentOrders = await Order
      .find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5)

    return res.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingApplications,
      recentOrders,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// ---- PRODUCTS ----
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    return res.json(products)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

router.post("/products", async (req, res) => {
  try {
    const product = await Product.create(req.body)
    return res.status(201).json(product)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    if (!product) return res.status(404).json({ message: "Product not found" })
    return res.json(product)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: "Product not found" })
    return res.json({ message: "Product deleted" })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// ---- ORDERS ----
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order
      .find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
    return res.json(orders)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

router.put("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: "Order not found" })
    if (req.body.isPaid !== undefined)      order.isPaid      = req.body.isPaid
    if (req.body.isDelivered !== undefined) order.isDelivered = req.body.isDelivered
    const updated = await order.save()
    return res.json(updated)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// ---- USERS ----
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 })
    return res.json(users)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

router.get("/vendor-applications", async (req, res) => {
  try {
    const applications = await vendorApplication
    .find()
    .populate("user", "name email phone")    
    .sort({ createdAt: -1 })
    return res.json(applications)
  } catch (error) {
    return res.status(500).json({
      message: error.message
    })
  }
})

// ---- VENDOR SPECIFIC ----

// Get vendor's own products
router.get("/vendor/products", async (req, res) => {
  try {
    const products = await Product
      .find({ vendor: req.user.name })
      .sort({ createdAt: -1 })
    return res.json(products)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// Get vendor's own orders
router.get("/vendor/orders", async (req, res) => {
  try {
    const orders = await Order
      .find({ "items.vendor": req.user.name })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
    return res.json(orders)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// Get vendor stats
router.get("/vendor/stats", async (req, res) => {
  try {
    const products     = await Product.find({ vendor: req.user.name })
    const totalProducts = products.length

    const orders        = await Order.find()
    const vendorOrders  = orders.filter((o) =>
      o.items.some((item) => item.vendor === req.user.name)
    )

    const totalOrders  = vendorOrders.length
    const totalRevenue = vendorOrders.reduce((sum, order) => {
      const vendorItems = order.items.filter((item) => item.vendor === req.user.name)
      return sum + vendorItems.reduce((s, item) => s + item.price * item.quantity, 0)
    }, 0)

    const recentOrders = vendorOrders.slice(0, 5)

    return res.json({ totalProducts, totalOrders, totalRevenue, recentOrders })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

export default router