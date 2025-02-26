const express = require("express");
const cors = require("cors");
const multer = require("multer");
const admin = require("firebase-admin");
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
      origin: "http://localhost:3000",
      credentials: true,
      methods: "GET,POST,PUT,DELETE",
      allowedHeaders: "Content-Type,Authorization",
  })
);
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Test route
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

// Import routes
const totalOrderRoutes = require("./routes/totalOrderRoutes");
app.use("/api/totalOrders", totalOrderRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const { uploadFile } = require("./controllers/uploadController");
app.post("/api/upload", upload.single("file"), uploadFile);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));