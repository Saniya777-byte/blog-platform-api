const express = require('express');
const router = express.Router();
const { createTag } = require('../controllers/tag.controller');

router.post('/', createTag);

module.exports = router;