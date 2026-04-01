const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Document } = require("../models/Core");
const fs = require("fs");
const path = require("path");

// --- S3/R2 CONFIG ---
const isCloudConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME;

const s3 = isCloudConfigured ? new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT, // Required for Cloudflare R2
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
}) : null;

/**
 * Universal Upload Handler
 * Supports both Cloud (S3/R2) and Local Fallback
 */
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "ERROR", message: "No file provided for upload." });
    }

    const { docType, relatedToType, relatedTo } = req.body;
    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, "_")}`;
    let fileUrl = "";

    if (isCloudConfigured) {
      // --- CLOUD UPLOAD (S3/R2) ---
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `mandi-docs/${fileName}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      await s3.send(new PutObjectCommand(uploadParams));
      fileUrl = process.env.AWS_PUBLIC_URL 
        ? `${process.env.AWS_PUBLIC_URL}/mandi-docs/${fileName}`
        : `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/mandi-docs/${fileName}`;
        
      console.log(`✅ File Uploaded to Cloud: ${fileName}`);
    } else {
      // --- LOCAL FALLBACK ---
      const uploadDir = path.join(__dirname, "../../storage");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, file.buffer);
      
      // Construct local URL - Assuming backend serves /uploads as static
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      fileUrl = `${baseUrl}/uploads/${fileName}`;
      
      console.log(`📂 File Saved Locally (No Cloud Config): ${fileName}`);
    }

    // --- SAVE TO DATABASE ---
    const newDoc = new Document({
      fileName,
      originalName: file.originalname,
      fileSize: file.size,
      docType: docType || "Other",
      url: fileUrl,
      relatedToType: relatedToType || "Other",
      relatedTo: relatedTo || null,
      uploadedBy: req.user?.id
    });

    await newDoc.save();

    res.status(201).json({
      status: "SUCCESS",
      message: "Document archived successfully",
      data: newDoc
    });

  } catch (err) {
    console.error("Storage Error:", err);
    res.status(500).json({ status: "ERROR", message: "Failed to process storage request." });
  }
};

/**
 * List Documents
 */
exports.getDocuments = async (req, res) => {
  try {
    const { relatedTo, docType } = req.query;
    const query = {};
    if (relatedTo) query.relatedTo = relatedTo;
    if (docType) query.docType = docType;

    const docs = await Document.find(query).sort({ createdAt: -1 });
    res.status(200).json({ status: "SUCCESS", data: docs });
  } catch (err) {
    res.status(500).json({ status: "ERROR", message: err.message });
  }
};

/**
 * Delete Document
 */
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ status: "ERROR", message: "Document not found." });

    // TODO: Implement actual deletion from S3/Local if needed
    // For now just remove from DB
    await Document.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ status: "SUCCESS", message: "Document record purged." });
  } catch (err) {
    res.status(500).json({ status: "ERROR", message: err.message });
  }
};
