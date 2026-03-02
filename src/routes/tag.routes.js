const express = require('express');
const router = express.Router();

const { createTag, getAllTags, deleteTag } = require('../controllers/tag.controller');


router.get('/', getAllTags);
router.post('/', createTag);
router.delete('/:id', deleteTag);

module.exports = router;