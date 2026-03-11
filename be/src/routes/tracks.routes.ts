import { Router } from 'express';
import { getAllTracks, deleteTrack, patchTrackFavorite, patchTrackInfo } from '../controllers/tracks.controller.js';

const router = Router();

router.get('/', getAllTracks);
router.patch('/:id/favorite', patchTrackFavorite);
router.patch('/:id', patchTrackInfo);
router.delete('/:id', deleteTrack);

export default router;
