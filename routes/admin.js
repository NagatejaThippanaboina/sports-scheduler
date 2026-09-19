const express = require("express");
const { Op } = require("sequelize");

const {
    Sport,
    Session,
    SessionParticipant,
    User,
} = require("../models");

const { requireAdmin } = require("../middleware/auth");
const { checkSessionTimeConflict } = require("../utils/conflictCheck");

const router = express.Router();


// =========================================================
// ADMIN DASHBOARD
// =========================================================

router.get("/admin/dashboard", requireAdmin, async (req, res) => {
    try {

        // ---------------------------------------------
        // SPORTS CREATED BY THIS ADMIN
        // ---------------------------------------------

        const sports = await Sport.findAll({
            where: {
                createdBy: req.user.id,
            },
            order: [["createdAt", "DESC"]],
        });


        // ---------------------------------------------
        // ALL SESSIONS
        // ---------------------------------------------

        const sessions = await Session.findAll({
            include: [
                {
                    model: Sport,
                },
                {
                    model: SessionParticipant,
                    include: [
                        {
                            model: User,
                        },
                    ],
                },
            ],
            order: [["sessionDate", "ASC"]],
        });


        // ---------------------------------------------
        // SEND DATA TO DASHBOARD
        // ---------------------------------------------

        res.render("admin/dashboard", {
            sports,
            sessions,
            user: req.user,
        });

    } catch (error) {

        console.error(error);

        res.status(500).send("Something went wrong.");
    }
});


// =========================================================
// CREATE SPORT PAGE
// =========================================================

router.get("/admin/sports/new", requireAdmin, (req, res) => {

    res.render("admin/create-sport");

});


// =========================================================
// CREATE SPORT
// =========================================================

router.post("/admin/sports", requireAdmin, async (req, res) => {

    try {

        const { name } = req.body;


        if (!name || !name.trim()) {

            return res
                .status(400)
                .send("Sport name is required.");

        }


        await Sport.create({

            name: name.trim(),

            createdBy: req.user.id,

        });


        req.flash(
            "success",
            "Sport created successfully."
        );


        res.redirect("/admin/dashboard");

    } catch (error) {

        console.error(error);

        req.flash(
            "error",
            "We couldn't create the sport. Please try again."
        );

        res.redirect("/admin/dashboard");
    }

});


// =========================================================
// EDIT SPORT PAGE
// =========================================================

router.get(
    "/admin/sports/:id/edit",
    requireAdmin,
    async (req, res) => {

        try {

            const sport = await Sport.findOne({
                where: {
                    id: req.params.id,
                    createdBy: req.user.id,
                },
            });


            if (!sport) {

                return res
                    .status(404)
                    .send("Sport not found.");

            }


            res.render("admin/edit-sport", {
                sport,
                user: req.user,
            });

        } catch (error) {

            console.error(error);

            res
                .status(500)
                .send("Something went wrong.");
        }
    }
);


// =========================================================
// UPDATE SPORT
// =========================================================

router.post(
    "/admin/sports/:id/edit",
    requireAdmin,
    async (req, res) => {

        try {

            const { name } = req.body;


            // -----------------------------------------
            // VALIDATE NAME
            // -----------------------------------------

            if (!name || !name.trim()) {

                req.flash(
                    "error",
                    "Sport name is required."
                );

                return res.redirect(
                    `/admin/sports/${req.params.id}/edit`
                );
            }


            // -----------------------------------------
            // FIND SPORT
            // -----------------------------------------

            const sport = await Sport.findOne({

                where: {
                    id: req.params.id,
                    createdBy: req.user.id,
                },

            });


            if (!sport) {

                return res
                    .status(404)
                    .send("Sport not found.");

            }


            // -----------------------------------------
            // UPDATE SPORT NAME
            // -----------------------------------------

            sport.name = name.trim();

            await sport.save();


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            req.flash(
                "success",
                "Sport updated successfully."
            );


            res.redirect("/admin/dashboard");

        } catch (error) {

            console.error(error);

            req.flash(
                "error",
                "We couldn't update the sport. Please try again."
            );

            res.redirect("/admin/dashboard");
        }

    }
);


// =========================================================
// CREATE SESSION PAGE
// =========================================================

router.get(
    "/admin/sessions/new",
    requireAdmin,
    async (req, res) => {

        try {

            const sports = await Sport.findAll({

                where: {
                    createdBy: req.user.id,
                },

                order: [["name", "ASC"]],

            });


            res.render("admin/create-session", {
                sports,
            });

        } catch (error) {

            console.error(error);

            res
                .status(500)
                .send("Something went wrong.");
        }

    }
);


