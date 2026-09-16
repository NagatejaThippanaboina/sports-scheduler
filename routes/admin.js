const express = require("express");

const {
    Sport,
    Session,
    SessionParticipant,
    User,
} = require("../models");

const { requireAdmin } = require("../middleware/auth");

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
            } = req.body;


            // -----------------------------------------
            // REQUIRED FIELDS
            // -----------------------------------------

            if (!sportId || !sessionDate || !venue) {

                return res
                    .status(400)
                    .send(
                        "Sport, date/time and venue are required."
                    );

            }


            // -----------------------------------------
            // CHECK SPORT
            // -----------------------------------------

            const sport = await Sport.findOne({

                where: {
                    id: sportId,
                    createdBy: req.user.id,
                },

            });


            if (!sport) {

                return res
                    .status(403)
                    .send(
                        "You can only create sessions for your own sports."
                    );

            }


            // -----------------------------------------
            // CREATE SESSION
            // -----------------------------------------

            await Session.create({

                sportId,

                createdBy: req.user.id,

                sessionDate,

                venue: venue.trim(),

                teamOnePlayers:
                    teamOnePlayers || "",

                teamTwoPlayers:
                    teamTwoPlayers || "",

                additionalPlayersNeeded:
                    Number(additionalPlayersNeeded) || 0,

                status: "scheduled",

            });


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

            res.redirect("/admin/dashboard");
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


module.exports = router;