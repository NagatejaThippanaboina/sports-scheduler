const express = require("express");

const {
    Session,
    Sport,
    SessionParticipant,
    User,
} = require("../models");

const { requireAuth } = require("../middleware/auth");
const { checkSessionTimeConflict } = require("../utils/conflictCheck");

const router = express.Router();


// =========================================================
// CREATE SESSION PAGE
// =========================================================

router.get("/sessions/new", requireAuth, async (req, res) => {
    try {
        const sports = await Sport.findAll({
            order: [["name", "ASC"]],
        });

        res.render("player/create-session", {
            user: req.user,
            sports,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});


// =========================================================
// CREATE SESSION
// =========================================================

router.post("/sessions", requireAuth, async (req, res) => {
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


        // ---------------------------------------------
        // REQUIRED FIELD VALIDATION
        // ---------------------------------------------

        if (
            !sportId ||
            !sessionDate ||
            !venue ||
            additionalPlayersNeeded === undefined ||
            additionalPlayersNeeded === ""
        ) {
            req.flash(
                "error",
                "Please fill in all required fields."
            );

            return res.redirect("/sessions/new");
        }


        // ---------------------------------------------
        // CHECK SPORT
        // ---------------------------------------------

        const sport = await Sport.findByPk(sportId);

        if (!sport) {
            req.flash(
                "error",
                "Please select a valid sport."
            );

            return res.redirect("/sessions/new");
        }


        // ---------------------------------------------
        // VALIDATE PLAYERS NEEDED
        // ---------------------------------------------

        const parsedPlayersNeeded =
            Number(additionalPlayersNeeded);

        if (
            !Number.isInteger(parsedPlayersNeeded) ||
            parsedPlayersNeeded < 0
        ) {
            req.flash(
                "error",
                "Additional players needed must be a valid number."
            );

            return res.redirect("/sessions/new");
        }


        // ---------------------------------------------
        // VALIDATE DATE
        // ---------------------------------------------

        const selectedDate = new Date(sessionDate);

        if (Number.isNaN(selectedDate.getTime())) {
            req.flash(
                "error",
                "Please enter a valid date and time."
            );

            return res.redirect("/sessions/new");
        }


        if (selectedDate <= new Date()) {
            req.flash(
                "error",
                "The session date and time must be in the future."
            );

            return res.redirect("/sessions/new");
        }


        // ---------------------------------------------
        // VALIDATE VENUE
        // ---------------------------------------------

        const cleanedVenue = venue.trim();

        if (!cleanedVenue) {
            req.flash(
                "error",
                "Venue cannot be empty."
            );

            return res.redirect("/sessions/new");
        }


        // ---------------------------------------------
        // CHECK CREATOR PARTICIPATION & CONFLICTS
        // ---------------------------------------------

        const isCreatorParticipating =
            creatorParticipating === "yes";

        if (isCreatorParticipating) {
            const conflict = await checkSessionTimeConflict(req.user.id, selectedDate);

            if (conflict.hasConflict) {
                req.flash(
                    "error",
                    "You cannot participate in this session because it overlaps with another session you're already participating in."
                );

                return res.redirect("/sessions/new");
            }
        }


        // ---------------------------------------------
        // CREATE SESSION
        // ---------------------------------------------

        const session = await Session.create({

            sportId: Number(sportId),

            createdBy: req.user.id,

            sessionDate: selectedDate,

            venue: cleanedVenue,

            teamOnePlayers: teamOnePlayers
                ? teamOnePlayers.trim()
                : null,

            teamTwoPlayers: teamTwoPlayers
                ? teamTwoPlayers.trim()
                : null,

            additionalPlayersNeeded:
                parsedPlayersNeeded,

            status: "scheduled",
        });


        // ---------------------------------------------
        // ADD CREATOR AS PARTICIPANT
        // ---------------------------------------------

        if (isCreatorParticipating) {

            await SessionParticipant.create({

                sessionId: session.id,

                userId: req.user.id,

            });
        }


        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        req.flash(
            "success",
            `${sport.name} session created successfully!`
        );

        res.redirect("/dashboard");

    } catch (error) {

        console.error(error);

        req.flash(
            "error",
            "We couldn't create the session. Please try again."
        );

        res.redirect("/sessions/new");
    }
});


// =========================================================
// VIEW SESSION DETAILS
// =========================================================

router.get(
    "/sessions/:id",
    requireAuth,
    async (req, res) => {

        try {

            const session = await Session.findByPk(
                req.params.id,
                {
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
                }
            );


            if (!session) {
                return res
                    .status(404)
                    .send("Session not found.");
            }


            res.render(
                "player/session-details",
                {
                    session,
                    user: req.user,
                }
            );

        } catch (error) {

            console.error(error);

            res
                .status(500)
                .send("Something went wrong.");
        }
    }
);


// =========================================================
// JOIN SESSION
// =========================================================

router.post(
    "/sessions/:id/join",
    requireAuth,
    async (req, res) => {

        try {

            const session =
                await Session.findByPk(
                    req.params.id,
                    {
                        include: [
                            {
                                model: Sport,
                            },
                        ],
                    }
                );


            // -----------------------------------------
            // SESSION EXISTS?
            // -----------------------------------------

            if (!session) {

                req.flash(
                    "error",
                    "This session could not be found."
                );

                return res.redirect("/dashboard");
            }


            // -----------------------------------------
            // SESSION STATUS
            // -----------------------------------------

            if (session.status !== "scheduled") {

                req.flash(
                    "error",
                    "This session is no longer available."
                );

                return res.redirect("/dashboard");
            }


            // -----------------------------------------
            // SESSION IN THE FUTURE?
            // -----------------------------------------

            if (
                new Date(session.sessionDate) <=
                new Date()
            ) {

                req.flash(
                    "error",
                    "This session has already started. You can no longer join it."
                );

                return res.redirect("/dashboard");
            }


            // -----------------------------------------
            // ALREADY JOINED?
            // -----------------------------------------

            const existingParticipant =
                await SessionParticipant.findOne({
                    where: {
                        sessionId: session.id,
                        userId: req.user.id,
                    },
                });


            if (existingParticipant) {

                req.flash(
                    "error",
                    "You have already joined this session."
                );

                return res.redirect("/dashboard");
            }


            // -----------------------------------------
            // TIME CONFLICT CHECK (EXACT & OVERLAPPING)
            // -----------------------------------------

            const conflict = await checkSessionTimeConflict(
                req.user.id,
                session.sessionDate,
                session.id
            );

            if (conflict.hasConflict) {
                req.flash(
                    "error",
                    "You cannot join this session because it overlaps with another session you're already participating in."
                );

                const referer = req.get("Referrer");
                return res.redirect(referer || "/dashboard");
            }


            // -----------------------------------------
            // SESSION FULL?
            // -----------------------------------------

            if (session.additionalPlayersNeeded <= 0) {

                req.flash(
                    "error",
                    "This session is already full."
                );

                return res.redirect("/dashboard");
            }


            // -----------------------------------------
            // ADD PLAYER
            // -----------------------------------------

            await SessionParticipant.create({

                sessionId: session.id,

                userId: req.user.id,
            });


            // -----------------------------------------
            // REDUCE AVAILABLE SPOTS
            // -----------------------------------------

            session.additionalPlayersNeeded -= 1;

            await session.save();


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            req.flash(
                "success",
                `You're in! You joined the ${session.Sport.name} session.`
            );

            res.redirect("/dashboard");

        } catch (error) {

            console.error(error);

            req.flash(
                "error",
                "We couldn't join this session. Please try again."
            );

            res.redirect("/dashboard");
        }
    }
);


// =========================================================
// CANCEL SESSION
// =========================================================

router.post(
    "/sessions/:id/cancel",
    requireAuth,
    async (req, res) => {

        try {

            const { cancellationReason } = req.body;


            // -----------------------------------------
            // FIND SESSION
            // -----------------------------------------

            const session = await Session.findByPk(
                req.params.id,
                {
                    include: [
                        {
                            model: Sport,
                        },
                    ],
                }
            );


            // -----------------------------------------
            // SESSION EXISTS?
            // -----------------------------------------

            if (!session) {

                req.flash(
                    "error",
                    "This session could not be found."
                );

                return res.redirect("/dashboard");
            }


            // -----------------------------------------
            // ONLY CREATOR CAN CANCEL
            // -----------------------------------------

            if (session.createdBy !== req.user.id) {

                req.flash(
                    "error",
                    "You can only cancel sessions created by you."
                );

                return res.redirect(
                    `/sessions/${session.id}`
                );
            }


            // -----------------------------------------
            // SESSION MUST BE SCHEDULED
            // -----------------------------------------

            if (session.status !== "scheduled") {

                req.flash(
                    "error",
                    "This session is already cancelled or completed."
                );

                return res.redirect(
                    `/sessions/${session.id}`
                );
            }


            // -----------------------------------------
            // SESSION MUST BE IN THE FUTURE
            // -----------------------------------------

            if (
                new Date(session.sessionDate) <=
                new Date()
            ) {

                req.flash(
                    "error",
                    "A session cannot be cancelled after its scheduled time."
                );

                return res.redirect(
                    `/sessions/${session.id}`
                );
            }


            // -----------------------------------------
            // VALIDATE CANCELLATION REASON
            // -----------------------------------------

            const cleanedReason =
                cancellationReason
                    ? cancellationReason.trim()
                    : "";


            if (!cleanedReason) {

                req.flash(
                    "error",
                    "Please provide a cancellation reason."
                );

                return res.redirect(
                    `/sessions/${session.id}`
                );
            }


            // -----------------------------------------
            // CANCEL SESSION
            // -----------------------------------------

            session.status = "cancelled";

            session.cancellationReason = cleanedReason;

            await session.save();


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            req.flash(
                "success",
                `${session.Sport.name} session cancelled successfully.`
            );

            res.redirect("/dashboard");

        } catch (error) {

            console.error(error);

            req.flash(
                "error",
                "We couldn't cancel this session. Please try again."
            );

            res.redirect("/dashboard");
        }
    }
);


module.exports = router;