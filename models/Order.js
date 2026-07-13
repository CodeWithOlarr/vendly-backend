import mongoose from "mongoose"

const orderItemSchema = new mongoose.Schema({
  name:     { type: String,  required: true },
  image:    { type: String,  required: true },
  price:    { type: Number,  required: true },
  quantity: { type: Number,  required: true },
  product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
})

const orderSchema = new mongoose.Schema({
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "User",
    required: true,
  },
  items:           [orderItemSchema],
  deliveryAddress: {
    fullName: String,
    phone:    String,
    address:  String,
    city:     String,
    state:    String,
  },
  paymentMethod: {
    type:    String,
    default: "Paystack",
  },
  paymentReference: {
    type:    String,
    default: null,
  },
  isPaid: {
    type:    Boolean,
    default: false,
  },
  paidAt: {
    type:    Date,
    default: null,
  },
  isDelivered: {
    type:    Boolean,
    default: false,
  },
  deliveredAt: {
    type:    Date,
    default: null,
  },
  totalPrice:    { type: Number, required: true },
  deliveryPrice: { type: Number, default: 2500  },
  taxPrice:      { type: Number, default: 0     },
}, { timestamps: true })

const Order = mongoose.model("Order", orderSchema)
export default Order