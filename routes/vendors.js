import express from "express";
import Vendor from "../models/Vendor.js";

const router = express.Router();

// GET
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }
    const vendors = await Vendor.find(query);
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET :id
router.get("/:slug", async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ slug: req.params.slug });
    if (!vendor) {
      return res.status(404).json({ message: error.message });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
