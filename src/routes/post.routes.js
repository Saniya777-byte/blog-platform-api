const express = require('express');
const router = express.Router();
const { createPost, getAllPosts } = require('../controllers/post.controller');

router.post('/', createPost);
router.get('/', getAllPosts);

module.exports = router;