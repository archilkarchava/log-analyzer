import { Column, PrimaryColumn, Entity, ManyToOne, OneToMany } from "typeorm";
import { ItemCategory } from "./ItemCategory";
import { ItemVisit } from "./ItemVisit";
import { ShoppingCartItem } from "./ShoppingCartItem";

@Entity()
export class Item {
  @PrimaryColumn({ unique: true })
  public id: number;

  @Column()
  public name: string;

  @ManyToOne(() => ItemCategory, category => category.items, {
    cascade: true
  })
  public category: ItemCategory;

  @OneToMany(() => ItemVisit, itemPageVisit => itemPageVisit.item)
  public visits: ItemVisit[];

  @OneToMany(() => ShoppingCartItem, shoppingCartItem => shoppingCartItem.item)
  public shoppingCartItems: ShoppingCartItem[];
}
