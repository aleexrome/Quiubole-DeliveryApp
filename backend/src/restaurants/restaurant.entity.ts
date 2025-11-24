import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
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

  @Column({ nullable: true, name: 'cover_image' })
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

  @Column({ default: 0, name: 'total_reviews' })
  totalReviews: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'minimum_order' })
  minimumOrder: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'delivery_fee' })
  deliveryFee: number;

  @Column({ default: 30, name: 'estimated_delivery_time' })
  estimatedDeliveryTime: number;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ default: false, name: 'is_open' })
  isOpen: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'opening_hours' })
  openingHours: any;

  @Column({ type: 'simple-array', nullable: true })
  categories: string[];

  @Column({ nullable: true, name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15, name: 'commission_rate' })
  commissionRate: number;

  @Column({ nullable: true, name: 'stripe_account_id' })
  stripeAccountId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
