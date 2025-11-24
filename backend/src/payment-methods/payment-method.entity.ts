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

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  type: string; // 'card', 'paypal', 'cash'

  @Column({ nullable: true })
  stripePaymentMethodId: string;

  @Column({ nullable: true })
  cardBrand: string;

  @Column({ nullable: true })
  cardLast4: string;

  @Column({ nullable: true })
  cardExpMonth: number;

  @Column({ nullable: true })
  cardExpYear: number;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
