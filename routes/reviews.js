import express from "express"
import Review  from "../models/Review.js"
import Product from "../models/Product.js"
import protect from "../middleware/protect.js"

const router = express.Router()

// @GET /api/products/:id/reviews — get all reviews for a product
router.get("/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review
      .find({ product: req.params.id })
      .populate("user", "name")
      .sort({ createdAt: -1 })
    return res.json(reviews)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @POST /api/products/:id/reviews — submit a review (protected)
router.post("/:id/reviews", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body

    // Check if user already reviewed this product
    const existing = await Review.findOne({
      product: req.params.id,
      user:    req.user._id,
    })
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this product" })
    }

    // Create review
    const review = await Review.create({
      product: req.params.id,
      user:    req.user._id,
      name:    req.user.name,
      rating:  Number(rating),
      comment,
    })

    // Recalculate product rating and review count
    const allReviews = await Review.find({ product: req.params.id })
    const avgRating  = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

    await Product.findByIdAndUpdate(req.params.id, {
      rating:  Math.round(avgRating * 10) / 10,
      reviews: allReviews.length,
    })

    return res.status(201).json(review)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

export default router