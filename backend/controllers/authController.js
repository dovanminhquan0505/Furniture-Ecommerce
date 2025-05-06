const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const { default: axios } = require("axios");
const bcrypt = require("bcryptjs");

const getDb = () => admin.firestore();

const registerUser = async (req, res) => {
    try {
        const db = getDb();
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

const loginUser = async (req, res) => {
    try {
        const db = getDb();
        const { email, password, captchaToken } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        if (!captchaToken) {
            return res.status(400).json({ message: "CAPTCHA verification is required" });
        }

        if (!captchaToken) {
            return res.status(403).json({ message: "CAPTCHA token is required" });
        }

        try {
            // Xác minh reCAPTCHA token với Google với timeout
            const recaptchaResponse = await axios.post(
                "https://www.google.com/recaptcha/api/siteverify",
                null,
                {
                    params: {
                        secret: process.env.RECAPTCHA_SECRET_KEY,
                        response: captchaToken,
                    },
                    timeout: 50000, // 20s 
                }
            );

            const { success } = recaptchaResponse.data;
            if (!success) {
                console.error("reCAPTCHA verification failed. Error codes:", errorCodes);
                return res.status(403).json({ message: "CAPTCHA verification failed" });
            }
        } catch (recaptchaError) {
            console.error("reCAPTCHA verification error:", recaptchaError);
            if (recaptchaError.code === 'ECONNABORTED' || recaptchaError.message.includes('timeout')) {
                return res.status(408).json({ message: "CAPTCHA verification timed out. Please try again." });
            }
            return res.status(500).json({ message: "Error verifying CAPTCHA" });
        }

        // Gọi Firebase Identity Toolkit để xác thực
        try {
            const response = await axios.post(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
                { email, password, returnSecureToken: true },
                { timeout: 20000 } //  20s
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
        } catch (authError) {
            console.error("Firebase authentication error:", authError);
            if (authError.code === 'ECONNABORTED' || authError.message.includes('timeout')) {
                return res.status(408).json({ error: "Authentication request timed out. Please try again." });
            }
            
            if (authError.response?.data?.error) {
                const firebaseError = authError.response.data.error;
                if (firebaseError.message.includes("EMAIL_NOT_FOUND")) {
                    return res.status(404).json({ error: "Account not found" });
                } else if (firebaseError.message.includes("INVALID_PASSWORD")) {
                    return res.status(401).json({ error: "Wrong password" });
                }
            }
            return res.status(500).json({ error: "Authentication error: " + authError.message });
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Server error: " + error.message });
    }
};

const logoutUser = async (req, res) => {
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
const registerSeller = async (req, res) => {
    try {
        const db = getDb();
        const {
            fullName,
            phoneNumber,
            email,
            password,
            confirmPassword,
            storeName,
            storeDescription,
            businessType,
            address,
            city,
            storeEmail,
            userId,
        } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // Kiểm tra nếu email đã tồn tại trong pendingOrders
        const pendingSnapshot = await db.collection("pendingOrders")
            .where("email", "==", email)
            .get();
        if (!pendingSnapshot.empty) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const pendingOrderData = {
            fullName,
            phoneNumber,
            email,
            storeName,
            storeDescription,
            businessType,
            address,
            city,
            storeEmail,
            userId, 
            status: "pending",
            createdAt: new Date(),
        };

        await db.collection("pendingOrders").add(pendingOrderData);
        res.status(200).json({ message: "Seller registration submitted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering seller", error });
    }
};

const googleLogin = async (req, res) => {
    try {
        const db = getDb();
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
            {
                uid,
                email: userData.email,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                role: userData.role,
                sellerId: userData.sellerId || null,
            },
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
                sellerId: userData.sellerId || null,
            },
        });
    } catch (error) {
        console.error("Google login error:", error);
        return res.status(500).json({ error: error.message });
    }
};

const authenticateUser = async (req, res, next) => {
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

const requireSeller = (req, res, next) => {
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

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res
            .status(403)
            .json({ error: "Access denied. Admin permission required." });
    }
};

const refreshToken = async (req, res) => {
    try {
        const db = getDb();
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

const checkSession = async (req, res) => {
    try {
        const db = getDb();
        const sessionToken = req.cookies.session;
        if (!sessionToken) {
            return res.status(401).json({ authenticated: false });
        }

        const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
        const userDoc = await db.collection("users").doc(decoded.uid).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ authenticated: false });
        }

        const userData = userDoc.data();
        
        return res.status(200).json({ 
            authenticated: true, 
            user: {
                uid: decoded.uid,
                username: userData.displayName,
                email: userData.email,
                photoURL: userData.photoURL,
                role: userData.role,
                sellerId: userData.sellerId || null
            }
        });
    } catch (error) {
        return res.status(401).json({ authenticated: false });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    googleLogin,
    authenticateUser,
    requireAdmin,
    refreshToken,
    registerSeller,
    checkSession,
    requireSeller,
};