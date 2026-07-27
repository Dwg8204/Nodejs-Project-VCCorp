import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleName } from 'common/enums/database.enums';
import { User } from './user';

@Entity({ name: 'role' })
export class Role {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'name_role', type: 'varchar', length: 50, unique: true })
  nameRole: RoleName;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
