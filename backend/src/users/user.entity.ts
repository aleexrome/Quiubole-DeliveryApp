import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { Restaurant } from '../restaurants/restaurant.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isAvailable: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  /**
   * Aprobación por admin. Aplica a roles que deben pasar revisión antes
   * de operar: driver, restaurant, editor. customer/admin se setean a
   * `true` automáticamente en el registro (no requieren approval).
   *
   * Mientras `isApproved=false`, el AppNavigator del frontend redirige
   * a la pantalla "Cuenta en revisión" en lugar de las tabs del rol.
   */
  @Column({ default: false })
  isApproved: boolean;

  /**
   * Si el admin rechaza la cuenta, se guarda la razón aquí y se setea
   * `isActive=false`. Útil para auditoría y para mostrar al user el
   * motivo cuando intente loguearse.
   */
  @Column({ nullable: true })
  rejectionReason: string;

  // ============================================
  // VEHICLE INFO — aplica solo a role=driver. El cliente ve esta info
  // cuando un driver toma su pedido (placas, modelo, color → seguridad).
  // ============================================

  @Column({ nullable: true })
  vehicleType: string; // 'bicycle' | 'motorcycle' | 'car'

  @Column({ nullable: true })
  vehiclePlate: string;

  @Column({ nullable: true })
  vehicleModel: string;

  @Column({ nullable: true })
  vehicleColor: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  currentLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  currentLongitude: number;

  // ============================================
  // ZONA DE COBERTURA — municipio donde el usuario opera/vive.
  // El cliente solo ve negocios de su zona; el driver solo recibe
  // pedidos de su zona; el restaurante atiende su zona. Por ahora MVP
  // con una sola zona activa (Tenancingo). El valor guardado es el
  // `name` de la CoverageZone (string) para flexibilidad — no FK
  // estricto para permitir migrar zonas sin romper users existentes.
  // ============================================
  @Column({ nullable: true })
  zone: string;

  // ============================================
  // DEVO POINTS — sistema de lealtad para clientes.
  // Cada pedido entregado suma 10 pts. Cada 100 pts el sistema crea
  // un UserCoupon pendiente de asignación por el admin (admin define
  // qué cupón le regala: % descuento, monto fijo, delivery gratis...).
  // ============================================
  @Column({ default: 0 })
  devoPoints: number;

  // Total acumulado histórico de puntos (sin restar redenciones). Sirve
  // para gamificación / tier programs futuros sin perder histórico.
  @Column({ default: 0 })
  devoPointsLifetime: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Restaurantes que este usuario (si role=editor) puede editar.
  // Se configura via POST /api/admin/editors/:userId/restaurants
  @ManyToMany(() => Restaurant, (restaurant) => restaurant.editors)
  editedRestaurants: Restaurant[];

  // Virtual property
  get name(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
