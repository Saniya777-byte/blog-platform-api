const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [50, 'Tag name cannot exceed 50 characters']
    },
    color: {
      type: String,
      default: '#6366f1'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tag', tagSchema);