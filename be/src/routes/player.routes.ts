import { Router } from 'express';
import { getStreamUrl, streamLocalAudio } from '../controllers/player.controller.js';

const router = Router();

router.get('/', getStreamUrl);
router.get('/stream', streamLocalAudio);
router.get('/:storagePath', getStreamUrl);

export default router;
