import { app } from "electron";
import type { Knex } from "knex";
import { resolve } from "path";

const isDevelopment = !app.isPackaged;

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "better-sqlite3",
    connection: {
      filename: "./dev.sqlite3",
    },
    useNullAsDefault: true,
    migrations: {
      tableName: "knex_migrations",
      extension: "ts",
      directory: "./src/main/db/migrations",
      loadExtensions: [".ts", ".js"],
    },
  },

  production: {
    client: "better-sqlite3",
    connection: {
      filename: resolve(app.getPath("userData"), "database.db"),
    },
    useNullAsDefault: true,
    migrations: {
      tableName: "knex_migrations",
      extension: "ts",
      directory: resolve(__dirname, "migrations"),
      loadExtensions: [".ts", ".js"],
    },
  },
};

export default isDevelopment ? config.development : config.production;
