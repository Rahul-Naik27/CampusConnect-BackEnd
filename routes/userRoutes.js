const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/userAuth');
const User = require('../models/User');

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { rollNumber, gender, class: className, branch, yearOfStudy, collegeUID } = req.body || {};

    if (!rollNumber || !className || !branch || !collegeUID) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const avatar = gender === 'female' ? '/girl.png' : '/boy.png';

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        rollNumber,
        gender,
        class: className,
        branch,
        yearOfStudy,
        collegeUID,
        avatar
      },
      { new: true, runValidators: true, context: 'query' }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
