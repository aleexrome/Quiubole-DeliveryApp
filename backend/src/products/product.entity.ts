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

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'compare_price' })
  comparePrice: number;

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ default: true, name: 'is_available' })
  isAvailable: boolean;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ nullable: true, name: 'preparation_time' })
  preparationTime: number;

  @Column({ type: 'jsonb', nullable: true })
  modifiers: any;

  @Column({ type: 'jsonb', nullable: true })
  options: any;

  @Column({ nullable: true, name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column({ nullable: true, name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ default: 0, name: 'total_sold' })
  totalSold: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
