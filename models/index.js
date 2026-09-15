"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";

const config = require(__dirname + "/../config/config.js")[env];

const db = {};

let sequelize;

if (config.use_env_variable) {
    sequelize = new Sequelize(
        process.env[config.use_env_variable],
        config
    );
} else {
    sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        config
    );
}

// Load all models
fs.readdirSync(__dirname)
    .filter((file) => {
        return (
            file.indexOf(".") !== 0 &&
            file !== basename &&
            file.slice(-3) === ".js" &&
            file.indexOf(".test.js") === -1
        );
    })
    .forEach((file) => {
        const model = require(path.join(__dirname, file))(
            sequelize,
            Sequelize.DataTypes
        );

        db[model.name] = model;
    });

// ===============================
// MODEL RELATIONSHIPS
// ===============================

// User -> Sports
db.User.hasMany(db.Sport, {
    foreignKey: "createdBy",
});

db.Sport.belongsTo(db.User, {
    foreignKey: "createdBy",
});

// User -> Sessions
db.User.hasMany(db.Session, {
    foreignKey: "createdBy",
});

db.Session.belongsTo(db.User, {
    foreignKey: "createdBy",
});

// Sport -> Sessions
db.Sport.hasMany(db.Session, {
    foreignKey: "sportId",
});

db.Session.belongsTo(db.Sport, {
    foreignKey: "sportId",
});

db.Session.hasMany(db.SessionParticipant, {
    foreignKey: "sessionId",
});

db.SessionParticipant.belongsTo(db.Session, {
    foreignKey: "sessionId",
});

db.User.hasMany(db.SessionParticipant, {
    foreignKey: "userId",
});

db.SessionParticipant.belongsTo(db.User, {
    foreignKey: "userId",
});

// Sequelize instance
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;