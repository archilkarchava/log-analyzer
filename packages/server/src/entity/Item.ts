import {
  BaseEntity,
  Column,
  PrimaryColumn,
  ManyToMany,
  JoinTable
} from "typeorm";
import { ShoppingCart } from "./ShoppingCart";

export class Item extends BaseEntity {
  @PrimaryColumn()
  public id: number;

  @Column()
  public name: string;

  @Column()
  public category: string;

  @ManyToMany(() => ShoppingCart)
  @JoinTable()
  public shoppingCarts: ShoppingCart[];
}