// =========================================================
// CREATE SESSION
// =========================================================

router.post(
    "/admin/sessions",
    requireAdmin,
    async (req, res) => {
        try {
            const {
                sportId,
                sessionDate,
                venue,
                teamOnePlayers,
                teamTwoPlayers,
                additionalPlayersNeeded,
                creatorParticipating,
            } = req.body;

            // -----------------------------------------
            // REQUIRED FIELDS
            // -----------------------------------------
            if (!sportId || !sessionDate || !venue) {
                req.flash("error", "Sport, date/time and venue are required.");
                return res.redirect("/admin/sessions/new");
            }

            const selectedDate = new Date(sessionDate);
            if (isNaN(selectedDate.getTime())) {
                req.flash("error", "Please enter a valid date and time.");
                return res.redirect("/admin/sessions/new");
            }

            if (selectedDate <= new Date()) {
                req.flash("error", "The session date and time must be in the future.");
                return res.redirect("/admin/sessions/new");
            }

            // -----------------------------------------
            // CHECK SPORT
            // -----------------------------------------
            const sport = await Sport.findByPk(sportId);

            if (!sport) {
                req.flash("error", "Please select a valid sport.");
                return res.redirect("/admin/sessions/new");
            }

            // -----------------------------------------
            // CHECK CREATOR PARTICIPATION & CONFLICTS
            // -----------------------------------------
            const isCreatorParticipating = creatorParticipating === "yes";

            if (isCreatorParticipating) {
                const conflict = await checkSessionTimeConflict(req.user.id, selectedDate);

                if (conflict.hasConflict) {
                    req.flash(
                        "error",
                        "You cannot participate in this session because it overlaps with another session you're already participating in."
                    );
                    return res.redirect("/admin/sessions/new");
                }
            }

            // -----------------------------------------
            // CREATE SESSION
            // -----------------------------------------
            const session = await Session.create({
                sportId: Number(sportId),
                createdBy: req.user.id,
                sessionDate: selectedDate,
                venue: venue.trim(),
                teamOnePlayers: teamOnePlayers ? teamOnePlayers.trim() : "",
                teamTwoPlayers: teamTwoPlayers ? teamTwoPlayers.trim() : "",
                additionalPlayersNeeded: Number(additionalPlayersNeeded) || 0,
                status: "scheduled",
            });

            // -----------------------------------------
            // ADD PARTICIPANT RECORD IF PLAYING
            // -----------------------------------------
            if (isCreatorParticipating) {
                await SessionParticipant.create({
                    sessionId: session.id,
                    userId: req.user.id,
                });
            }

            req.flash(
                "success",
                "Session created successfully."
            );

            res.redirect("/admin/dashboard");

        } catch (error) {
            console.error(error);
            req.flash(
                "error",
                "We couldn't create the session. Please try again."
            );
            res.redirect("/admin/sessions/new");
        }
    }
);


// =========================================================
// CANCEL SESSION
// =========================================================

router.post(
    "/admin/sessions/:id/cancel",
    requireAdmin,
    async (req, res) => {

        try {

            const {
                cancellationReason,
            } = req.body;


            // -----------------------------------------
            // VALIDATE REASON
            // -----------------------------------------

            if (
                !cancellationReason ||
                !cancellationReason.trim()
            ) {

                req.flash(
                    "error",
                    "Please provide a cancellation reason."
                );

                return res.redirect(
                    "/admin/dashboard"
                );

            }


            // -----------------------------------------
            // FIND SESSION
            // -----------------------------------------

            const session =
                await Session.findByPk(
                    req.params.id
                );


            if (!session) {

                req.flash(
                    "error",
                    "Session not found."
                );

                return res.redirect(
                    "/admin/dashboard"
                );

            }


            // -----------------------------------------
            // CHECK STATUS
            // -----------------------------------------

            if (session.status !== "scheduled") {

                req.flash(
                    "error",
                    "This session is no longer scheduled."
                );

                return res.redirect(
                    "/admin/dashboard"
                );

            }


            // -----------------------------------------
            // CANCEL SESSION
            // -----------------------------------------

            session.status = "cancelled";

            session.cancellationReason =
                cancellationReason.trim();

            await session.save();


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            req.flash(
                "success",
                "Session cancelled successfully."
            );


            res.redirect("/admin/dashboard");

        } catch (error) {

            console.error(error);

            req.flash(
                "error",
                "We couldn't cancel this session. Please try again."
            );

            res.redirect("/admin/dashboard");
        }

    }
);


// =========================================================
// ADMIN REPORTS
// =========================================================

