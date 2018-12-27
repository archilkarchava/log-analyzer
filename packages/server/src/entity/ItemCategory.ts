import { Entity, PrimaryColumn, OneToMany } from "typeorm";
import { Item } from "./Item";
import { CategoryVisit } from "./CategoryVisit";

@Entity()
export class ItemCategory {
  @PrimaryColumn()
  public name: string;

  @OneToMany(() => Item, item => item.category)
  public items: Item[];

  @OneToMany(
    () => CategoryVisit,
    categoryPageVisit => categoryPageVisit.category
  )
  public visits: CategoryVisit[];
}
