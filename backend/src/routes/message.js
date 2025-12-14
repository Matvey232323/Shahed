const express = require('express');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

const router = express.Router();

// Get messages for a chat
router.get('/:chatId', auth, async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user.id)) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await Message.find({ chat: chatId, deleted: false })
      .populate('sender', 'name avatar')
      .populate('replyTo')
      .populate('reactions.user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  const { chatId, content, media, mediaUrl, voice, videoCircle, replyTo } = req.body;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user.id)) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const message = new Message({
      chat: chatId,
      sender: req.user.id,
      content,
      media,
      mediaUrl,
      voice,
      videoCircle,
      replyTo
    });

    await message.save();
    await message.populate('sender', 'name avatar');

    // Update chat's last message
    chat.lastMessage = message._id;
    await chat.save();

    // Mark as delivered to sender
    message.deliveredTo.push({ user: req.user.id });
    await message.save();

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit message
router.patch('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const message = await Message.findById(id);
    if (!message || message.sender.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const message = await Message.findById(id);
    if (!message || message.sender.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add reaction
router.post('/:id/reaction', auth, async (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body;

  try {
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const existingReaction = message.reactions.find(r => r.user.toString() === req.user.id);
    if (existingReaction) {
      existingReaction.emoji = emoji;
    } else {
      message.reactions.push({ user: req.user.id, emoji });
    }

    await message.save();
    await message.populate('reactions.user', 'name');
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove reaction
router.delete('/:id/reaction', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.reactions = message.reactions.filter(r => r.user.toString() !== req.user.id);
    await message.save();

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.patch('/read/:chatId', auth, async (req, res) => {
  const { chatId } = req.params;

  try {
    await Message.updateMany(
      { chat: chatId, sender: { $ne: req.user.id }, 'readBy.user': { $ne: req.user.id } },
      { $push: { readBy: { user: req.user.id } } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search messages
router.get('/search/:chatId', auth, async (req, res) => {
  const { chatId } = req.params;
  const { query } = req.query;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user.id)) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await Message.find({
      chat: chatId,
      deleted: false,
      content: { $regex: query, $options: 'i' }
    }).populate('sender', 'name avatar').sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;