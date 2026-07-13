import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import connectDB from "./config/db.js"
import authRoutes    from "./routes/auth.js"
import productRoutes from "./routes/products.js"
import vendorRoutes  from "./routes/vendors.js"
import orderRoutes   from "./routes/orders.js"
import adminRoutes from "./routes/admin.js"
import reviewRoutes from "./routes/reviews.js"
import paymentRoutes from "./routes/payment.js"
import vendorDashboardRoutes    from "./routes/vendor.js"
import vendorApplicationRoutes  from "./routes/vendorApplications.js"
import chatRoutes from "./routes/chat.js"

connectDB()

const app = express()

// Middleware
app.use(cors({ 
    origin: [
    "http://localhost:5173",
    "https://shophub-frontend-tawny.vercel.app"
    ]
}))


app.use(express.json())

// Routes
app.use("/api/auth",     authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/products", reviewRoutes)
app.use("/api/vendors",  vendorRoutes)
app.use("/api/orders",   orderRoutes)
app.use("/api/payment", paymentRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/vendor", vendorDashboardRoutes)
app.use("/api/vendor-applications", vendorApplicationRoutes) 
app.use("/api/chat", chatRoutes)

// Health check
app.get("/", (req, res) => {
  res.json({ message: "ShopHub API is running" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})