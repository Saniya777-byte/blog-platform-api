const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, searchPosts } = require('../controllers/post.controller');
const upload = require('../middleware/upload.middleware');

router.post('/', upload.single('image'), createPost);

router.get('/', getAllPosts);
router.get('/search', searchPosts);

module.exports = router;