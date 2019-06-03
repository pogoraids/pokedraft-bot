import * as dotenv from "dotenv";

dotenv.config();

export const ENV = {
  PORT: process.env.PORT || "3333",

  SQLITE_FILEDIR: process.env.SQLITE_FILEDIR || "./database",
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || "",
  MANAGED_GUILD_ID: process.env.MANAGED_GUILD_ID || "",

  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: process.env.DB_PORT || "3000",
  DB_NAME: process.env.DB_NAME || "draft",
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "root",
  DB_DIALECT: process.env.DB_DIALECT || "mysql"
};
