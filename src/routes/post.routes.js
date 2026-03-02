const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');

const {createPost, getAllPosts,searchPosts, filterByTag,getPostById,updatePost,deletePost} = require('../controllers/post.controller');

router.get('/search', searchPosts);
router.get('/filter-by-tag/:tagName', filterByTag);
router.get('/', getAllPosts);
router.post('/', upload.single('image'), createPost);
router.get('/:id', getPostById);
router.put('/:id', upload.single('image'), updatePost);
router.delete('/:id', deletePost);

module.exports = router;