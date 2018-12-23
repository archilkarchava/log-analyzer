import {
  BaseEntity,
  Entity,
  Column,
  ManyToOne,
  PrimaryColumn
  // ManyToMany,
  // JoinTable
} from "typeorm";
import { Visitor } from "./Visitor";
// import { Item } from "./Item";

@Entity()
export class ShoppingCart extends BaseEntity {
  @PrimaryColumn()
  public id: number;

  @Column()
  public isPaid: boolean;

  @ManyToOne(() => Visitor, visitor => visitor.shoppingCarts, { cascade: true })
  public visitor: Visitor;
}
