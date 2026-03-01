const Tag = require('../models/tag.model');

/**
 * @route POST /api/tags
 * @desc Create a new tag
 * @access Public
 */
exports.createTag = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Tag name is required" });
    }

    const existingTag = await Tag.findOne({ name });

    if (existingTag) {
      return res.status(400).json({ message: "Tag already exists" });
    }

    const tag = await Tag.create({ name });

    res.status(201).json({
      message: "Tag created successfully",
      data: tag
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};