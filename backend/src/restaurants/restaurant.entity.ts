import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column()
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ nullable: true })
  estimatedDeliveryTime: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isOpen: boolean;

  @Column({ type: 'json', nullable: true })
  schedule: {
    day: string;
    open: string;
    close: string;
    isOpen: boolean;
  }[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  coverageRadius: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
