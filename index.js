require("dotenv").config();

const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("./config/auth/passport");
const { Op } = require("sequelize");

const {
    User,
    Session,
    Sport,
    SessionParticipant,
} = require("./models");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const playerRoutes = require("./routes/player");

const app = express();

const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

app.use(flash());

app.use((req, res, next) => {
    res.locals.successMessages = req.flash("success");
    res.locals.errorMessages = req.flash("error");

    next();
});

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }

    if (req.user.role === "admin") {
        return res.redirect("/admin/dashboard");
    }

    try {
        const joinedParticipants = await SessionParticipant.findAll({
            where: {
                userId: req.user.id,
            },
        });

        const joinedSessionIds = joinedParticipants.map(
            (participant) => participant.sessionId
        );

        const availableWhere = {
            status: "scheduled",
            sessionDate: {
                [Op.gt]: new Date(),
            },
        };

        if (joinedSessionIds.length > 0) {
            availableWhere.id = {
                [Op.notIn]: joinedSessionIds,
            };
        }

        const availableSessions = await Session.findAll({
            where: availableWhere,
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

        const joinedSessions = await Session.findAll({
            where: {
                id: {
                    [Op.in]: joinedSessionIds.length
                        ? joinedSessionIds
                        : [0],
                },
            },
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

        const mySessions = await Session.findAll({
            where: {
                createdBy: req.user.id,
            },
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

        res.render("player/dashboard", {
            user: req.user,
            sessions: availableSessions,
            joinedSessions,
            mySessions,
        });

    } catch (error) {
        console.error(error);

        res.status(500).send("Something went wrong.");
    }
});

app.use("/", authRoutes);

app.use("/", adminRoutes);

app.use("/", playerRoutes);

app.listen(PORT, () => {
    console.log(`Sports Scheduler running on port ${PORT}`);
});