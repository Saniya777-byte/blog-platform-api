const Post = require('../models/post.model');
const Tag = require('../models/tag.model');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


async function generateSignedUrl(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key
  });

  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}
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

      // Find tags by NAME instead of _id
      const existingTags = await Tag.find({
        name: { $in: tagArray }
      });

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

    // Generate signed URLs for images
    for (let post of posts) {
      if (post.image) {
        const key = post.image.split(".amazonaws.com/")[1];
        post.image = await generateSignedUrl(key);
      }
    }

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



//   GET /api/posts/:id
//   Get single post by ID

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("tags");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DELETE /api/posts/:id
//  Delete post by ID

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




//   PUT /api/posts/:id
//  Update post by ID


exports.updatePost = async (req, res) => {
  try {
    const { title, desc, tags } = req.body;

    let updateData = {};

    if (title) updateData.title = title;
    if (desc) updateData.desc = desc;

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",");
      updateData.tags = tagArray;
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("tags");

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({
      message: "Post updated successfully",
      data: updatedPost
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};