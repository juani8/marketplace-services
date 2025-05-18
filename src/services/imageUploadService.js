const { v2: cloudinary } = require('cloudinary');

class ImageUploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  /**
   * Uploads a single file buffer to Cloudinary
   * @param {Object} file - The file object from multer (in memory)
   * @returns {Promise<string>} The Cloudinary URL of the uploaded image
   */
  async uploadImage(file) {
    try {
      // Crear un stream desde el buffer
      const b64 = Buffer.from(file.buffer).toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      
      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'auto',
        folder: 'marketplace', // Opcional: organiza las imágenes en una carpeta
      });
      
      return result.secure_url;
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Uploads multiple file buffers to Cloudinary
   * @param {Array<Object>} files - Array of file objects from multer (in memory)
   * @returns {Promise<Array<string>>} Array of Cloudinary URLs
   */
  async uploadMultipleImages(files) {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images to Cloudinary:', error);
      throw new Error('Failed to upload one or more images');
    }
  }
}

module.exports = new ImageUploadService(); 