// backend/middleware/upload.js
//
// Centralised Multer configuration for complaint file uploads.
// Supports: images, audio, video  (up to 5 files, 50 MB each)
//
// Usage in a route file:
//   const { upload } = require('../middleware/upload');
//   router.post('/', upload.array('files', 5), handler);

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ── Storage destination ───────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads/complaints');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Allowed MIME types ────────────────────────────────────────────────────────
const ALLOWED_MIME = new Set([
  // images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  // audio
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
  // video
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
]);

// ── Disk storage ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
                   .replace(/[^a-z0-9]/gi, '_')
                   .slice(0, 40);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

// ── Multer instance ───────────────────────────────────────────────────────────
const upload = multer({
  storage,
  limits:     { fileSize: 50 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) =>
    ALLOWED_MIME.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`Unsupported file type: ${file.mimetype}`)),
});

// ── Helper: derive a simple category from MIME type ───────────────────────────
const fileCategory = (mime) => {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return 'file';
};

// ── Helper: build a public URL for a stored file ──────────────────────────────
const fileUrl = (req, filename) =>
  `${req.protocol}://${req.get('host')}/uploads/complaints/${filename}`;

// ── Multer error handler (attach to any router that uses upload) ──────────────
// eslint-disable-next-line no-unused-vars
const multerErrorHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.startsWith('Unsupported'))
    return res.status(400).json({ message: err.message });
  next(err);
};

module.exports = { upload, fileCategory, fileUrl, multerErrorHandler };