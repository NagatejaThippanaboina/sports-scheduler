const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Session extends Model {}

    Session.init(
        {
            sportId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            createdBy: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            sessionDate: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            venue: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            teamOnePlayers: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            teamTwoPlayers: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            additionalPlayersNeeded: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            status: {
                type: DataTypes.ENUM(
                    "scheduled",
                    "cancelled",
                    "completed"
                ),
                allowNull: false,
                defaultValue: "scheduled",
            },

            cancellationReason: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "Session",
        }
    );

    return Session;
};