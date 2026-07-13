import mongoose from "mongoose"
import bcrypt   from "bcryptjs"

const userSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, "Name is required"],
    trim:     true,
  },
  email: {
    type:     String,
    required: [true, "Email is required"],
    unique:   true,
    lowercase: true,
    trim:     true,
  },
  phone: {
    type:     String,
    required: [true, "Phone is required"],
  },
  password: {
    type:     String,
    required: [true, "Password is required"],
    minlength: 6,
  },
  role: {
    type:    String,
    enum:    ["buyer", "vendor", "admin"],
    default: "buyer",
  },
  avatar: {
    type:    String,
    default: "",
  },

  // ✅ OTP fields
  isVerified: {
    type:    Boolean,
    default: false,
  },
  otp: {
    type:    String,
    default: null,
  },
  otpExpiry: {
    type:    Date,
    default: null,
  },

}, { timestamps: true })

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return
  const salt    = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
})

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

const User = mongoose.model("User", userSchema)
export default User