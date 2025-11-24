import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isAvailable: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  currentLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  currentLongitude: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual property
  get name(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
