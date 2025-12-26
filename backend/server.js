const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./models/userModel");
const Product = require("./models/productModel");
const Order = require("./models/orderModel");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/lavka_app", {})
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    // Do not exit process, so Render keeps trying or logs the error visible to user
  });

// --- AUTH MIDDLEWARE ---
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (req.user) next();
      else res.status(401).json({ message: "Not authorized" });
    } catch (error) {
      res.status(401).json({ message: "Token failed" });
    }
  } else {
    res.status(401).json({ message: "No token" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) next();
  else res.status(401).json({ message: "Admin only" });
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// --- RATE LIMITING ---
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Increased slightly for prod usage
  message: {
    message:
      "Juda ko'p urinish qilindi. Iltimos, 15 daqiqadan keyin urinib ko'ring.",
  },
});

// --- ROUTES ---

// 1. Auth & Users
app.use("/api/users", authLimiter);

app.post("/api/users/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res
        .status(400)
        .json({ message: "Barcha maydonlar to'ldirilishi shart!" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Parol kamida 6 belgidan iborat bo'lishi kerak!" });
    }

    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: "Bu raqam band" });
    }

    const user = await User.create({
      name,
      phone,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Telefon va parol kiritilishi shart!" });
    }

    const user = await User.findOne({ phone });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Telefon yoki parol xato" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/products", protect, admin, async (req, res) => {
  const { name, price, stock, category } = req.body;

  if (!name || !price || stock === undefined) {
    return res
      .status(400)
      .json({
        message: "Mahsulot nomi, narxi va qoldig'i ko'rsatilishi shart!",
      });
  }

  try {
    const product = new Product({
      name,
      price,
      stock,
      category: category || "General",
      image: req.body.image || "📦",
      imageUrl: req.body.imageUrl,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/products/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Orders
app.get("/api/orders", protect, async (req, res) => {
  try {
    let orders;
    if (req.user.isAdmin) {
      orders = await Order.find({}).sort({ createdAt: -1 });
    } else {
      orders = await Order.find({
        $or: [
          { userId: req.user._id }, // If we linked by ID
          { "details.phone": req.user.phone }, // Fallback for phone matching
        ],
      }).sort({ createdAt: -1 });
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/orders", async (req, res) => {
  let userId = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (e) {}
  }

  const { items, details, total } = req.body;

  if (items && items.length === 0) {
    return res.status(400).json({ message: "No order items" });
  } else {
    const order = new Order({
      items,
      userId,
      details,
      total,
      date: new Date().toLocaleDateString(),
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  }
});

app.put("/api/orders/:id", protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = req.body.status || order.status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Seed Admin
app.get("/api/seed", async (req, res) => {
  try {
    const adminPhone = "+998901234567";
    const userExists = await User.findOne({ phone: adminPhone });

    if (!userExists) {
      const user = await User.create({
        name: "Admin",
        phone: adminPhone,
        password: "admin_password_change_me", // Changed for safety, though user code had '123456'
        isAdmin: true,
      });
      res.send("Admin created!");
    } else {
      res.send("Admin already exists.");
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/", (req, res) => res.send("Lavka Server is Running (MongoDB)"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
