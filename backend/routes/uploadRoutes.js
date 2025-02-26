const express = require("express");
const { uploadFile } = require("../controllers/uploadController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Route upload file
router.post("/", upload.single("file"), uploadFile);

module.exports = router;