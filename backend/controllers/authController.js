const admin = require("firebase-admin");
const db = admin.firestore();
const jwt = require("jsonwebtoken");
const { default: axios } = require("axios");
const bcrypt = require("bcryptjs");

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password, fileURL } = req.body;

        if (!email.includes("@")) {
            return res.status(400).json({ error: "Invalid email address" });
        }
        if (password.length < 6) {
            return res
                .status(400)
                .json({ error: "Password must be at least 6 characters" });
        }
        if (!fileURL) {
            return res.status(400).json({ error: "File upload is required" });
        }

        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: username,
            photoURL: fileURL,
        });

        const role =
            email === process.env.REACT_APP_FURNITURE_ECOMMERCE_ADMIN_EMAIL
                ? "admin"
                : "user";

        await db.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            displayName: username,
            email,
            photoURL: fileURL,
            role: role,
            createdAt: admin.firestore.Timestamp.now(),
        });

        // Tạo session token
        const sessionToken = jwt.sign(
            { uid: userRecord.uid, role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Gửi cookie HTTP-only
        res.cookie("session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", 
            sameSite: "Strict",
            maxAge: 3600000, // 1h
        });

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                uid: userRecord.uid,
                username,
                email,
                photoURL: fileURL,
                role,
            },
        });
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            return res.status(400).json({ error: "Email is already in use" });
        }
        return res.status(500).json({ error: error.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email and password are required" });
        }

        // Gọi Firebase Identity Toolkit để xác thực
        const response = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
            { email, password, returnSecureToken: true }
        );

        const firebaseUser = response.data;
        const uid = firebaseUser.localId;

        // Lấy thông tin người dùng từ Firestore
        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return res
                .status(404)
                .json({ error: "User not found in database" });
        }

        const userData = userDoc.data();

        // Tạo session token
        const sessionToken = jwt.sign(
            { uid, role: userData.role, sellerId: userData.sellerId || null },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Gửi cookie HTTP-only
        res.cookie("session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 3600000,
        });

        return res.status(200).json({
            message: "Login successful",
            user: {
                uid,
                username: userData.displayName,
                email: userData.email,
                photoURL: userData.photoURL,
                role: userData.role,
                sellerId: userData.sellerId || null,
            },
        });
    } catch (error) {
        if (error.response?.data?.error) {
            const firebaseError = error.response.data.error;
            if (firebaseError.message.includes("EMAIL_NOT_FOUND")) {
                return res.status(404).json({ error: "Account not found" });
            } else if (firebaseError.message.includes("INVALID_PASSWORD")) {
                return res.status(401).json({ error: "Wrong password" });
            }
        }
        return res.status(500).json({ error: "Server error: " + error.message });
    }
};

exports.logoutUser = async (req, res) => {
    try {
        const sessionToken = req.cookies.session;
        if (!sessionToken) {
            return res.status(200).json({ message: "Already logged out" });
        }

        res.cookie("session", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 0,
        });

        return res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ error: "Server error: " + error.message });
    }
};

//Seller
exports.registerSeller = async (req, res) => {
    const {
        fullName,
        phoneNumber,
        email,
        password,
        storeName,
        storeDescription,
        businessType,
        address,
        city,
        storeEmail,
    } = req.body;

    try {
        const pendingQuery = db
            .collection("pendingOrders")
            .where("email", "==", email);
        const sellersQuery = db
            .collection("sellers")
            .where("email", "==", email);
        const [pendingSnapshot, sellersSnapshot] = await Promise.all([
            pendingQuery.get(),
            sellersQuery.get(),
        ]);

        if (!pendingSnapshot.empty || !sellersSnapshot.empty) {
            return res.status(400).json({
                message: "Email already exists or is pending approval",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const pendingOrderRef = db.collection("pendingOrders").doc();
        await pendingOrderRef.set({
            fullName,
            phoneNumber,
            email,
            storeName,
            storeDescription,
            businessType,
            address,
            city,
            storeEmail,
            hashedPassword,
            status: "pending",
            createdAt: new Date(),
            notification: false,
        });

        await db.collection("adminNotifications").add({
            type: "newSellerRequest",
            sellerId: pendingOrderRef.id,
            createdAt: new Date(),
            read: false,
        });

        res.status(201).json({
            message: "Seller registration submitted, awaiting approval",
        });
    } catch (error) {
        res.status(500).json({ message: "Error registering seller", error });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        let userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            const role = email === process.env.REACT_APP_FURNITURE_ECOMMERCE_ADMIN_EMAIL ? "admin" : "user";
            await db.collection("users").doc(uid).set({
                uid,
                displayName: name || email.split("@")[0],
                email,
                photoURL: picture || null,
                role,
                loginStatus: "Google",
                createdAt: admin.firestore.Timestamp.now(),
            });
            userDoc = await db.collection("users").doc(uid).get();
        }

        const userData = userDoc.data();

        // Tạo session token
        const sessionToken = jwt.sign(
            { uid, role: userData.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Gửi cookie HTTP-only
        res.cookie("session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 3600000,
        });

        return res.status(200).json({
            message: "Google login successful",
            user: {
                uid,
                username: userData.displayName,
                email: userData.email,
                photoURL: userData.photoURL,
                role: userData.role,
            },
        });
    } catch (error) {
        console.error("Google login error:", error);
        return res.status(500).json({ error: error.message });
    }
};

exports.authenticateUser = async (req, res, next) => {
    try {
        const sessionToken = req.cookies.session;
        if (!sessionToken) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired session" });
    }
};

exports.requireSeller = (req, res, next) => {
    if (
        req.user &&
        (req.user.status === "seller" || req.user.status === "approved")
    ) {
        next();
    } else {
        return res
            .status(403)
            .json({ error: "Access denied. Seller permission required." });
    }
};

exports.requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res
            .status(403)
            .json({ error: "Access denied. Admin permission required." });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: "No refresh token provided" });
        }

        // Làm mới token bằng Firebase Identity Toolkit
        const response = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
            { idToken: refreshToken }
        );

        const uid = response.data.users[0].localId;
        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userDoc.data();
        const newCustomToken = await admin.auth().createCustomToken(uid, {
            role: userData.role,
            sellerId: userData.sellerId || null,
        });

        return res.status(200).json({
            token: newCustomToken,
            user: {
                uid,
                username: userData.displayName,
                email: userData.email,
                photoURL: userData.photoURL,
                role: userData.role,
                sellerId: userData.sellerId || null,
            },
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        return res
            .status(401)
            .json({ error: "Invalid or expired refresh token" });
    }
};
