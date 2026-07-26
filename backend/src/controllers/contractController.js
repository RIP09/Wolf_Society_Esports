const { Contract, User } = require('../models');
const { validationResult } = require('express-validator');

exports.getContracts = async (req, res, next) => {
  try {
    const where = {};
    if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
      where.user_id = req.user ? req.user.id : null;
    }
    const contracts = await Contract.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'full_name', 'email'] }],
    });
    res.json(contracts);
  } catch (err) {
    next(err);
  }
};

exports.getContract = async (req, res, next) => {
  try {
    const contract = await Contract.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'full_name'] }],
    });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    if (!['admin', 'manager'].includes(req.user.role) && req.user.id !== contract.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(contract);
  } catch (err) {
    next(err);
  }
};

exports.createContract = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const contract = await Contract.create(req.body);
    res.status(201).json(contract);
  } catch (err) {
    next(err);
  }
};

exports.updateContract = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    await contract.update(req.body);
    res.json(contract);
  } catch (err) {
    next(err);
  }
};

exports.deleteContract = async (req, res, next) => {
  try {
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    await contract.destroy();
    res.json({ message: 'Contract deleted' });
  } catch (err) {
    next(err);
  }
};
