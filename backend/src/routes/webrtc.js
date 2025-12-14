const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Store active calls (in production, use Redis or database)
const activeCalls = new Map();

// Initiate call
router.post('/call', auth, (req, res) => {
  const { chatId, type } = req.body; // type: 'voice' or 'video'

  const callId = Date.now().toString();
  activeCalls.set(callId, {
    id: callId,
    chatId,
    initiator: req.user.id,
    type,
    participants: [req.user.id],
    status: 'ringing'
  });

  res.json({ callId });
});

// Join call
router.post('/join/:callId', auth, (req, res) => {
  const { callId } = req.params;
  const call = activeCalls.get(callId);

  if (!call) {
    return res.status(404).json({ message: 'Call not found' });
  }

  if (!call.participants.includes(req.user.id)) {
    call.participants.push(req.user.id);
  }

  call.status = 'active';
  res.json(call);
});

// End call
router.post('/end/:callId', auth, (req, res) => {
  const { callId } = req.params;
  activeCalls.delete(callId);
  res.json({ message: 'Call ended' });
});

// Get call info
router.get('/:callId', auth, (req, res) => {
  const { callId } = req.params;
  const call = activeCalls.get(callId);

  if (!call) {
    return res.status(404).json({ message: 'Call not found' });
  }

  res.json(call);
});

module.exports = router;