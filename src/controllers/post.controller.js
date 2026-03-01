const Post = require('../models/post.model');
const Tag = require('../models/tag.model');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

exports.createPost = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const title = req.body?.title;
    const desc = req.body?.desc;
    const tags = req.body?.tags;

    if (!title || !desc) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    let tagIds = [];
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",");
      const existingTags = await Tag.find({ _id: { $in: tagArray } });
      tagIds = existingTags.map(tag => tag._id);
    }

    let imageUrl = null;

    if (req.file) {
      const fileName = Date.now() + "-" + req.file.originalname;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      });

      await s3.send(command);

      imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    }

    const post = await Post.create({
      title,
      desc,
      image: imageUrl,
      tags: tagIds
    });

    const populatedPost = await Post.findById(post._id).populate("tags");

    res.status(201).json({
      message: "Post created successfully",
      data: populatedPost
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
// GET /api/posts
// get all posts with pagination and sorting
 
exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;
    const tags = req.query.tags;

    const skip = (page - 1) * limit;

    let filter = {};

    //Filter by tags
    if (tags) {
      const tagArray = tags.split(",");
      filter.tags = { $in: tagArray };
    }

    const posts = await Post.find(filter)
      .populate("tags")
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: posts
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET /api/posts/search
// Search posts by keyword in title and description
 

exports.searchPosts = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: "Keyword is required" });
    }

    const posts = await Post.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { desc: { $regex: keyword, $options: "i" } }
      ]
    }).populate("tags");

    res.status(200).json({
      total: posts.length,
      data: posts
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};