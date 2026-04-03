import { Router } from 'express';
import {
  getAlbums,
  getAlbumDetail,
  postAlbum,
  patchAlbum,
  deleteAlbum,
  postAlbumTrack,
  deleteAlbumTrack,
  patchAlbumTrackOrder,
} from '../controllers/albums.controller.js';

const router = Router();

router.get('/', getAlbums);
router.post('/', postAlbum);
router.get('/:id', getAlbumDetail);
router.patch('/:id', patchAlbum);
router.delete('/:id', deleteAlbum);
router.post('/:id/tracks', postAlbumTrack);
router.patch('/:id/tracks/reorder', patchAlbumTrackOrder);
router.delete('/:id/tracks/:trackId', deleteAlbumTrack);

export default router;
