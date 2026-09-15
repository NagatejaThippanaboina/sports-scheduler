require("dotenv").config();

const databaseConfig = {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.DATABASE_NAME,
    host: process.env.POSTGRES_HOST,
    dialect: "postgres",
};

module.exports = {
    development: databaseConfig,

    test: {
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.TEST_DATABASE_NAME,
        host: process.env.POSTGRES_HOST,
        dialect: "postgres",
    },

    production: {
        use_env_variable: "DATABASE_URL",
        dialect: "postgres",
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    },
};