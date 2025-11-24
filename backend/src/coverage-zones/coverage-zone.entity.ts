import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('coverage_zones')
export class CoverageZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  centerLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  centerLongitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  radiusKm: number;

  @Column({ type: 'jsonb', nullable: true })
  polygon: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  baseDeliveryFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  perKmFee: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
