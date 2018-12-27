import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ItemCategory } from "./ItemCategory";

@Entity()
export class CategoryVisit {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => ItemCategory, category => category.visits, {
    cascade: true
  })
  public category: ItemCategory;

  @Column()
  public dateVisited: Date;
}
