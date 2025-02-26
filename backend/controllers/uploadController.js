const { getStorage } = require("firebase-admin/storage");

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const file = req.file;
        const bucket = getStorage().bucket();

        const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({ error: "Invalid file type. Only images are allowed." });
        }

        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return res.status(400).json({ error: "File size exceeds 5MB limit." });
        }

        const fileName = `images/${Date.now()}_${file.originalname}`;
        const fileRef = bucket.file(fileName);

        await fileRef.save(file.buffer, {
            metadata: { contentType: file.mimetype },
        });

        const fileURL = await fileRef.getSignedUrl({ action: "read", expires: "03-01-2030" });

        return res.status(200).json({ fileURL: fileURL[0] });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};