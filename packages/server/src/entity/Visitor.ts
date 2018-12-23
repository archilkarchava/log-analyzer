import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany
} from "typeorm";
import { ShoppingCart } from "./ShoppingCart";

@Entity()
export class Visitor extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  public id: string;

  @Column({ unique: true, nullable: true })
  public userId: number;

  @Column({ unique: true })
  public ip: string;

  @Column()
  public country: string;

  @OneToMany(() => ShoppingCart, shoppingCart => shoppingCart.visitor)
  public shoppingCarts: ShoppingCart[];
}
