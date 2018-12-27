import * as fs from "fs";
import * as readline from "readline";
import { countryLookup } from "../utils/countryLookup";
import { Visitor } from "../entity/Visitor";
import { Item } from "../entity/Item";
import { Session } from "../entity/Session";
import { ShoppingCart } from "../entity/ShoppingCart";
import { ShoppingCartItem } from "../entity/ShoppingCartItem";
import { ItemCategory } from "../entity/ItemCategory";
import { ItemVisit } from "../entity/ItemVisit";
import { CategoryVisit } from "../entity/CategoryVisit";
import { Connection, EntityManager } from "typeorm";

export class Logs {
  private logFilePath: string;
  private dbEntityManager: EntityManager;
  private rawLogsByIp: Map<string, string[]>;
  private visitors: Visitor[];
  private regexIp = /(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g;
  private regexDate = /(([1]{1}[9]{1}[9]{1}\d{1})|([2-9]{1}\d{3}))-[0,1]?\d{1}-(([0-2]?\d{1})|([3][0,1]{1}))/g;
  private regexTime = /(([0-1][0-9])|([2][0-3])):([0-5][0-9]):([0-5][0-9])/g;
  private regexItemId = /(?<=\bgoods_id=)(\d+)/g;
  private regexItemAmount = /(?<=\bamount=)(\d+)/g;
  private regexCategory = /(?<=\ball_to_the_bottom\.com\/)((\w)+(\w+\b(?<!\bcart|pay|success_pay_(\d)+)))/g;
  private regexCategorySlashItem = /(?<=\ball_to_the_bottom\.com\/)(\w+\/\w+)/g;
  private regexCartId = /(?<=\bcart_id=)(\d+)/g;
  private regexUserId = /(?<=\buser_id=)(\d+)/g;
  constructor(filePath: string, dbConnection: Connection) {
    this.logFilePath = filePath;
    this.dbEntityManager = dbConnection.manager;
  }

  public async getData() {
    if (!this.visitors) {
      try {
        this.visitors = await this.collectVisitors();
      } catch (err) {
        throw new Error(err);
      }
    }
    return this.visitors;
  }

  public async saveToDB() {
    try {
      const visitors = await this.collectVisitors();
      const visitorRepo = this.dbEntityManager.getRepository(Visitor);
      await visitorRepo.save(visitors);
    } catch (err) {
      throw new Error(err);
    }
  }

  private async saveItemsToDB() {
    try {
      const items = await this.collectItems();
      const itemRepo = this.dbEntityManager.getRepository(Item);
      await itemRepo.save(items);
    } catch (err) {
      throw new Error(err);
    }
  }

  private async getRawLogsByIp() {
    if (!this.rawLogsByIp) {
      try {
        this.rawLogsByIp = await this.readIpLogs();
      } catch (err) {
        throw new Error(err);
      }
    }
  }

  private collectVisitors(): Promise<Visitor[]> {
    const result: Visitor[] = [];
    return new Promise(async (resolve, reject) => {
      try {
        await this.saveItemsToDB();
      } catch (err) {
        reject(new Error(err));
      }
      const ipsLogs = this.rawLogsByIp;
      for (const [ip, log] of ipsLogs) {
        let userId: number | null = null;
        const sessions: Session[] = [];
        const visitedCategories: CategoryVisit[] = [];
        const visitedItems: ItemVisit[] = [];
        const shoppingCarts: ShoppingCart[] = [];
        const sessionStartDate = log[0].match(this.regexDate)![0];
        const sessionStartTime = log[0].match(this.regexTime)![0];
        const sessionStartDateTime = new Date(
          `${sessionStartDate}T${sessionStartTime}Z`
        );
        const dateTime: {
          cur: Date;
          prev: Date;
          sessionStart: Date;
        } = {
          cur: sessionStartDateTime,
          prev: sessionStartDateTime,
          sessionStart: sessionStartDateTime
        };
        let curShoppingCart: ShoppingCart | null = null;
        let curShoppingCartItems: ShoppingCartItem[] = [];
        for (let i = 1; i < log.length; i++) {
          let shoppingCartId: number | null = null;
          dateTime.prev = dateTime.cur;
          const curLine = log[i];
          const prevLine = log[i - 1];
          const curDate = curLine.match(this.regexDate)![0];
          const curTime = curLine.match(this.regexTime)![0];
          dateTime.cur = new Date(`${curDate}T${curTime}Z`);
          if (
            curLine.match(this.regexCategory) &&
            !curLine.match(this.regexCategorySlashItem)
          ) {
            visitedCategories.push({
              category: {
                name: curLine.match(this.regexCategory)![0]
              },
              dateVisited: dateTime.cur
            } as CategoryVisit);
          }
          if (curLine.match(this.regexCategorySlashItem)) {
            const [itemCategory, itemName] = curLine
              .match(this.regexCategorySlashItem)![0]
              .split("/");
            visitedItems.push({
              item: await this.dbEntityManager.findOne(Item, {
                where: { name: itemName, category: itemCategory }
              }),
              dateVisited: dateTime.cur
            } as ItemVisit);
          } else if (curLine.includes("cart?")) {
            shoppingCartId = parseInt(curLine.match(this.regexCartId)![0], 10);
            if (shoppingCartId) {
              const itemId = parseInt(curLine.match(this.regexItemId)![0], 10);
              const itemAmount = parseInt(
                curLine.match(this.regexItemAmount)![0],
                10
              );
              if (curShoppingCart && curShoppingCart!.id === shoppingCartId) {
                curShoppingCartItems.push({
                  item: await this.dbEntityManager.findOne(Item, itemId),
                  amount: itemAmount,
                  dateAdded: dateTime.cur
                } as ShoppingCartItem);
                curShoppingCart!.items = curShoppingCartItems;
              } else {
                curShoppingCartItems = [
                  {
                    item: await this.dbEntityManager.findOne(Item, itemId),
                    amount: itemAmount,
                    dateAdded: dateTime.cur
                  } as ShoppingCartItem
                ];
                curShoppingCart = {
                  id: shoppingCartId!,
                  items: curShoppingCartItems,
                  paymentDate: null
                } as ShoppingCart;
              }
            }
          } else if (curLine.includes("success_pay_")) {
            if (curLine.includes(curShoppingCart!.id.toString())) {
              curShoppingCart!.paymentDate = dateTime.cur;
              shoppingCarts.push(curShoppingCart!);
              curShoppingCart = null;
              userId = parseInt(prevLine.match(this.regexUserId)![0], 10);
            }
          }
          // 5 * 60 * 60 * 1000 == 5 hours
          let sessionHasEnded =
            dateTime.cur.getTime() - dateTime.prev.getTime() >
            5 * 60 * 60 * 1000;
          if (i === log.length - 1) {
            dateTime.prev = dateTime.cur;
            sessionHasEnded = true;
          }
          if (sessionHasEnded) {
            sessions.push({
              startDate: dateTime.sessionStart,
              endDate: dateTime.prev,
              visitedItems,
              visitedCategories,
              shoppingCarts
            } as Session);
            dateTime.sessionStart = dateTime.cur;
          }
        }

        result.push({
          ip,
          country: countryLookup(ip),
          userId,
          sessions
        });
      }
      resolve(result);
    });
  }

  private collectItems(): Promise<Item[]> {
    const result: Map<number, Item> = new Map();
    return new Promise(async (resolve, reject) => {
      try {
        await this.getRawLogsByIp();
      } catch (err) {
        reject(new Error(err));
      }
      for (const ipLog of this.rawLogsByIp.values()) {
        for (let i = 1; i < ipLog.length; i++) {
          const curLine = ipLog[i];
          const prevLine = ipLog[i - 1];
          if (curLine.match(this.regexItemId)) {
            const id = parseInt(curLine.match(this.regexItemId)![0], 10);
            const [categoryName, itemName] = prevLine
              .match(this.regexCategorySlashItem)![0]
              .split("/");
            result.set(id, {
              id,
              name: itemName,
              category: {
                name: categoryName
              } as ItemCategory
            } as Item);
          }
        }
      }
      resolve([...result.values()]);
    });
  }

  private readIpLogs(): Promise<Map<string, string[]>> {
    const result: Map<string, string[]> = new Map();
    const inputStream = fs.createReadStream(this.logFilePath, "utf8");
    const rl = readline.createInterface(inputStream);
    return new Promise((resolve, reject) => {
      rl.on("line", line => {
        const ip = line.match(this.regexIp)![0];
        if (result.has(ip)) {
          const logs = result.get(ip)!;
          logs.push(line);
          result.set(ip, logs);
        } else {
          const logs: string[] = [];
          logs.push(line);
          result.set(ip, logs);
        }
      });
      rl.on("error", err => {
        reject(new Error(err));
      });
      rl.on("close", () => {
        resolve(result);
      });
    });
  }
}
