import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: 0,
  },
  oldPrice: {
    type: Number,
    default: null,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Phones", "Laptops", "Audio", "Fashion", "Cameras", "Watches", "Fitness", "Home & Living", "Electronics"],
  },
  vendor: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  badge: {
    type: String,
    enum: ["Hot", "Sale", "New", "Top Rated", null],
    default: null,
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true })

const Product = mongoose.model("Product", productSchema)
export default Product