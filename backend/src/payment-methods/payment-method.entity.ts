import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum PaymentMethodType {
  CARD = 'card',
  CASH = 'cash',
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: PaymentMethodType })
  type: PaymentMethodType;

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

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