router.get("/admin/reports", requireAdmin, async (req, res) => {
    try {
        let { startDate, endDate } = req.query;

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const thirtyDaysAhead = new Date();
        thirtyDaysAhead.setDate(today.getDate() + 30);

        const formatDateStr = (d) => d.toISOString().split("T")[0];

        if (!startDate) {
            startDate = formatDateStr(thirtyDaysAgo);
        }
        if (!endDate) {
            endDate = formatDateStr(thirtyDaysAhead);
        }

        const startParsed = new Date(`${startDate}T00:00:00.000Z`);
        const endParsed = new Date(`${endDate}T23:59:59.999Z`);

        let dateError = null;
        if (isNaN(startParsed.getTime()) || isNaN(endParsed.getTime())) {
            dateError = "Invalid date format provided. Please use valid YYYY-MM-DD dates.";
        } else if (startParsed > endParsed) {
            dateError = "Start date must be before or equal to end date.";
        }

        if (dateError) {
            return res.render("admin/reports", {
                user: req.user,
                startDate,
                endDate,
                dateError,
                totalSessions: 0,
                scheduledCount: 0,
                cancelledCount: 0,
                completedCount: 0,
                totalJoinedParticipants: 0,
                totalPlayersNeeded: 0,
                sportPopularity: [],
                allSports: [],
                sessions: [],
            });
        }

        const allSports = await Sport.findAll({
            order: [["name", "ASC"]],
        });

        const sessions = await Session.findAll({
            where: {
                sessionDate: {
                    [Op.between]: [startParsed, endParsed],
                },
            },
            include: [
                {
                    model: Sport,
                },
                {
                    model: SessionParticipant,
                    include: [{ model: User }],
                },
            ],
            order: [["sessionDate", "ASC"]],
        });

        const totalSessions = sessions.length;
        let scheduledCount = 0;
        let cancelledCount = 0;
        let completedCount = 0;
        let totalJoinedParticipants = 0;
        let totalPlayersNeeded = 0;

        const sportStatsMap = {};

        allSports.forEach((sport) => {
            sportStatsMap[sport.id] = {
                sportId: sport.id,
                sportName: sport.name,
                sessionCount: 0,
                participantCount: 0,
                scheduledCount: 0,
                cancelledCount: 0,
                completedCount: 0,
            };
        });

        const now = new Date();

        sessions.forEach((sess) => {
            const joinedCount = sess.SessionParticipants ? sess.SessionParticipants.length : 0;
            totalJoinedParticipants += joinedCount;
            totalPlayersNeeded += Number(sess.additionalPlayersNeeded || 0);

            const sessDate = new Date(sess.sessionDate);
            const isPast = sessDate < now;

            if (sess.status === "cancelled") {
                cancelledCount++;
            } else if (sess.status === "completed" || isPast) {
                completedCount++;
            } else {
                scheduledCount++;
            }

            if (sess.Sport) {
                const sId = sess.Sport.id;
                if (!sportStatsMap[sId]) {
                    sportStatsMap[sId] = {
                        sportId: sId,
                        sportName: sess.Sport.name,
                        sessionCount: 0,
                        participantCount: 0,
                        scheduledCount: 0,
                        cancelledCount: 0,
                        completedCount: 0,
                    };
                }

                sportStatsMap[sId].sessionCount++;
                sportStatsMap[sId].participantCount += joinedCount;
                if (sess.status === "cancelled") {
                    sportStatsMap[sId].cancelledCount++;
                } else if (sess.status === "completed" || isPast) {
                    sportStatsMap[sId].completedCount++;
                } else {
                    sportStatsMap[sId].scheduledCount++;
                }
            }
        });

        const sportPopularity = Object.values(sportStatsMap).map((item) => {
            return {
                ...item,
                sessionPercentage: totalSessions > 0 ? Math.round((item.sessionCount / totalSessions) * 100) : 0,
                participantPercentage: totalJoinedParticipants > 0 ? Math.round((item.participantCount / totalJoinedParticipants) * 100) : 0,
            };
        });

        sportPopularity.sort((a, b) => b.sessionCount - a.sessionCount || b.participantCount - a.participantCount);

        res.render("admin/reports", {
            user: req.user,
            startDate,
            endDate,
            dateError: null,
            totalSessions,
            scheduledCount,
            cancelledCount,
            completedCount,
            totalJoinedParticipants,
            totalPlayersNeeded,
            sportPopularity,
            allSports,
            sessions,
        });
    } catch (error) {
        console.error("Error loading admin reports:", error);
        res.status(500).send("Something went wrong loading reports.");
    }
});


module.exports = router;