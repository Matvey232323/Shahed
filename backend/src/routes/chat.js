const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user's chats
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate('participants', 'name avatar online')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create personal chat
router.post('/personal', auth, async (req, res) => {
  const { participantId } = req.body;

  try {
    const existingChat = await Chat.findOne({
      type: 'personal',
      participants: { $all: [req.user.id, participantId] }
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    const chat = new Chat({
      type: 'personal',
      participants: [req.user.id, participantId],
      createdBy: req.user.id
    });

    await chat.save();
    await chat.populate('participants', 'name avatar online');
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create group chat
router.post('/group', auth, async (req, res) => {
  const { name, participants } = req.body;

  try {
    const chat = new Chat({
      type: 'group',
      name,
      participants: [req.user.id, ...participants],
      admin: req.user.id,
      createdBy: req.user.id
    });

    await chat.save();
    await chat.populate('participants', 'name avatar online');
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Pin/unpin chat
router.patch('/:id/pin', auth, async (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;

  try {
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (pin) {
      if (!chat.pinned.includes(req.user.id)) {
        chat.pinned.push(req.user.id);
      }
    } else {
      chat.pinned = chat.pinned.filter(userId => userId.toString() !== req.user.id);
    }

    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat details
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const chat = await Chat.findById(id)
      .populate('participants', 'name avatar online')
      .populate('admin', 'name');

    if (!chat || !chat.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;