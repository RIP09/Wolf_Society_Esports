const router = require('express').Router();
const { validateTeam } = require('../utils/validation');
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');

router.get('/', teamController.getTeams);
router.get('/:id', teamController.getTeam);
router.post('/', auth, validateTeam, teamController.createTeam);
router.put('/:id', auth, teamController.updateTeam);
router.delete('/:id', auth, teamController.deleteTeam);

module.exports = router;
