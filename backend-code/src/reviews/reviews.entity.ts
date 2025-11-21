// ==========================================
// REVIEW ENTITY - CALIFICACIONES Y RESENAS
// ==========================================

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'restaurant_id', nullable: true })
  restaurantId: string;

  @Column({ name: 'driver_id', nullable: true })
  driverId: string;

  // Tipo de review: restaurant, driver, or both
  @Column({ type: 'enum', enum: ['restaurant', 'driver', 'both'], default: 'both' })
  type: 'restaurant' | 'driver' | 'both';

  // Calificacion del restaurante (1-5)
  @Column({ name: 'restaurant_rating', type: 'decimal', precision: 2, scale: 1, nullable: true })
  restaurantRating: number;

  // Calificacion del repartidor (1-5)
  @Column({ name: 'driver_rating', type: 'decimal', precision: 2, scale: 1, nullable: true })
  driverRating: number;

  // Calificacion general del pedido (1-5)
  @Column({ name: 'overall_rating', type: 'decimal', precision: 2, scale: 1 })
  overallRating: number;

  // Comentario del cliente
  @Column({ type: 'text', nullable: true })
  comment: string;

  // Respuesta del restaurante
  @Column({ name: 'restaurant_response', type: 'text', nullable: true })
  restaurantResponse: string;

  @Column({ name: 'restaurant_response_at', nullable: true })
  restaurantResponseAt: Date;

  // Tags predefinidos seleccionados
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  // Fotos adjuntas
  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  // Si el cliente recomendaria
  @Column({ name: 'would_recommend', default: true })
  wouldRecommend: boolean;

  // Si la review es visible publicamente
  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  // Si fue reportada como inapropiada
  @Column({ name: 'is_reported', default: false })
  isReported: boolean;

  @Column({ name: 'report_reason', nullable: true })
  reportReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
