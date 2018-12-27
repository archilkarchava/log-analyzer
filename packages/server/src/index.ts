import "reflect-metadata";
import * as express from "express";
import { createTypeormConn } from "./createTypeormConn";
import { Logs } from "./modules/Logs";

const port = 4000;

async function startServer() {
  try {
    console.log("Connecting to the database.");
    const dbConnection = await createTypeormConn();
    const logs = new Logs(`${__dirname}/../data/logs.txt`, dbConnection);
    console.log("Populating DB with data.");
    await logs.saveToDB();
  } catch (err) {
    throw new Error(err);
  }
  const app = express();
  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}

startServer().catch(err => {
  console.error(err);
  process.exit(1);
});
