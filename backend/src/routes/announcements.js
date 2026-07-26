const router = require('express').Router();
const { validateAnnouncement } = require('../utils/validation');
const announcementController = require('../controllers/announcementController');
const auth = require('../middleware/auth');

router.get('/', announcementController.getAnnouncements);
router.get('/:id', announcementController.getAnnouncement);
router.post('/', auth, validateAnnouncement, announcementController.createAnnouncement);
router.put('/:id', auth, announcementController.updateAnnouncement);
router.delete('/:id', auth, announcementController.deleteAnnouncement);

module.exports = router;
