import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./config/db.js"
import authRoutes    from "./routes/auth.js"
import productRoutes from "./routes/products.js"
import vendorRoutes  from "./routes/vendors.js"
import orderRoutes   from "./routes/orders.js"

dotenv.config()
connectDB()

const app = express()

// Middleware
app.use(cors({ origin: "http://localhost:5173" }))
app.use(express.json())

// Routes
app.use("/api/auth",     authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/vendors",  vendorRoutes)
app.use("/api/orders",   orderRoutes)

// Health check
app.get("/", (req, res) => {
  res.json({ message: "ShopHub API is running" })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})