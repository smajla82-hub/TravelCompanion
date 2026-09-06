import { getTripMember } from '../repositories/tripMemberRepository.js';

export function requireTripRole(roles) {
  return (req, _res, next) => {
    const tripId = req.params.tripId ?? req.params.id;
    const member = getTripMember(tripId, req.user.id);
    if (!member) {
      return next(Object.assign(new Error('Trip not found.'), { statusCode: 404 }));
    }
    if (!roles.includes(member.role)) {
      return next(Object.assign(new Error('Insufficient permissions for this trip.'), { statusCode: 403 }));
    }
    req.tripMember = member;
    return next();
  };
}
