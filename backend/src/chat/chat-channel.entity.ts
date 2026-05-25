import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';

/**
 * Canal 1:1 entre un editor y el dueño de un restaurante asignado.
 * Se crea automáticamente cuando el admin asigna el editor al restaurante.
 * Único por (restaurantId, editorId) — reasignar al mismo editor no crea
 * duplicado, reabre el canal existente.
 */
@Entity('chat_channels')
@Unique(['restaurantId', 'editorId'])
export class ChatChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  restaurantId: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @Index()
  @Column()
  editorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'editorId' })
  editor: User;

  // Snapshot del dueño actual al momento de crear el canal.
  // Si el restaurante cambia de dueño, el chat se mantiene con el histórico
  // y el service resuelve el dueño actual dinámicamente al enviar.
  @Index()
  @Column({ nullable: true })
  ownerId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
