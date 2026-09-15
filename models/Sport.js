const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Sport extends Model {}

    Sport.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            createdBy: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: "Sport",
        }
    );

    return Sport;
};