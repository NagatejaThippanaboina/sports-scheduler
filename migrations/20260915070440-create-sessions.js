"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Sessions", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },

            sportId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Sports",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },

            createdBy: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },

            sessionDate: {
                type: Sequelize.DATE,
                allowNull: false,
            },

            venue: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            teamOnePlayers: {
                type: Sequelize.TEXT,
                allowNull: true,
            },

            teamTwoPlayers: {
                type: Sequelize.TEXT,
                allowNull: true,
            },

            additionalPlayersNeeded: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },

            status: {
                type: Sequelize.ENUM("scheduled", "cancelled", "completed"),
                allowNull: false,
                defaultValue: "scheduled",
            },

            cancellationReason: {
                type: Sequelize.TEXT,
                allowNull: true,
            },

            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },

            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Sessions");
    },
};