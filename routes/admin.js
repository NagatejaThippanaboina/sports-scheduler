const express = require("express");

const { Sport, Session, SessionParticipant, User } = require("../models");const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ===============================
// ADMIN DASHBOARD
// ===============================

router.get("/admin/dashboard", requireAdmin, async (req, res) => {
    try {
        const sports = await Sport.findAll({
            where: {
                createdBy: req.user.id,
            },
            order: [["createdAt", "DESC"]],
        });

        const sessions = await Session.findAll({
            where: { createdBy: req.user.id },
            include: [
                { model: Sport },
                {
                    model: SessionParticipant,
                    include: [{ model: User }],
                },
            ],
            order: [["sessionDate", "ASC"]],
        });

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

// ===============================
// CREATE SPORT
// ===============================

router.get("/admin/sports/new", requireAdmin, (req, res) => {
    res.render("admin/create-sport");
});

router.post("/admin/sports", requireAdmin, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).send("Sport name is required.");
        }

        await Sport.create({
            name: name.trim(),
            createdBy: req.user.id,
        });

        res.redirect("/admin/dashboard");
    } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});

// ===============================
// CREATE SESSION PAGE
// ===============================

router.get("/admin/sessions/new", requireAdmin, async (req, res) => {
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
        res.status(500).send("Something went wrong.");
    }
});

// ===============================
// CREATE SESSION
// ===============================

router.post("/admin/sessions", requireAdmin, async (req, res) => {
    try {
        const {
            sportId,
            sessionDate,
            venue,
            teamOnePlayers,
            teamTwoPlayers,
            additionalPlayersNeeded,
        } = req.body;

        if (!sportId || !sessionDate || !venue) {
            return res.status(400).send(
                "Sport, date/time and venue are required."
            );
        }

        const sport = await Sport.findOne({
            where: {
                id: sportId,
                createdBy: req.user.id,
            },
        });

        if (!sport) {
            return res.status(403).send(
                "You can only create sessions for your own sports."
            );
        }

        await Session.create({
            sportId,
            createdBy: req.user.id,
            sessionDate,
            venue: venue.trim(),
            teamOnePlayers: teamOnePlayers || "",
            teamTwoPlayers: teamTwoPlayers || "",
            additionalPlayersNeeded:
                Number(additionalPlayersNeeded) || 0,
            status: "scheduled",
        });

        res.redirect("/admin/dashboard");
    } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});

module.exports = router;