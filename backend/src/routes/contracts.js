const router = require('express').Router();
const { validateContract } = require('../utils/validation');
const contractController = require('../controllers/contractController');
const auth = require('../middleware/auth');

router.get('/', auth, contractController.getContracts);
router.get('/:id', auth, contractController.getContract);
router.post('/', auth, validateContract, contractController.createContract);
router.put('/:id', auth, contractController.updateContract);
router.delete('/:id', auth, contractController.deleteContract);

module.exports = router;
