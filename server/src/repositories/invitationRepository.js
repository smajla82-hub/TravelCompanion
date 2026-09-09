import { randomBytes, randomUUID } from 'node:crypto';
import { getDb } from '../db/db.js';
import * as members from './tripMemberRepository.js';

const db = getDb();

function mapInvitationRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    tripId: row.trip_id,
    email: row.email,
    role: row.role,
    token: row.token,
    status: row.status,
    invitedByUserId: row.invited_by_user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function expireIfNeeded(row) {
  if (row?.status === 'pending' && new Date(row.expires_at) <= new Date()) {
    db.prepare("UPDATE invitations SET status = 'expired', updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), row.id);
    return { ...row, status: 'expired' };
  }
  return row;
}

function getRowByToken(token) {
  return expireIfNeeded(db.prepare('SELECT * FROM invitations WHERE token = ?').get(token));
}

function normalizeInvitationEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function findPendingInvitationByEmail(tripId, email) {
  const row = db.prepare(
    `SELECT * FROM invitations
     WHERE trip_id = ?
       AND status = 'pending'
       AND LOWER(TRIM(email)) = ?
     ORDER BY created_at DESC
     LIMIT 1`,
  ).get(tripId, normalizeInvitationEmail(email));
  const invitation = expireIfNeeded(row);
  if (!invitation || invitation.status !== 'pending') {
    return null;
  }
  return mapInvitationRow(invitation);
}

export function createInvitation(tripId, email, role, invitedByUserId, expiresAt) {
  const existing = findPendingInvitationByEmail(tripId, email);
  if (existing) {
    return { invitation: existing, alreadyGenerated: true };
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  const token = randomBytes(32).toString('base64url');
  db.prepare(
    `INSERT INTO invitations (id, trip_id, email, role, token, status, invited_by_user_id, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
  ).run(id, tripId, normalizeInvitationEmail(email), role, token, invitedByUserId, expiresAt, now, now);
  return { invitation: getInvitationById(tripId, id), alreadyGenerated: false };
}

export function getInvitationById(tripId, invitationId) {
  return mapInvitationRow(expireIfNeeded(
    db.prepare('SELECT * FROM invitations WHERE trip_id = ? AND id = ?').get(tripId, invitationId),
  ));
}

export function listInvitations(tripId) {
  return db.prepare('SELECT * FROM invitations WHERE trip_id = ? ORDER BY created_at DESC')
    .all(tripId).map((row) => mapInvitationRow(expireIfNeeded(row)));
}

export function revokeInvitation(tripId, invitationId) {
  const invitation = getInvitationById(tripId, invitationId);
  if (!invitation || invitation.status !== 'pending') {
    return null;
  }
  db.prepare("UPDATE invitations SET status = 'revoked', updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), invitationId);
  return getInvitationById(tripId, invitationId);
}

function respondToInvitation(token, user, status) {
  const invitation = getRowByToken(token);
  if (!invitation) {
    return { kind: 'notFound' };
  }
  if (invitation.status !== 'pending') {
    return { kind: 'invalid', invitation: mapInvitationRow(invitation) };
  }
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return { kind: 'forbidden' };
  }

  const complete = db.transaction(() => {
    if (status === 'accepted') {
      const existing = members.getTripMember(invitation.trip_id, user.id);
      if (!existing) {
        members.addTripMember(invitation.trip_id, user.id, invitation.role);
      }
    }
    db.prepare('UPDATE invitations SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, new Date().toISOString(), invitation.id);
    return getRowByToken(token);
  });
  return { kind: 'ok', invitation: mapInvitationRow(complete()) };
}

export function acceptInvitation(token, user) {
  return respondToInvitation(token, user, 'accepted');
}

export function rejectInvitation(token, user) {
  return respondToInvitation(token, user, 'rejected');
}
