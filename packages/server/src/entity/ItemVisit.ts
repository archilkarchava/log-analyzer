import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from "typeorm";
import { Item } from "./Item";

@Entity()
export class ItemVisit {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => Item, item => item.visits, { cascade: true })
  public item: Item;

  @Column()
  public dateVisited: Date;
}
