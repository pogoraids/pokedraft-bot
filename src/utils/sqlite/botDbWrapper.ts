import { resolve, dirname } from "path";
import * as sql from "sqlite";
import { CREATE_GUILD, CREATE_DIVISION } from "../../constants/dbCatalogs";

export class BotDBWrapper {
  constructor() {}

  dbInstance(): Promise<sql.Database> {
    return sql
      .open(resolve(dirname(".") + "/pokedraft.sqlite"))
      .then((db: sql.Database) => {
        return db;
      });
  }

  createGuildCatalog() {
    return this.dbInstance().then(db => {
      return db
        .run(CREATE_GUILD)
        .then(() => {
          console.log("table created");
        })
        .catch(err => {
          console.log("CRITICAL ERROR", err);
        });
    });
  }

  registerGuild(id: string, name: string) {
    return this.dbInstance().then(db => {
      return db
        .run(
          "INSERT INTO GuildCatalog(guildId, guildName, adminChannel, rolesAllowed, language) VALUES (?, ?, ?, ?, ?)",
          [id, name, "draftbot-admin", "", "en"]
        )
        .then(() => {
          console.log(name + " guild registered");
        });
    });
  }

  getGuildData(id: string, name?: string) {
    return this.dbInstance().then(db => {
      return db
        .get(
          `SELECT guildName, adminChannel, rolesAllowed, language, masterSheet FROM GuildCatalog WHERE guildId="${id}"`
        )
        .then((row: any) => {
          if (row) {
            return row;
          } else {
            if (!name) {
              throw "Missing Guild Name";
            }

            this.registerGuild(id, name);
          }
        })
        .catch(err => {
          console.log("ERROR GETTING", err);
        });
    });
  }

  setGuildData(id: string, property: string, value: string) {
    return this.dbInstance().then(db => {
      return db
        .run(
          `UPDATE GuildCatalog SET ${property}="${value}" WHERE guildId = "${id}"`
        )
        .then(() => {
          console.log("Config updated");
        });
    });
  }

  getLanguage(guildId: string) {
    console.log("asdasdas");
    return this.dbInstance().then(db => {
      return db
        .get(`SELECT language FROM GuildCatalog WHERE guildId = "${guildId}"`)
        .then(row => {
          return row.language;
        });
    });
  }

  createDivisionCatalog() {
    return this.dbInstance().then(db => {
      return db
        .run(CREATE_DIVISION)
        .then(() => {
          console.log("division table created");
        })
        .catch(err => {
          console.log("CRITICAL ERROR", err);
        });
    });
  }

  setDivisionData(
    id: string,
    divisionId: string,
    propertyArray: string[],
    valueArray: string[]
  ) {
    return this.dbInstance().then(db => {
      if (propertyArray.length === valueArray.length) {
        let increment = 0;
        for (const property of propertyArray) {
          const value = valueArray[increment];

          db.run(
            `INSERT INTO DivisionCatalog (guildId, divisionId, ${property}) 
								VALUES ("${id}", "${divisionId}", "${value}") 
								ON CONFLICT (divisionId) DO UPDATE SET ${property}=excluded.${property}`
          ).then(a => {
            console.log("Division data updated");
          });

          ++increment;
        }
      }
    });
  }

  getAllDivisionsFromGuild(id: string, name?: string) {
    return new Promise((resolve, reject) => {
      this.dbInstance().then(db => {
        let responses = [];
        return db
          .all(
            `SELECT guildId, divisionName, members, pickOrder FROM DivisionCatalog WHERE guildId="${id}"`
          )
          .then((rows: any) => {
            if (rows) {
              responses = rows;
              resolve(responses);
              return rows;
            } else {
              console.log(`Draft data not found on this server!`);
              reject();
            }
          })
          .catch(err => {
            reject(err);
          });
      });
    });
  }

  getDivisionData(id: string, divisionId?: string, name?: string) {
    return this.dbInstance().then(db => {
      return db
        .get(
          `SELECT divisionId, divisionName, members, pickOrder FROM DivisionCatalog WHERE guildId="${id}" AND (divisionId="${divisionId}" OR divisionName="${name}")`
        )
        .then((row: any) => {
          if (row) {
            return row;
          } else {
            console.log(`Division ${name} not found!`);
          }
        })
        .catch(err => {
          console.log("ERROR GETTING", err);
        });
    });
  }

  dropDivisionData(id: string, divisionId?: string, name?: string) {
    return this.dbInstance().then(db => {
      db.run(
        `DELETE FROM DivisionCatalog WHERE guildId="${id}" AND divisionId="${divisionId}"`
      ).then(a => {
        console.log("Division data deleted");
      });
    });
  }
}
