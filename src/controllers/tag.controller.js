const Tag = require('../models/tag.model');

exports.createTag = async (req, res, next) => {
  try {
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    const normalizedName = name.trim().toLowerCase();

    const existingTag = await Tag.findOne({ name: normalizedName });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: `Tag "${normalizedName}" already exists`
      });
    }

    const tagData = { name: normalizedName };
    if (color) tagData.color = color;

    const tag = await Tag.create(tagData);

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tag
    });

  } catch (error) {
    next(error);
  }
};


exports.getAllTags = async (req, res, next) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      total: tags.length,
      data: tags
    });

  } catch (error) {
    next(error);
  }
};



exports.deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Tag "${tag.name}" deleted successfully`
    });

  } catch (error) {
    next(error);
  }
};