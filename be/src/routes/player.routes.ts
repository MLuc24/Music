import { Router } from 'express';
import { getStreamUrl } from '../controllers/player.controller.js';

const router = Router();

router.get('/', getStreamUrl);
router.get('/:storagePath', getStreamUrl);

export default router;
