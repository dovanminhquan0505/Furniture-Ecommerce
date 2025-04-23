const express = require("express");
const cors = require("cors");
const multer = require("multer");
const admin = require("firebase-admin");
const cookieParser = require('cookie-parser');
require("dotenv").config();

// Khởi tạo Firebase Admin SDK
const serviceAccount = require(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const app = express();
app.use(
  cors({
      origin: "https://furniture-ecommerce-frontend-nine.vercel.app",
      credentials: true,
      methods: "GET,POST,PUT,DELETE",
      allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(express.json());
app.use(cookieParser());

const upload = multer({ storage: multer.memoryStorage() });

// Test route
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

// Import routes
const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const sellerRoutes = require("./routes/sellerRoutes");
app.use("/api/sellers",sellerRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin",adminRoutes);

const { uploadFile } = require("./controllers/uploadController");
app.post("/api/upload", upload.single("file"), uploadFile);

const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));