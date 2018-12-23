import * as fs from "fs";
import * as readline from "readline";
import { countryLookup } from "../utils/countryLookup";

interface IVisitedItem {
  item: IItem;
  dateVisited: Date;
}

interface IVisitedItemCategory {
  category: string;
  dateVisited: Date;
}

interface IShoppingCartItem {
  item: IItem;
  amount: number;
  dateAdded: Date;
}

interface ISession {
  startDate: Date;
  endDate: Date;
  itemsVisited: IVisitedItem[];
  categoriesVisited: IVisitedItemCategory[];
  shoppingCarts: IShoppingCart[];
}

interface IVisitor {
  ip: string;
  country: string | null;
  sessions: ISession[];
  userId: number | null;
}

interface IItem {
  id: number;
  name: string;
  category: string;
}

interface IShoppingCart {
  id: number;
  items: IShoppingCartItem[];
  paymentDate: Date | null;
}

export class Logs {
  private regexIp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
  private regexDate = /(([1]{1}[9]{1}[9]{1}\d{1})|([2-9]{1}\d{3}))-[0,1]?\d{1}-(([0-2]?\d{1})|([3][0,1]{1}))/g;
  private regexTime = /(([0-1][0-9])|([2][0-3])):([0-5][0-9]):([0-5][0-9])/g;
  // private regexItem = /(?<=\b\/(canned_food|fresh_fish|frozen_fish|semi_manufactures|caviar)\/)(\w+)/g;
  private regexItemId = /(?<=\bgoods_id=)(\d+)/g;
  private regexItemAmount = /(?<=\bamount=)(\d+)/g;
  // private regexItemCategory = /(canned_food|fresh_fish|frozen_fish|semi_manufactures|caviar)/g;
  private regexCategory = /(?<=\ball_to_the_bottom\.com\/)((\w)+(\w+\b(?<!\bcart|pay|success_pay_(\d)+)))/g;
  private regexCategorySlashItem = /(?<=\ball_to_the_bottom\.com\/)(\w+\/\w+)/g;
  private regexCartId = /(?<=\bcart_id=)(\d+)/g;
  private regexUserId = /(?<=\buser_id=)(\d+)/g;
  private logFilePath: string;
  private logs: Map<string, string[]>;
  private visitors: Map<string, IVisitor>;
  private itemsKeyId: Map<number | string, IItem>;
  private itemsKeyName: Map<number | string, IItem>;
  constructor(filePath: string) {
    this.logFilePath = filePath;
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

  private collectVisitors(): Promise<Map<string, IVisitor>> {
    const result: Map<string, IVisitor> = new Map();
    return new Promise(async (resolve, reject) => {
      try {
        await this.getItems();
      } catch (err) {
        reject(new Error(err));
      }
      if (!this.logs) {
        try {
          await this.read();
        } catch (err) {
          reject(new Error(err));
        }
      }
      const ipsLogs = this.logs;
      for (const [ip, log] of ipsLogs) {
        let userId: number | null = null;
        const sessions: ISession[] = [];
        const categoriesVisited: IVisitedItemCategory[] = [];
        const itemsVisited: IVisitedItem[] = [];
        const shoppingCarts: IShoppingCart[] = [];
        const firstVisitDate = log[0].match(this.regexDate)![0];
        const firstVisitTime = log[0].match(this.regexTime)![0];
        const sessionStartDateTime = new Date(
          `${firstVisitDate}T${firstVisitTime}Z`
        );
        const DateTime: {
          curLine: Date;
          prevLine: Date;
          sessionStart: Date;
        } = {
          curLine: sessionStartDateTime,
          prevLine: sessionStartDateTime,
          sessionStart: sessionStartDateTime
        };
        let curShoppingCart: IShoppingCart | null = null;
        let curShoppingCartItems: IShoppingCartItem[] = [];
        for (let i = 1; i < log.length; i++) {
          let shoppingCartId: number | null = null;
          DateTime.prevLine = DateTime.curLine;
          const curLine = log[i];
          const prevLine = log[i - 1];
          const curDate = curLine.match(this.regexDate)![0];
          const curTime = curLine.match(this.regexTime)![0];
          DateTime.curLine = new Date(`${curDate}T${curTime}Z`);
          if (curLine.match(this.regexCategory)) {
            categoriesVisited.push({
              category: curLine.match(this.regexCategory)![0],
              dateVisited: DateTime.curLine
            });
          }
          if (curLine.match(this.regexCategorySlashItem)) {
            const itemName = curLine
              .match(this.regexCategorySlashItem)![0]
              .split("/")[1];
            itemsVisited.push({
              item: this.itemsKeyName.get(itemName)!,
              dateVisited: DateTime.curLine
            });
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
                  item: this.itemsKeyId.get(itemId)!,
                  amount: itemAmount,
                  dateAdded: DateTime.curLine
                });
                curShoppingCart!.items = curShoppingCartItems;
              } else {
                curShoppingCartItems = [
                  {
                    item: this.itemsKeyId.get(itemId)!,
                    amount: itemAmount,
                    dateAdded: DateTime.curLine
                  }
                ];
                curShoppingCart = {
                  id: shoppingCartId!,
                  items: curShoppingCartItems,
                  paymentDate: null
                };
              }
            }
          } else if (curLine.includes("success_pay_")) {
            if (curLine.includes(curShoppingCart!.id.toString())) {
              curShoppingCart!.paymentDate = DateTime.curLine;
              shoppingCarts.push(curShoppingCart!);
              curShoppingCart = null;
              userId = parseInt(prevLine.match(this.regexUserId)![0], 10);
            }
          }
          // 5 * 60 * 60 * 1000 == 5 hours
          let sessionHasEnded =
            DateTime.curLine.getTime() - DateTime.prevLine.getTime() >
            5 * 60 * 60 * 1000;
          if (i === log.length - 1) {
            DateTime.prevLine = DateTime.curLine;
            sessionHasEnded = true;
          }
          if (sessionHasEnded) {
            sessions.push({
              startDate: DateTime.sessionStart,
              endDate: DateTime.prevLine,
              itemsVisited,
              categoriesVisited,
              shoppingCarts
            });
            DateTime.sessionStart = DateTime.curLine;
          }
        }

        result.set(ip, {
          ip,
          country: countryLookup(ip),
          userId,
          sessions
        });
      }
      resolve(result);
    });
  }

  private async getItems() {
    if (!this.itemsKeyId || !this.itemsKeyName) {
      try {
        this.itemsKeyId = await this.collectItems("id");
        this.itemsKeyName = await this.collectItems("name");
      } catch (err) {
        throw new Error(err);
      }
    }
  }

  private collectItems(
    returnMapKey: "id" | "name" | "category" = "id"
  ): Promise<Map<number | string, IItem>> {
    const result: Map<number | string, IItem> = new Map();
    return new Promise(async (resolve, reject) => {
      try {
        await this.read();
      } catch (err) {
        reject(new Error(err));
      }
      const ipsLogs = this.logs;
      for (const ipLog of ipsLogs.values()) {
        for (let i = 1; i < ipLog.length; i++) {
          const curLine = ipLog[i];
          const prevLine = ipLog[i - 1];
          if (curLine.match(this.regexItemId)) {
            const id = parseInt(curLine.match(this.regexItemId)![0], 10);
            const [category, name] = prevLine
              .match(this.regexCategorySlashItem)![0]
              .split("/");
            switch (returnMapKey) {
              case "id":
                result.set(id, {
                  id,
                  name,
                  category
                });
                break;
              case "name":
                result.set(name, {
                  id,
                  name,
                  category
                });
                break;
              case "category":
                result.set(category, {
                  id,
                  name,
                  category
                });
            }
          }
        }
      }
      // const resultSortedById = new Map(
      //   [...result].sort((a, b) => (a[0] > b[0] ? 1 : -1))
      // );
      resolve(result);
    });
  }

  private async read() {
    try {
      this.logs = await this.sortLogsByIps();
    } catch (err) {
      throw new Error(err);
    }
  }

  private sortLogsByIps(): Promise<Map<string, string[]>> {
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
