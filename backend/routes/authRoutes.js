const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const router = express.Router();

// POST /api/auth/login — volunteer login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const volunteer = await prisma.volunteer.findUnique({ where: { username } });

    if (!volunteer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, volunteer.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: volunteer.id, username: volunteer.username, role: 'volunteer' },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      role: 'volunteer'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
