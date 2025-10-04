const express = require('express');
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// 'image' is the field name the frontend will use
router.post('/', protect, upload.single('image'), uploadImage); 
router.delete('/', protect, deleteImage);

module.exports = router;