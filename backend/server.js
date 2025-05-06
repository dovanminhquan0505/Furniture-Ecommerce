const express = require("express");
const cors = require("cors");
const multer = require("multer");
const admin = require("firebase-admin");
const cookieParser = require("cookie-parser");
const fs = require("fs");
require("dotenv").config();

// Khởi tạo Firebase Admin SDK
let serviceAccount;
try {
    if (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST) {
        console.log("Skipping Firebase initialization in test mode with mocked Firestore");
        // Mocked Firebase will handle initialization
    } else if (process.env.FIRESTORE_EMULATOR_HOST) {
        console.log("Initializing Firebase for emulator:", process.env.FIRESTORE_EMULATOR_HOST);
        admin.initializeApp({
            projectId: "furniture-ecommerce-435809",
        });
    } else if (process.env.FIREBASE_CREDENTIALS) {
        console.log("Attempting to parse FIREBASE_CREDENTIALS");
        try {
            let credentials = process.env.FIREBASE_CREDENTIALS;
            if (credentials.startsWith('./') || credentials.startsWith('/')) {
                credentials = fs.readFileSync(credentials, 'utf8');
            }
            serviceAccount = JSON.parse(credentials);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            });
        } catch (parseError) {
            throw new Error(`Invalid FIREBASE_CREDENTIALS: ${parseError.message}`);
        }
    } else {
        console.log("Using environment variable FIREBASE_PRIVATE_KEY");
        if (!process.env.FIREBASE_PRIVATE_KEY) {
            throw new Error("FIREBASE_PRIVATE_KEY is not defined in environment variables");
        }
        serviceAccount = {
            type: "service_account",
            project_id: "furniture-ecommerce-435809",
            private_key_id: "34ce2310c6e3fc906afedfcbcb649d3b22114e8d",
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: "firebase-adminsdk-6ba3g@furniture-ecommerce-435809.iam.gserviceaccount.com",
            client_id: "100529504381321459560",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-6ba3g%40furniture-ecommerce-435809.iam.gserviceaccount.com",
            universe_domain: "googleapis.com"
        };
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
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

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
if (process.env.NODE_ENV !== "test") {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;