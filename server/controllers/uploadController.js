const { cloudinary } = require('../config/cloudinary');

const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }
  // req.file.path contains the secure URL from Cloudinary
  res.status(200).json({ imageUrl: req.file.path });
};

const deleteImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    // Extract the public_id from the URL
    // e.g., .../upload/v12345/german-revision-hub/public_id.jpg
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.')[0];
    
    if (!publicId) {
      return res.status(400).json({ message: 'Invalid image URL.' });
    }

    await cloudinary.uploader.destroy(publicId);
    res.status(200).json({ message: 'Image deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete image.' });
  }
};

module.exports = { uploadImage, deleteImage };