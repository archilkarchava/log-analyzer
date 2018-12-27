import {
  Column,
  OneToMany,
  ManyToOne,
  Entity,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn
} from "typeorm";
import { ShoppingCart } from "./ShoppingCart";
import { Visitor } from "./Visitor";
import { CategoryVisit } from "./CategoryVisit";
import { ItemVisit } from "./ItemVisit";

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public startDate: Date;

  @Column()
  public endDate: Date;

  @ManyToMany(() => CategoryVisit, { cascade: true })
  @JoinTable()
  public visitedCategories: CategoryVisit[];

  @ManyToMany(() => ItemVisit, { cascade: true })
  @JoinTable()
  public visitedItems: ItemVisit[];

  @OneToMany(() => ShoppingCart, shoppingCart => shoppingCart.session, {
    cascade: true
  })
  public shoppingCarts: ShoppingCart[];

  @ManyToOne(() => Visitor, visitor => visitor.sessions)
  public visitor: Visitor;
}
