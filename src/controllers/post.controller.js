const Post = require('../models/post.model');
const Tag = require('../models/tag.model');


exports.createPost = async (req, res) => {
  try {
    const { title, desc, tags } = req.body;

    if (!title || !desc) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    // validate tags if provided
    let tagIds = [];
    if (tags && tags.length > 0) {
      const existingTags = await Tag.find({ _id: { $in: tags } });
      tagIds = existingTags.map(tag => tag._id);
    }

    const post = await Post.create({
      title,
      desc,
      tags: tagIds
    });

    const populatedPost = await Post.findById(post._id).populate('tags');

    res.status(201).json({
      message: "Post created successfully",
      data: populatedPost
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};