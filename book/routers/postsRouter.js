const express = require ('express');
const postsController = require ('../controllers/postsController.js');
const { identifier } = require('../middlewares/identification.js');

const router = express.Router();

router.get('/all-posts', postsController.getPosts);

router.get('/single-post', postsController.singlePosts);
router.post('/create-post',identifier, postsController.createPost);

router.put('/update-post',identifier,postsController.updatePost);
router.delete('/delete-post',identifier,postsController.deletePost);


module.exports = router;