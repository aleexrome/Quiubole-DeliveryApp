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
import { OrderStatus } from '../common/enums/order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ nullable: true })
  customerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ nullable: true })
  driverId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: User;

  @Column({ nullable: true })
  restaurantId: string;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  serviceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tip: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ nullable: true })
  couponId: string;

  @Column({ nullable: true })
  couponCode: string;

  @Column()
  deliveryAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  deliveryLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  deliveryLongitude: number;

  @Column({ nullable: true })
  deliveryInstructions: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentIntentId: string;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  estimatedDeliveryTime: Date;

  @Column({ nullable: true })
  actualDeliveryTime: Date;

  @Column({ nullable: true })
  confirmedAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  preparingAt: Date;

  @Column({ nullable: true })
  readyAt: Date;

  @Column({ nullable: true })
  pickedUpAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ type: 'jsonb', nullable: true })
  items: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
