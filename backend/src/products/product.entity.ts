import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from '../restaurants/restaurant.entity';
import { Category } from '../categories/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  comparePrice: number;

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isApproved: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  preparationTime: number;

  @Column({ type: 'jsonb', nullable: true })
  modifiers: any;

  @Column({ type: 'jsonb', nullable: true })
  options: any;

  @Column({ nullable: true })
  restaurantId: string;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ default: 0 })
  totalSold: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
