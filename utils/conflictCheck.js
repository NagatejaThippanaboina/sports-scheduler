const { Op } = require("sequelize");
const { Session, SessionParticipant, Sport } = require("../models");

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour standard duration

/**
 * Checks whether a user has a time conflict with a proposed session time.
 * Detects both exact timestamps and overlapping time ranges within the session duration window.
 * Touching endpoints (e.g. 10:00-11:00 and 11:00-12:00) are non-overlapping.
 *
 * @param {number} userId - The ID of the user.
 * @param {Date|string} sessionDate - The start time of the target session.
 * @param {number} [excludeSessionId] - Optional session ID to exclude.
 * @returns {Promise<{ hasConflict: boolean, conflictingSession?: any }>}
 */
async function checkSessionTimeConflict(userId, sessionDate, excludeSessionId = null) {
    const targetStart = new Date(sessionDate).getTime();
    if (isNaN(targetStart)) {
        return { hasConflict: false };
    }
    const targetEnd = targetStart + SESSION_DURATION_MS;

    const userParticipants = await SessionParticipant.findAll({
        where: { userId },
        include: [
            {
                model: Session,
                where: {
                    status: "scheduled",
                    ...(excludeSessionId ? { id: { [Op.ne]: excludeSessionId } } : {}),
                },
                include: [{ model: Sport }],
            },
        ],
    });

    for (const participant of userParticipants) {
        if (!participant.Session) continue;

        const existStart = new Date(participant.Session.sessionDate).getTime();
        const existEnd = existStart + SESSION_DURATION_MS;

        // Interval overlap condition: [targetStart, targetEnd) overlaps [existStart, existEnd)
        // iff targetStart < existEnd && existStart < targetEnd
        if (targetStart < existEnd && existStart < targetEnd) {
            return {
                hasConflict: true,
                conflictingSession: participant.Session,
            };
        }
    }

    return { hasConflict: false };
}

module.exports = {
    SESSION_DURATION_MS,
    checkSessionTimeConflict,
};
