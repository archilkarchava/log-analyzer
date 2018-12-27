import {
  Entity,
  Column,
  ManyToOne,
  PrimaryColumn,
  ManyToMany,
  JoinTable
} from "typeorm";
import { Session } from "./Session";
import { ShoppingCartItem } from "./ShoppingCartItem";

@Entity()
export class ShoppingCart {
  @PrimaryColumn({ unique: true })
  public id: number;

  @ManyToMany(() => ShoppingCartItem, { cascade: true })
  @JoinTable()
  public items: ShoppingCartItem[];

  @Column({ type: "date", nullable: true })
  public paymentDate: Date | null;

  @ManyToOne(() => Session, session => session.shoppingCarts)
  public session: Session;
}
