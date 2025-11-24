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
import { Restaurant } from '../restaurants/restaurant.entity';
import { Order } from '../orders/order.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  @Column({ name: 'driver_id', nullable: true })
  driverId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ name: 'food_rating', type: 'int', nullable: true })
  foodRating: number;

  @Column({ name: 'delivery_rating', type: 'int', nullable: true })
  deliveryRating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ name: 'owner_reply', type: 'text', nullable: true })
  ownerReply: string;

  @Column({ name: 'owner_reply_at', type: 'timestamp', nullable: true })
  ownerReplyAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driver_id' })
  driver: User;
}
