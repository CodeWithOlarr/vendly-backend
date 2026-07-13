import express          from "express"
import Product          from "../models/Product.js"
import Order            from "../models/Order.js"
import protect          from "../middleware/protect.js"
import vendorMiddleware from "../middleware/vendor.js"

const router = express.Router()

// All vendor routes require login + vendor role
router.use(protect, vendorMiddleware)

// @GET /api/vendor/stats
router.get("/stats", async (req, res) => {
  try {
    const products      = await Product.find({ vendor: req.user.name })
    const totalProducts = products.length
    const productNames  = products.map((p) => p.name)

    const allOrders = await Order
      .find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })

    const vendorOrders = allOrders.filter((o) =>
      o.items.some((item) => productNames.includes(item.name))
    )

    const totalOrders  = vendorOrders.length
    const totalRevenue = vendorOrders.reduce((sum, order) => {
      const myItems = order.items.filter((item) => productNames.includes(item.name))
      return sum + myItems.reduce((s, i) => s + i.price * i.quantity, 0)
    }, 0)

    const recentOrders = vendorOrders.slice(0, 5)

    return res.json({ totalProducts, totalOrders, totalRevenue, recentOrders })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @GET /api/vendor/products
router.get("/products", async (req, res) => {
  try {
    const products = await Product
      .find({ vendor: req.user.name })
      .sort({ createdAt: -1 })
    return res.json(products)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @POST /api/vendor/products
router.post("/products", async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      vendor: req.user.name,
    })
    return res.status(201).json(product)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @PUT /api/vendor/products/:id
router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: "Product not found" })

    if (product.vendor !== req.user.name) {
      return res.status(403).json({ message: "Not authorized to edit this product" })
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, vendor: req.user.name },
      { new: true, runValidators: true }
    )
    return res.json(updated)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @DELETE /api/vendor/products/:id
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: "Product not found" })

    if (product.vendor !== req.user.name) {
      return res.status(403).json({ message: "Not authorized to delete this product" })
    }

    await Product.findByIdAndDelete(req.params.id)
    return res.json({ message: "Product deleted" })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @GET /api/vendor/orders
router.get("/orders", async (req, res) => {
  try {
    const products     = await Product.find({ vendor: req.user.name })
    const productNames = products.map((p) => p.name)

    const allOrders = await Order
      .find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })

    const vendorOrders = allOrders
      .filter((o) => o.items.some((item) => productNames.includes(item.name)))
      .map((order) => ({
        ...order.toObject(),
        items: order.items.filter((item) => productNames.includes(item.name)),
      }))

    return res.json(vendorOrders)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

export default router