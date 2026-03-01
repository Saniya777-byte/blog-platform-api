const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, searchPosts } = require('../controllers/post.controller');
const upload = require('../middleware/upload.middleware');
const { getPostById } = require('../controllers/post.controller');
const { deletePost } = require('../controllers/post.controller');
const { updatePost } = require('../controllers/post.controller');


router.post('/', upload.single('image'), createPost);
router.get('/search', searchPosts);
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.delete('/:id', deletePost)
router.put('/:id', updatePost);

module.exports = router;