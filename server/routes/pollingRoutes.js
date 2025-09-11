import express from 'express';
import { startPollingRate, stopPollingRate } from '../services/eventListener.js';

const router = express.Router();

router.post('/start', (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  try {
    startPollingRate(orderId);
    console.log(`Started polling for Order ID: ${orderId}`);
    return res.status(200).json({ message: 'Polling started successfully' });
  } catch (error) {
    console.error('Failed to start polling:', error);
    return res.status(500).json({ error: 'Failed to start polling' });
  }
});

// Stop Polling Route
router.post('/stop', (req, res) => {
  try {
    stopPollingRate();
    console.log(`Stopped polling`);
    return res.status(200).json({ message: 'Polling stopped successfully' });
  } catch (error) {
    console.error('Failed to stop polling:', error);
    return res.status(500).json({ error: 'Failed to stop polling' });
  }
});

export default router;