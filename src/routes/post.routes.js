const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, searchPosts } = require('../controllers/post.controller');

router.post('/', createPost);
router.get('/', getAllPosts);
router.get('/search', searchPosts);

module.exports = router;