import "reflect-metadata";
import * as express from "express";
// import * as fs from "fs";
import { createTypeormConn } from "./createTypeormConn";
// import { Logs } from "./modules/Logs";

const port = 4000;

async function startServer() {
  try {
    await createTypeormConn();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
  // const visitor = new Visitor();
  // visitor.ip = "121.165.118.201";
  // const visitorCountry = countryLookup(visitor.ip)!.country!.names.en;
  // if (visitorCountry) {
  //   visitor.country = visitorCountry;
  // } else {
  //   visitor.country = "unknown";
  // }
  // console.log("Inserting a new user into the database...");
  // try {
  //   await visitor.save();
  //   console.log("Saved a new user with id: " + visitor.id);
  // } catch (err) {
  //   console.error(err);
  // }
  // console.log("Loading users from the database...");
  // let visitors: Visitor[] | null = null;
  // try {
  //   visitors = await Visitor.find();
  // } catch (err) {
  //   console.error(err);
  // }
  // console.log("Loaded users: ", visitors);

  // const logs = new Logs(`${__dirname}/../data/logs.txt`);
  // try {
  //   const visitors = await logs.getVisitors();
  //   fs.writeFileSync("./data.json", JSON.stringify([...visitors], null, 2), "utf-8");
  // } catch (err) {
  //   throw new Error(err);
  // }

  const app = express();
  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
}

startServer();
