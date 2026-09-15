require("dotenv").config();

const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("./config/auth/passport");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

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

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/dashboard", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }

    res.send(`Welcome ${req.user.name}! Role: ${req.user.role}`);
});

app.use("/", authRoutes);

app.use("/", adminRoutes);

app.listen(PORT, () => {
    console.log(`Sports Scheduler running on port ${PORT}`);
});