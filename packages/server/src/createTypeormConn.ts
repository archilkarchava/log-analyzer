import { createConnection, getConnectionOptions } from "typeorm";

export async function createTypeormConn() {
  let retries = 5;
  while (retries) {
    try {
      const config = await getConnectionOptions(process.env.NODE_ENV);
      return await createConnection({ ...config, name: "default" });
    } catch (err) {
      console.error(err);
      retries -= 1;
      console.log(`retries left: ${retries}`);
      // wait 5 seconds
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  throw new Error("Failed to connect to database.");
}
