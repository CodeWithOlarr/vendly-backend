import express from "express"
import Product from "../models/Product.js"

const router = express.Router()

// @GET /api/products
router.get("/", async (req, res) => {
  try {
    const { category, search, sort, inStock, featured } = req.query

    let query = {}

    if (category && category !== "All") {
      query.category = category
    }

    if (search) {
      query.$or = [
        { name:     { $regex: search, $options: "i" } },
        { vendor:   { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ]
    }

    if (inStock === "true") {
      query.inStock = true
    }

    // ✅ Featured filter
    if (featured === "true") {
      query.featured = true
    }

    let sortField = "createdAt"
    let sortOrder = -1

    if (sort === "price_asc")  { sortField = "price";   sortOrder =  1 }
    if (sort === "price_desc") { sortField = "price";   sortOrder = -1 }
    if (sort === "rating")     { sortField = "rating";  sortOrder = -1 }
    if (sort === "reviews")    { sortField = "reviews"; sortOrder = -1 }

    const products = await Product.find(query).sort({ [sortField]: sortOrder })
    return res.json(products)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @GET /api/products/counts
router.get("/counts", async (req, res) => {
  try {
    const counts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ])
    const result = {}
    counts.forEach(({ _id, count }) => { result[_id] = count })
    return res.json(result)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

// @GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }
    return res.json(product)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

export default router