const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class SessionParticipant extends Model {}

    SessionParticipant.init(
        {
            sessionId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "SessionParticipant",
        }
    );

    return SessionParticipant;
};