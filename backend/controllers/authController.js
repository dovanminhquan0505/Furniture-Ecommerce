const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const db = admin.firestore();
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res) => {
    try {
        const { username, email, password, fileURL } = req.body;

        // Kiểm tra email hợp lệ
        if (!email.includes("@")) {
            return res.status(400).json({ error: "Invalid email address" });
        }

        // Kiểm tra độ dài password
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        // Kiểm tra file
        if (!fileURL) {
            return res.status(400).json({ error: "File upload is required" });
        }

        // Tạo tài khoản trên Firebase Authentication
        const userRecord = await getAuth().createUser({
            email,
            password,
            displayName: username,
            photoURL: fileURL,
        });

        // Kiểm tra vai trò (admin hoặc user)
        const role = email === process.env.REACT_APP_FURNITURE_ECOMMERCE_ADMIN_EMAIL ? "admin" : "user";

        // Lưu thông tin user vào Firestore
        await db.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            displayName: username,
            email,
            photoURL: fileURL,
            role: role,
            createdAt: admin.firestore.Timestamp.now(),
        });

        // Tạo JWT token để trả về
        const token = jwt.sign(
            { uid: userRecord.uid, email, role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(201).json({
            message: "User registered successfully",
            user: { uid: userRecord.uid, username, email, photoURL: fileURL, role },
            token
        });

    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            return res.status(400).json({ error: "Email is already in use" });
        }
        return res.status(500).json({ error: error.message });
    }
};

// Đăng nhập bằng email và password
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra đầu vào
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        try {
            const userRecord = await admin.auth().getUserByEmail(email);
        
            const userDoc = await db.collection("users").doc(userRecord.uid).get();
            
            if (!userDoc.exists) {
                return res.status(404).json({ error: "User not found in database" });
            }
            
            const userData = userDoc.data();
            
            // Tạo JWT token
            const token = jwt.sign(
                { uid: userRecord.uid, email, role: userData.role },
                process.env.JWT_SECRET || "your-default-secret-key",
                { expiresIn: '1d' }
            );
            
            return res.status(200).json({
                message: "Login successful",
                user: {
                    uid: userRecord.uid,
                    username: userData.displayName,
                    email: userData.email,
                    photoURL: userData.photoURL,
                    role: userData.role
                },
                token
            });
            
        } catch (error) {
            console.error("Login error details:", error);
            // Xử lý các lỗi cụ thể
            if (error.code === 'auth/user-not-found') {
                return res.status(404).json({ error: "Account not found" });
            } else if (error.code === 'auth/wrong-password') {
                return res.status(401).json({ error: "Wrong password" });
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
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const token = authHeader.split(" ")[1];

        // Xác thực JWT token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        await admin.auth().revokeRefreshTokens(decodedToken.uid);

        return res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ error: "Server error: " + error.message });
    }
};

// Đăng nhập bằng Google
exports.googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        
        // Xác thực idToken từ Google
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;
        
        // Kiểm tra xem user đã tồn tại trong database hay chưa
        let userDoc = await db.collection("users").doc(uid).get();
        
        if (!userDoc.exists) {
            // Nếu chưa tồn tại, tạo mới user trong database
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
        
        // Tạo JWT token
        const token = jwt.sign(
            { uid, email, role: userData.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
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
            token
        });
        
    } catch (error) {
        console.error("Google login error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Middleware xác thực người dùng bằng token
exports.authenticateUser = async (req, res, next) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Authentication required" });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Gán thông tin user vào request để sử dụng trong các route tiếp theo
        req.user = decoded;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token expired" });
        }
        return res.status(401).json({ error: "Invalid token" });
    }
};

// Middleware kiểm tra vai trò admin
exports.requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ error: "Access denied. Admin permission required." });
    }
};