const admin = require("firebase-admin");
const db = admin.firestore();
const jwt = require("jsonwebtoken");
const { default: axios } = require("axios");

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password, fileURL } = req.body;

        if (!email.includes("@")) {
            return res.status(400).json({ error: "Invalid email address" });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
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

        const role = email === process.env.REACT_APP_FURNITURE_ECOMMERCE_ADMIN_EMAIL ? "admin" : "user";

        await db.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            displayName: username,
            email,
            photoURL: fileURL,
            role: role,
            createdAt: admin.firestore.Timestamp.now(),
        });

        const token = jwt.sign(
            { uid: userRecord.uid, email, role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        const refreshToken = jwt.sign(
            { uid: userRecord.uid, email, role },
            process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret-key",
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            message: "User registered successfully",
            user: { uid: userRecord.uid, username, email, photoURL: fileURL, role },
            token,
            refreshToken
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
            return res.status(400).json({ error: "Email and password are required" });
        }

        try {
            const response = await axios.post(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
                { email, password, returnSecureToken: true }
            );

            const firebaseUser = response.data;
            const uid = firebaseUser.localId;

            const userDoc = await db.collection("users").doc(uid).get();
            if (!userDoc.exists) {
                return res.status(404).json({ error: "User not found in database" });
            }

            const userData = userDoc.data();

            const token = jwt.sign(
                { uid, email, role: userData.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            const refreshToken = jwt.sign(
                { uid, email, role: userData.role },
                process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret-key",
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                message: "Login successful",
                user: {
                    uid,
                    username: userData.displayName,
                    email: userData.email,
                    photoURL: userData.photoURL,
                    role: userData.role
                },
                token,
                refreshToken
            });
        } catch (error) {
            console.error("Login error details:", error);
            if (error.code === 'auth/user-not-found') {
                return res.status(404).json({ error: "Account not found" });
            } else if (error.code === 'auth/wrong-password') {
                return res.status(401).json({ error: "Wrong password" });
            } else if (error.code === 'auth/invalid-email') {
                return res.status(400).json({ error: "Invalid email" });
            } else {
                return res.status(401).json({ error: "Authentication failed: " + error.message });
            }
        }
    } catch (error) {
        console.error("General login error:", error);
        return res.status(500).json({ error: "Server error: " + error.message });
    }
};

exports.logoutUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.startsWith("Bearer ") 
            ? req.headers.authorization.split(" ")[1] 
            : null;

        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        await admin.auth().revokeRefreshTokens(decodedToken.uid);

        return res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ error: "Server error: " + error.message });
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
                displayName: name || email.split('@')[0],
                email,
                photoURL: picture || null,
                role,
                loginStatus: "Google",
                createdAt: admin.firestore.Timestamp.now(),
            });
            userDoc = await db.collection("users").doc(uid).get();
        }

        const userData = userDoc.data();

        const token = jwt.sign(
            { uid, email, role: userData.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        const refreshToken = jwt.sign(
            { uid, email, role: userData.role },
            process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret-key",
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: "Google login successful",
            user: {
                uid,
                username: userData.displayName,
                email: userData.email,
                photoURL: userData.photoURL,
                role: userData.role
            },
            token,
            refreshToken
        });
    } catch (error) {
        console.error("Google login error:", error);
        return res.status(500).json({ error: error.message });
    }
};

exports.authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token expired" });
        }
        return res.status(401).json({ error: "Invalid token" });
    }
};

exports.requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: "Access denied. Admin permission required." });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: "No refresh token provided" });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const { uid, email } = decoded;

        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userDoc.data();

        const newAccessToken = jwt.sign(
            { uid, email, role: userData.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            token: newAccessToken,
            user: {
                uid,
                username: userData.displayName,
                email: userData.email,
                photoURL: userData.photoURL,
                role: userData.role
            }
        });
    } catch (error) {
        console.error("Refresh token error:", error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Refresh token expired" });
        }
        return res.status(401).json({ error: "Invalid refresh token" });
    }
};