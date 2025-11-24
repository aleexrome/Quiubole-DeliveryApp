import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column()
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumOrder: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ default: 30 })
  estimatedDeliveryTime: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isOpen: boolean;

  @Column({ default: false })
  isApproved: boolean;

  @Column({ type: 'jsonb', nullable: true })
  openingHours: any;

  @Column({ type: 'simple-array', nullable: true })
  categories: string[];

  @Column({ nullable: true })
  ownerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  commissionRate: number;

  @Column({ nullable: true })
  stripeAccountId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
