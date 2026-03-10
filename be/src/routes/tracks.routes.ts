import { Router } from 'express';
import { getAllTracks, deleteTrack } from '../controllers/tracks.controller.js';

const router = Router();

router.get('/', getAllTracks);
router.delete('/:id', deleteTrack);

export default router;
