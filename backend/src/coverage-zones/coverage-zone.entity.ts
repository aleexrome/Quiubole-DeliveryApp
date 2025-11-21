import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from '../restaurants/restaurant.entity';

@Entity('coverage_zones')
export class CoverageZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  centerLatitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  centerLongitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  radiusKm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraDeliveryFee: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Column()
  restaurantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
