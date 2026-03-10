import { Router } from 'express';
import { downloadYouTubeAudio, getYouTubePreview } from '../controllers/download.controller.js';

const router = Router();

router.get('/preview', getYouTubePreview);
router.post('/', downloadYouTubeAudio);

export default router;
