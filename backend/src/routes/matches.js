const router = require('express').Router();
const { validateMatch } = require('../utils/validation');
const matchController = require('../controllers/matchController');
const auth = require('../middleware/auth');

router.get('/', matchController.getMatches);
router.get('/:id', matchController.getMatch);
router.post('/', auth, validateMatch, matchController.createMatch);
router.put('/:id', auth, matchController.updateMatch);
router.delete('/:id', auth, matchController.deleteMatch);

module.exports = router;
