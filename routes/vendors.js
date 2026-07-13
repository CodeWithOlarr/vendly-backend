import express from "express"
import Vendor  from "../models/Vendor.js"
import Product from "../models/Product.js"
import Order   from "../models/Order.js"
import Review  from "../models/Review.js"

const router = express.Router()

// @GET /api/vendors
router.get("/", async (req, res) => {
  try {
    const { search } = req.query
    let query = {}
    if (search) {
      query.$or = [
        { name:     { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    const vendors = await Vendor.find(query)

    const vendorsWithStats = await Promise.all(
      vendors.map(async (vendor) => {

        // ✅ Real product count
        const productCount   = await Product.countDocuments({ vendor: vendor.name })

        // ✅ Real review count + real average rating
        const vendorProducts = await Product.find({ vendor: vendor.name })
        const productIds     = vendorProducts.map((p) => p._id)
        const allReviews     = await Review.find({ product: { $in: productIds } })
        const reviewCount    = allReviews.length
        const avgRating      = reviewCount > 0
          ? Math.round(
              (allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10
            ) / 10
          : 0

        // ✅ Real sales count from orders
        const allOrders    = await Order.find()
        const totalSales   = allOrders.reduce((sum, order) => {
          const vendorItems = order.items.filter((i) => i.vendor === vendor.name)
          return sum + vendorItems.reduce((s, i) => s + i.quantity, 0)
        }, 0)

        return {
          ...vendor.toObject(),
          productCount,
          reviews: reviewCount,
          rating:  avgRating > 0 ? avgRating : 0,
          sales:   totalSales,
        }
      })
    )

    return res.json(vendorsWithStats)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @GET /api/vendors/:slug
router.get("/:slug", async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ slug: req.params.slug })
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    // ✅ Real stats for vendor store page
    const productCount   = await Product.countDocuments({ vendor: vendor.name })
    const vendorProducts = await Product.find({ vendor: vendor.name })
    const productIds     = vendorProducts.map((p) => p._id)
    const allReviews     = await Review.find({ product: { $in: productIds } })
    const reviewCount    = allReviews.length
    const avgRating      = reviewCount > 0
      ? Math.round(
          (allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10
        ) / 10
      : 0

    const allOrders  = await Order.find()
    const totalSales = allOrders.reduce((sum, order) => {
      const vendorItems = order.items.filter((i) => i.vendor === vendor.name)
      return sum + vendorItems.reduce((s, i) => s + i.quantity, 0)
    }, 0)

    return res.json({
      ...vendor.toObject(),
      productCount,
      reviews: reviewCount,
      rating:  avgRating > 0 ? avgRating : 0,
      sales:   totalSales,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

export default router