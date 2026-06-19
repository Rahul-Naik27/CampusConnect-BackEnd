const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/userAuth');
const User = require('../models/User');
const Registration = require('../models/registration');

// GET /api/v1/users/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/v1/users/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { rollNumber, gender, class: className, branch, yearOfStudy, collegeUID, avatar } = req.body || {};

    if (!rollNumber || !className || !branch || !collegeUID) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // If a Cloudinary URL was uploaded, use it; otherwise fall back to gender-based default
    const resolvedAvatar = avatar && avatar.startsWith('http')
      ? avatar
      : (gender === 'female' ? '/girl.png' : '/boy.png');

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { rollNumber, gender, class: className, branch, yearOfStudy, collegeUID, avatar: resolvedAvatar },
      { new: true, runValidators: true, context: 'query' }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/v1/users/badges — compute achievement badges from registrations
router.get('/badges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const registrations = await Registration.find({ userId, status: 'CONFIRMED' }).populate('eventId');

    const totalRegistrations = registrations.length;
    const attendedEvents = registrations.filter(r => !!r.checkedInAt);
    const attendedCount = attendedEvents.length;
    const attendedBigFest = registrations.some(r => r.eventId?.isBiggestFest);

    // Count unique departments
    const deptSet = new Set(
      registrations
        .filter(r => r.eventId?.departmentOrClub)
        .map(r => r.eventId.departmentOrClub)
    );

    res.json({
      stats: {
        totalRegistrations,
        attendedCount,
        attendedBigFest,
        departments: deptSet.size,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch badges', error: err.message });
  }
});

// GET /api/v1/users/saved — get bookmarked events
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedEvents').select('savedEvents');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ savedEvents: user.savedEvents || [] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch saved events', error: err.message });
  }
});

// POST /api/v1/users/saved/:eventId — toggle bookmark
router.post('/saved/:eventId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const eventId = req.params.eventId;
    const savedArr = user.savedEvents.map(id => id.toString());
    const isSaved = savedArr.includes(eventId);

    if (isSaved) {
      user.savedEvents = user.savedEvents.filter(id => id.toString() !== eventId);
    } else {
      user.savedEvents.push(eventId);
    }
    await user.save();
    res.json({ saved: !isSaved, savedEvents: user.savedEvents });
  } catch (err) {
    res.status(500).json({ message: 'Toggle bookmark failed', error: err.message });
  }
});

module.exports = router;
