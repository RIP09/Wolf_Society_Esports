const router = require('express').Router();
const { validateContent } = require('../utils/validation');
const contentController = require('../controllers/contentController');
const auth = require('../middleware/auth');

router.get('/', contentController.getContent);
router.get('/:id', contentController.getContentItem);
router.post('/', auth, validateContent, contentController.createContent);
router.put('/:id', auth, contentController.updateContent);
router.delete('/:id', auth, contentController.deleteContent);

module.exports = router;
