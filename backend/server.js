const express = require("express");
const cors = require("cors");
const multer = require("multer");
const admin = require("firebase-admin");
const cookieParser = require("cookie-parser");
const fs = require("fs");
require("dotenv").config();

// Khởi tạo Firebase Admin SDK
try {
    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
        console.log("Skipping Firebase initialization in test mode with mocked Firestore");
    } else if (process.env.FIRESTORE_EMULATOR_HOST) {
        console.log("Initializing Firebase for emulator:", process.env.FIRESTORE_EMULATOR_HOST);
        admin.initializeApp({
            projectId: "furniture-ecommerce-435809",
        });
    } else {
        console.log("Initializing Firebase with FIREBASE_CREDENTIALS");
        if (!process.env.FIREBASE_CREDENTIALS) {
            throw new Error("FIREBASE_CREDENTIALS is not defined");
        }
        let credentials;
        try {
            credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
        } catch (parseError) {
            console.error("Failed to parse FIREBASE_CREDENTIALS:", parseError.message);
            throw new Error(`Invalid FIREBASE_CREDENTIALS: ${parseError.message}`);
        }
        admin.initializeApp({
            credential: admin.credential.cert(credentials),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
        console.log("Firebase initialized successfully");
    }
} catch (error) {
    console.error("Firebase initialization error:", error.message);
    if (process.env.NODE_ENV !== 'test') {
        throw error;
    }
    console.warn("Continuing in test mode without Firebase initialization");
}

const app = express();

const corsOptions = {
    origin: [
        "https://furniture-ecommerce-frontend-nine.vercel.app",
        "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "session"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Ensure CORS headers are set for all responses
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    next();
});

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
app.use("/api/sellers", sellerRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const { uploadFile } = require("./controllers/uploadController");
app.post("/api/upload", upload.single("file"), uploadFile);

const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

// Start server locally for development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;