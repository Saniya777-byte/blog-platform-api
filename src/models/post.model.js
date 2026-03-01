const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    desc: {
      type: String,
      required: true
    },
    image: {
      type: String
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);