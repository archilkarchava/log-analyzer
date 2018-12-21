import "reflect-metadata";
import * as express from "express";
import { Visitor } from "./entity/Visitor";
import { createTypeormConn } from "./createTypeormConn";
import { countryLookup } from "./utils/countryLookup";

const port = 4000;

const startServer = async () => {
  try {
    await createTypeormConn();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
  const visitor = new Visitor();
  visitor.ip = "217.89.121.82";
  const userCountry = countryLookup.get(visitor.ip)!.country!.names.en;
  if (userCountry) {
    visitor.country = userCountry;
  } else {
    visitor.country = "unknown";
  }
  console.log("Inserting a new user into the database...");
  try {
    await visitor.save();
  } catch (err) {
    console.error(err);
  }
  console.log("Saved a new user with id: " + visitor.id);
  console.log("Loading users from the database...");
  let users: Visitor[] | null = null;
  try {
    users = await Visitor.find();
  } catch (err) {
    console.error(err);
  }
  console.log("Loaded users: ", users);

  console.log("Here you can setup and run express/koa/any other framework.");
  const app = express();
  app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
  });
};

startServer();
