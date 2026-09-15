const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class User extends Model {}

    User.init(
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },

            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            role: {
                type: DataTypes.ENUM("admin", "player"),
                allowNull: false,
                defaultValue: "player",
            },
        },
        {
            sequelize,
            modelName: "User",
        }
    );

    return User;
};