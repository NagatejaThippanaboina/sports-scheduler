const express = require("express");

const {
    Session,
    Sport,
    SessionParticipant,
    User,
} = require("../models");

const { requireAuth } = require("../middleware/auth");

const router = express.Router();


// VIEW SESSION DETAILS
router.get("/sessions/:id", requireAuth, async (req, res) => {
    try {
        const session = await Session.findByPk(req.params.id, {
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
        });

        if (!session) {
            return res.status(404).send("Session not found.");
        }

        res.render("player/session-details", {
            session,
            user: req.user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});

// JOIN SESSION
router.post("/sessions/:id/join", requireAuth, async (req, res) => {
    try {
        const session = await Session.findByPk(req.params.id);

        if (!session) {
            req.flash("error", "This session could not be found.");
            return res.redirect("/dashboard");
        }

        if (session.status !== "scheduled") {
            req.flash("error", "This session is no longer available.");
            return res.redirect("/dashboard");
        }

        if (new Date(session.sessionDate) <= new Date()) {
            req.flash(
                "error",
                "This session has already started. You can no longer join it."
            );
            return res.redirect("/dashboard");
        }

        const existingParticipant = await SessionParticipant.findOne({
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

        if (session.additionalPlayersNeeded <= 0) {
            req.flash(
                "error",
                "This session is already full."
            );
            return res.redirect("/dashboard");
        }

        await SessionParticipant.create({
            sessionId: session.id,
            userId: req.user.id,
        });

        session.additionalPlayersNeeded -= 1;

        await session.save();

        req.flash(
            "success",
            `You're in! You joined the ${session.Sport?.name || "sports"} session.`
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
});


module.exports = router;