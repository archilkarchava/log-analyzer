import { Entity, Column, OneToMany, PrimaryColumn } from "typeorm";
import { Session } from "./Session";

@Entity()
export class Visitor {
  @PrimaryColumn({ unique: true })
  public ip: string;

  @Column({ type: "text", nullable: true })
  public country: string | null;

  @Column({ type: "bigint", unique: true, nullable: true })
  public userId: number | null;

  @OneToMany(() => Session, session => session.visitor, { cascade: true })
  public sessions: Session[];
}
