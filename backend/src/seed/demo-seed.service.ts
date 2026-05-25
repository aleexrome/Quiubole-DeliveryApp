// ==========================================
// DemoSeedService
//
// Crea usuarios y restaurante demo si SEED_DEMO_USERS=true en env.
// Es IDEMPOTENTE: si el email ya existe, salta. Seguro dejarlo activo
// en producción durante la fase de demos.
//
// Para deshabilitarlo: borra la var SEED_DEMO_USERS en Railway.
// ==========================================

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { UserRole } from '../common/enums/user-role.enum';

interface DemoUserSpec {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone: string;
  zone?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleColor?: string;
}

const DEMO_USERS: DemoUserSpec[] = [
  {
    email: 'customer@devolon.com',
    firstName: 'Cliente',
    lastName: 'Demo',
    role: UserRole.CUSTOMER,
    phone: '5555555501',
    zone: 'Tenancingo',
  },
  {
    email: 'driver@devolon.com',
    firstName: 'Rider',
    lastName: 'Demo',
    role: UserRole.DRIVER,
    phone: '5555555502',
    zone: 'Tenancingo',
    vehicleType: 'motorcycle',
    vehiclePlate: 'TEN-001',
    vehicleModel: 'Italika FT-125',
    vehicleColor: 'Negro',
  },
  {
    email: 'restaurant@devolon.com',
    firstName: 'Dueño',
    lastName: 'Demo',
    role: UserRole.RESTAURANT,
    phone: '5555555503',
    zone: 'Tenancingo',
  },
  {
    email: 'editor@devolon.com',
    firstName: 'Editor',
    lastName: 'Demo',
    role: UserRole.EDITOR,
    phone: '5555555504',
    zone: 'Tenancingo',
  },
  {
    email: 'admin@devolon.com',
    firstName: 'Admin',
    lastName: 'Devolón',
    role: UserRole.ADMIN,
    phone: '5555555505',
    zone: 'Tenancingo',
  },
];

@Injectable()
export class DemoSeedService implements OnModuleInit {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async onModuleInit() {
    if (process.env.SEED_DEMO_USERS !== 'true') {
      return;
    }

    this.logger.log('Seeding demo users…');
    const password = await bcrypt.hash('Test1234', 10);

    let restaurantOwnerId: string | null = null;

    for (const spec of DEMO_USERS) {
      try {
        const existing = await this.users.findOne({
          where: { email: spec.email },
        });
        if (existing) {
          this.logger.log(`  → ${spec.email} ya existe, skip`);
          if (spec.role === UserRole.RESTAURANT) {
            restaurantOwnerId = existing.id;
          }
          continue;
        }
        const user = this.users.create({
          email: spec.email,
          password,
          firstName: spec.firstName,
          lastName: spec.lastName,
          name: `${spec.firstName} ${spec.lastName}`,
          phone: spec.phone,
          role: spec.role,
          isApproved: true,
          isActive: true,
          emailVerified: true,
          phoneVerified: true,
          zone: spec.zone,
          vehicleType: spec.vehicleType,
          vehiclePlate: spec.vehiclePlate,
          vehicleModel: spec.vehicleModel,
          vehicleColor: spec.vehicleColor,
        } as any);
        const saved = await this.users.save(user);
        this.logger.log(`  ✓ Creado ${spec.email} (${spec.role})`);
        if (spec.role === UserRole.RESTAURANT) {
          restaurantOwnerId = (saved as any).id;
        }
      } catch (e) {
        this.logger.error(
          `  ✗ Falló crear ${spec.email}: ${(e as Error).message}`,
        );
      }
    }

    // Crear restaurante demo si tenemos owner y no existe.
    if (restaurantOwnerId) {
      try {
        const existingRestaurant = await this.restaurants.findOne({
          where: { ownerId: restaurantOwnerId },
        });
        if (!existingRestaurant) {
          const restaurant = this.restaurants.create({
            name: 'Tacos El Demo',
            description:
              'Restaurante de demostración en Tenancingo. Los mejores tacos al pastor del municipio.',
            category: 'Tacos',
            phone: '7224445555',
            email: 'restaurant@devolon.com',
            latitude: 18.9606,
            longitude: -99.5908,
            address: 'Centro de Tenancingo, Estado de México',
            zone: 'Tenancingo',
            deliveryRadiusKm: 8,
            minimumOrder: 50,
            deliveryFee: 25,
            estimatedDeliveryTime: 30,
            isActive: true,
            isOpen: true,
            isApproved: true,
            rating: 4.7,
            totalReviews: 42,
            commissionRate: 15,
            ownerId: restaurantOwnerId,
          } as any);
          await this.restaurants.save(restaurant);
          this.logger.log('  ✓ Creado restaurante "Tacos El Demo"');
        } else {
          this.logger.log('  → Restaurante demo ya existe, skip');
        }
      } catch (e) {
        this.logger.error(
          `  ✗ Falló crear restaurante demo: ${(e as Error).message}`,
        );
      }
    }

    this.logger.log('Demo seed completado.');
  }
}
