import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Item } from "./Item";

@Entity()
export class ShoppingCartItem {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => Item, { cascade: true })
  public item: Item;

  @Column()
  public amount: number;

  @Column()
  public dateAdded: Date;
}
