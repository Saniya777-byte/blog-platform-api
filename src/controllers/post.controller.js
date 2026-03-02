const Post = require('../models/post.model');
const Tag = require('../models/tag.model');
const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('../config/s3');


async function generateSignedUrl(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}


function extractS3Key(url) {
  if (!url) return null;
  const parts = url.split('.amazonaws.com/');
  return parts.length > 1 ? parts[1] : null;
}


async function uploadToS3(file) {
  const sanitizedName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
  const fileName = `${Date.now()}-${sanitizedName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype
  });

  await s3.send(command);

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}


async function deleteFromS3(key) {
  if (!key) return;
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key
  });
  await s3.send(command);
}

async function enrichWithSignedUrls(posts) {
  return Promise.all(
    posts.map(async (post) => {
      const postObj = post.toObject ? post.toObject() : { ...post };
      if (postObj.image) {
        const key = extractS3Key(postObj.image);
        if (key) {
          try {
            postObj.image = await generateSignedUrl(key);
          } catch {
          }
        }
      }
      return postObj;
    })
  );
}


exports.createPost = async (req, res, next) => {
  try {
    console.log('=== CREATE POST ===');
    console.log('req.body:', req.body);

    const { title, desc, author, status } = req.body;
    let tags = req.body.tags || '';

    console.log('Raw tags from body:', JSON.stringify(tags));

    // Validate required fields
    if (!title || !desc) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    // Resolve tag IDs from tag names
    let tagIds = [];

    // Ensure tags is a string and trim it
    const tagsString = String(tags || '').trim();
    console.log('Trimmed tags string:', JSON.stringify(tagsString));

    if (tagsString !== '' && tagsString !== 'undefined') {
      const tagArray = tagsString
        .split(',')
        .map(t => t.trim())
        .filter(t => t !== '');

      console.log('Tag array to search:', tagArray);

      if (tagArray.length > 0) {
        const caseInsensitivePatterns = tagArray.map(n => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
        const existingTags = await Tag.find({ name: { $in: caseInsensitivePatterns } });
        console.log('Found tags in DB:', existingTags.length, existingTags.map(t => t.name));

        tagIds = existingTags.map(tag => tag._id);
        console.log('Mapped to tag IDs:', tagIds);
      }
    } else {
      console.log('No tags provided - empty or undefined');
    }

    // Upload image to S3 if provided
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToS3(req.file);
    }

    const post = await Post.create({
      title: title.trim(),
      desc: desc.trim(),
      image: imageUrl,
      tags: tagIds,
      author: author ? author.trim() : 'Anonymous',
      status: status || 'published'
    });

    console.log('Post created:', { id: post._id, tagsCount: post.tags.length, tags: post.tags });

    const populatedPost = await Post.findById(post._id).populate('tags', 'name color');
    console.log('Populated post tags:', populatedPost.tags.map(t => t.name));

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: populatedPost
    });

  } catch (error) {
    console.error('CreatePost error:', error);
    next(error);
  }
};



exports.getAllPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 6));
    const sortBy = ['createdAt', 'updatedAt', 'title'].includes(req.query.sortBy)
      ? req.query.sortBy
      : 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.author) {
      filter.author = { $regex: req.query.author, $options: 'i' };
    }


    if (req.query.tags && req.query.tags.trim()) {
      const tagInput = req.query.tags.trim();
      const tagNames = tagInput.split(',').map(t => t.trim()).filter(Boolean);

      if (tagNames.length > 0) {
        // Use case-insensitive regex so "NodeJS" and "nodejs" both match
        const caseInsensitivePatterns = tagNames.map(n => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
        const foundTags = await Tag.find({ name: { $in: caseInsensitivePatterns } });
        const tagIds = foundTags.map(t => t._id);

        if (tagIds.length > 0) {
          filter.tags = { $in: tagIds };
        } else {
          // No matching tags found — return empty result
          return res.status(200).json({
            success: true,
            total: 0,
            page,
            totalPages: 0,
            data: []
          });
        }
      }
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('tags', 'name color')
        .sort({ [sortBy]: order })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter)
    ]);

    // Attach signed S3 URLs
    const enrichedPosts = await enrichWithSignedUrls(posts);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: enrichedPosts
    });

  } catch (error) {
    next(error);
  }
};



exports.searchPosts = async (req, res, next) => {
  try {
    const { keyword } = req.query;

    if (!keyword || !keyword.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search keyword is required'
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 6));
    const skip = (page - 1) * limit;

    const searchRegex = { $regex: keyword.trim(), $options: 'i' };

    // Find tags matching the keyword
    const matchingTags = await Tag.find({
      name: { $regex: keyword.trim(), $options: 'i' }
    }).select('_id');
    const tagIds = matchingTags.map(t => t._id);

    const searchFilter = {
      $or: [
        { title: searchRegex },
        { desc: searchRegex },
        { author: searchRegex }
      ]
    };

    // Add tag matching to the search filter
    if (tagIds.length > 0) {
      searchFilter.$or.push({ tags: { $in: tagIds } });
    }

    const [posts, total] = await Promise.all([
      Post.find(searchFilter)
        .populate('tags', 'name color')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(searchFilter)
    ]);

    const enrichedPosts = await enrichWithSignedUrls(posts);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: enrichedPosts
    });

  } catch (error) {
    next(error);
  }
};



exports.filterByTag = async (req, res, next) => {
  try {
    const { tagName } = req.params;

    const tag = await Tag.findOne({ name: tagName.toLowerCase().trim() });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: `Tag "${tagName}" not found`
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 6));
    const sortBy = ['createdAt', 'updatedAt', 'title'].includes(req.query.sortBy)
      ? req.query.sortBy
      : 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ tags: tag._id })
        .populate('tags', 'name color')
        .sort({ [sortBy]: order })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ tags: tag._id })
    ]);

    const enrichedPosts = await enrichWithSignedUrls(posts);

    res.status(200).json({
      success: true,
      tag: { name: tag.name, color: tag.color },
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: enrichedPosts
    });

  } catch (error) {
    next(error);
  }
};



exports.getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('tags', 'name color');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const [enriched] = await enrichWithSignedUrls([post]);

    res.status(200).json({
      success: true,
      data: enriched
    });

  } catch (error) {
    next(error);
  }
};


exports.updatePost = async (req, res, next) => {
  try {
    const existingPost = await Post.findById(req.params.id);

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const { title, desc, author, status } = req.body;
    const tags = req.body.tags;
    const updateData = {};

    if (title) updateData.title = title.trim();
    if (desc) updateData.desc = desc.trim();
    if (author) updateData.author = author.trim();
    if (status) updateData.status = status;

    if (tags !== undefined) {
      const tagArray = (Array.isArray(tags) ? tags : tags.split(','))
        .map(t => t.trim())
        .filter(Boolean);

      if (tagArray.length > 0) {
        // Use case-insensitive regex so mixed-case tag names are all found
        const caseInsensitivePatterns = tagArray.map(n => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
        const foundTags = await Tag.find({ name: { $in: caseInsensitivePatterns } });
        updateData.tags = foundTags.map(t => t._id);
      } else {
        updateData.tags = [];
      }
    }

    if (req.file) {
      // Delete old image from S3
      const oldKey = extractS3Key(existingPost.image);
      if (oldKey) {
        await deleteFromS3(oldKey).catch(() => { }); // Non-blocking
      }

      // Upload new image
      updateData.image = await uploadToS3(req.file);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('tags', 'name color');

    const [enriched] = await enrichWithSignedUrls([updatedPost]);

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: enriched
    });

  } catch (error) {
    next(error);
  }
};



exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Clean up S3 image if it exists
    const key = extractS3Key(post.image);
    if (key) {
      await deleteFromS3(key).catch(() => { }); // Non-blocking
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    next(error);
  }

};
