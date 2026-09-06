import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as invitations from '../repositories/invitationRepository.js';

const router = express.Router();

router.use(requireAuth);

function respond(handler) {
  return (req, res) => {
    const result = handler(req.params.token, req.user);
    if (result.kind === 'notFound') {
      return res.status(404).json({ error: 'Invitation not found.' });
    }
    if (result.kind === 'forbidden') {
      return res.status(403).json({ error: 'This invitation was sent to a different email address.' });
    }
    if (result.kind === 'invalid') {
      return res.status(400).json({ error: `Invitation is ${result.invitation.status}.` });
    }
    return res.json(result.invitation);
  };
}

router.post('/:token/accept', respond(invitations.acceptInvitation));
router.post('/:token/reject', respond(invitations.rejectInvitation));

export default router;
