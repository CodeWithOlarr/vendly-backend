import mongoose from "mongoose"

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  category: String,
  location: String,
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  sales:   { type: Number, default: 0 },
  joined:  { type: String },
  verified: { type: Boolean, default: false },
  description: String,
  banner: String,
  avatar: String,
  color:  String,
}, { timestamps: true })

const Vendor = mongoose.model("Vendor", vendorSchema)
export default Vendor