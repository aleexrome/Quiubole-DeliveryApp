// ==========================================
// DRIVER BALANCE SERVICE
// Sistema de Control de Efectivo
// ==========================================

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';

// Esta entidad guarda el balance de efectivo del repartidor
interface DriverBalance {
  id: string;
  driverId: string;
  cashCollected: number;        // Total cobrado en efectivo
  owedToQuiubole: number;       // Lo que debe a Quiubole (comisiones)
  lastSettlement: Date;         // Ultima liquidacion
  guaranteeDeposit: number;     // Deposito de garantia
  cashLimit: number;            // Limite de efectivo permitido
  isBlocked: boolean;           // Bloqueado por deuda
}

@Injectable()
export class DriverBalanceService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Registrar cobro en efectivo
  async recordCashCollection(driverId: string, orderId: string, amount: number) {
    // Obtener o crear balance del repartidor
    const balance = await this.getDriverBalance(driverId);

    // Calcular comision de Quiubole (ej: 15% del total)
    const commission = amount * 0.15;

    // Actualizar balance
    balance.cashCollected += amount;
    balance.owedToQuiubole += commission;

    // Verificar si excede limite
    if (balance.owedToQuiubole > balance.cashLimit) {
      // Bloquear cuenta si excede limite
      balance.isBlocked = true;
    }

    await this.saveDriverBalance(balance);

    return {
      cashCollected: balance.cashCollected,
      owedToQuiubole: balance.owedToQuiubole,
      isBlocked: balance.isBlocked,
    };
  }

  // Verificar si repartidor puede aceptar pedido en efectivo
  async canAcceptCashOrder(driverId: string, orderAmount: number): Promise<boolean> {
    const balance = await this.getDriverBalance(driverId);

    // No puede si esta bloqueado
    if (balance.isBlocked) {
      return false;
    }

    // No puede si excederia su limite
    const futureDebt = balance.owedToQuiubole + (orderAmount * 0.15);
    if (futureDebt > balance.cashLimit) {
      return false;
    }

    return true;
  }

  // Registrar liquidacion (pago del repartidor a Quiubole)
  async recordSettlement(driverId: string, amount: number, reference: string) {
    const balance = await this.getDriverBalance(driverId);

    if (amount > balance.owedToQuiubole) {
      throw new BadRequestException('El monto excede la deuda');
    }

    balance.owedToQuiubole -= amount;
    balance.lastSettlement = new Date();

    // Desbloquear si ya no tiene deuda excesiva
    if (balance.owedToQuiubole <= balance.cashLimit * 0.8) {
      balance.isBlocked = false;
    }

    await this.saveDriverBalance(balance);

    // Registrar transaccion
    await this.recordTransaction(driverId, {
      type: 'settlement',
      amount,
      reference,
      date: new Date(),
    });

    return {
      newBalance: balance.owedToQuiubole,
      isBlocked: balance.isBlocked,
    };
  }

  // Obtener resumen de balance
  async getBalanceSummary(driverId: string) {
    const balance = await this.getDriverBalance(driverId);
    const todayOrders = await this.getTodayCashOrders(driverId);

    return {
      // Lo que ha cobrado hoy en efectivo
      todayCashCollected: todayOrders.reduce((sum, o) => sum + o.total, 0),

      // Lo que debe a Quiubole (comisiones)
      owedToQuiubole: balance.owedToQuiubole,

      // Su limite de efectivo
      cashLimit: balance.cashLimit,

      // Cuanto puede seguir cobrando antes de bloqueo
      availableLimit: balance.cashLimit - balance.owedToQuiubole,

      // Esta bloqueado?
      isBlocked: balance.isBlocked,

      // Deposito de garantia
      guaranteeDeposit: balance.guaranteeDeposit,

      // Ultima liquidacion
      lastSettlement: balance.lastSettlement,

      // Mensaje de alerta
      warning: balance.owedToQuiubole > balance.cashLimit * 0.7
        ? 'Estas cerca de tu limite. Realiza una liquidacion.'
        : null,
    };
  }

  // Obtener pedidos en efectivo de hoy
  private async getTodayCashOrders(driverId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.ordersRepository.find({
      where: {
        driverId,
        paymentMethod: 'cash',
        status: 'delivered',
        // deliveredAt >= today
      },
    });
  }

  // Helpers (en produccion estas serian queries a DB)
  private async getDriverBalance(driverId: string): Promise<DriverBalance> {
    // TODO: Obtener de base de datos
    return {
      id: '1',
      driverId,
      cashCollected: 0,
      owedToQuiubole: 0,
      lastSettlement: new Date(),
      guaranteeDeposit: 500,  // $500 de garantia
      cashLimit: 1000,        // Limite de $1000
      isBlocked: false,
    };
  }

  private async saveDriverBalance(balance: DriverBalance) {
    // TODO: Guardar en base de datos
    console.log('Balance actualizado:', balance);
  }

  private async recordTransaction(driverId: string, transaction: any) {
    // TODO: Guardar transaccion en historial
    console.log('Transaccion registrada:', transaction);
  }
}

/*
=====================================
FLUJO COMPLETO DE EFECTIVO:
=====================================

1. CLIENTE PIDE CON EFECTIVO
   └── paymentMethod = 'cash'

2. REPARTIDOR ACEPTA PEDIDO
   └── Sistema verifica: canAcceptCashOrder()
   └── Si excede limite → no puede aceptar

3. REPARTIDOR ENTREGA Y COBRA
   └── Marca como entregado
   └── Sistema registra: recordCashCollection()
   └── Comision se suma a su deuda

4. FIN DEL DIA
   └── Repartidor ve su balance en app
   └── Tiene $X de comisiones pendientes

5. LIQUIDACION
   └── Repartidor transfiere a cuenta de Quiubole
   └── Sube comprobante en app
   └── Admin verifica y registra: recordSettlement()

6. SI NO LIQUIDA
   └── Al dia siguiente: cuenta bloqueada
   └── No puede aceptar mas pedidos
   └── Hasta que pague

=====================================
*/
