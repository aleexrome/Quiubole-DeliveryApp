import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
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

  @Column({ nullable: true })
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

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumOrder: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ default: 30 })
  estimatedDeliveryTime: number;

  // ============================================
  // ZONA + RADIO DE ENTREGA
  //
  // `zone` es la etiqueta del municipio (ej. "Tenancingo") — sirve para
  // analytics y mercadeo. La filtración REAL del feed para el cliente se
  // hace por distancia: el cliente solo ve el restaurante si está dentro
  // del `deliveryRadiusKm` desde lat/lng del local. Esto resuelve casos
  // de borde entre municipios sin trámite manual.
  // ============================================
  @Column({ nullable: true })
  zone: string;

  // Radio máximo de entrega en km. Default 5 (caminata o moto urbana
  // razonable). El dueño puede ajustarlo en su panel de ajustes.
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5 })
  deliveryRadiusKm: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isOpen: boolean;

  @Column({ default: false })
  isApproved: boolean;

  @Column({ type: 'jsonb', nullable: true })
  openingHours: any;

  @Column({ type: 'simple-array', nullable: true })
  categories: string[];

  @Column({ nullable: true })
  ownerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  commissionRate: number;

  @Column({ nullable: true })
  stripeAccountId: string;

  // Editores (staff de Quiúbole) asignados por admin. Pueden editar
  // productos, menú, precios e imágenes del restaurante.
  // Tabla de unión: restaurant_editors (restaurant_id, editor_id)
  @ManyToMany(() => User, (user) => user.editedRestaurants)
  @JoinTable({
    name: 'restaurant_editors',
    joinColumn: { name: 'restaurant_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'editor_id', referencedColumnName: 'id' },
  })
  editors: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
