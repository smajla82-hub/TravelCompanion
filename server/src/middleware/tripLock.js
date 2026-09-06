import * as locks from '../repositories/tripLockRepository.js';

function clientUpdatedAt(req) {
  return req.body?.clientUpdatedAt ?? req.get('If-Unmodified-Since');
}

export function requireActiveLock(getResource) {
  return (req, _res, next) => {
    const tripId = req.params.tripId ?? req.params.id;
    const lock = locks.getActiveLock(tripId);
    if (lock?.userId === req.user.id) {
      return next();
    }

    const knownUpdatedAt = clientUpdatedAt(req);
    const resource = knownUpdatedAt && getResource(req);
    if (!lock && resource?.updated_at && !Number.isNaN(Date.parse(knownUpdatedAt))
      && Date.parse(knownUpdatedAt) >= Date.parse(resource.updated_at)) {
      return next();
    }

    return next(Object.assign(
      new Error('Acquire the trip edit lock before modifying this resource.'),
      { statusCode: 409 },
    ));
  };
}
