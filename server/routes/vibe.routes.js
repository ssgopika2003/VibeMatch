import express from 'express';
import { matchVibeController, getPopularVibes } from '../controllers/vibe.controller.js';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get vibe recommendations (public or authenticated)
router.get('/match', auth(false), matchVibeController);

// Get popular vibes
router.get('/popular', getPopularVibes);

export default router;
