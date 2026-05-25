import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { ChatService } from '../chat/chat.service';

/**
 * Lógica de negocio del rol EDITOR:
 * - Un editor es staff interno de Quiúbole que puede editar menús,
 *   productos, precios e imágenes de los restaurantes que tenga asignados.
 * - Solo el admin puede promover un usuario a editor y asignarlo a
 *   restaurantes (decisión B2 del diseño).
 * - Un editor puede trabajar para varios restaurantes (many-to-many).
 */
@Injectable()
export class EditorsService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Restaurant)
    private restaurantsRepo: Repository<Restaurant>,
    // @Optional para no romper tests existentes que no mockean ChatService.
    @Optional() private readonly chatService?: ChatService,
  ) {}

  /**
   * Lista todos los usuarios con role=editor, incluyendo los restaurantes
   * que cada uno tiene asignados.
   */
  async listAllEditors(): Promise<User[]> {
    return this.usersRepo.find({
      where: { role: UserRole.EDITOR },
      relations: ['editedRestaurants'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Devuelve los restaurantes asignados a un editor específico.
   * Usado por el editor mismo (desde su app).
   */
  async getMyRestaurants(userId: string): Promise<Restaurant[]> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['editedRestaurants'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user.editedRestaurants ?? [];
  }

  /**
   * Promueve un usuario existente al rol editor. No modifica sus
   * asignaciones de restaurantes (se hacen aparte con assignRestaurants).
   */
  async promoteToEditor(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === UserRole.EDITOR) {
      return user; // ya es editor, idempotente
    }
    user.role = UserRole.EDITOR;
    return this.usersRepo.save(user);
  }

  /**
   * Regresa al usuario al rol client y le quita todas las asignaciones
   * de restaurantes (se eliminan rows de la tabla restaurant_editors).
   */
  async demoteEditor(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['editedRestaurants'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role !== UserRole.EDITOR) {
      throw new BadRequestException('El usuario no es editor');
    }
    user.role = UserRole.CLIENT;
    user.editedRestaurants = [];
    return this.usersRepo.save(user);
  }

  /**
   * Asigna uno o varios restaurantes a un editor. Agrega a lo existente,
   * no reemplaza (si el editor ya tenía restaurantes, se conservan).
   */
  async assignRestaurants(
    userId: string,
    restaurantIds: string[],
  ): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['editedRestaurants'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role !== UserRole.EDITOR) {
      throw new BadRequestException(
        'El usuario debe ser editor antes de asignarle restaurantes',
      );
    }

    const restaurants = await this.restaurantsRepo.findByIds(restaurantIds);
    if (restaurants.length !== restaurantIds.length) {
      throw new NotFoundException(
        'Uno o más restaurantes no existen',
      );
    }

    const existingIds = new Set(
      (user.editedRestaurants ?? []).map((r) => r.id),
    );
    const toAdd = restaurants.filter((r) => !existingIds.has(r.id));
    user.editedRestaurants = [...(user.editedRestaurants ?? []), ...toAdd];
    const saved = await this.usersRepo.save(user);

    // Auto-crear canal de chat con el dueño de cada restaurante recién
    // asignado. Idempotente; no bloquea la asignación si el chat falla.
    if (this.chatService && toAdd.length) {
      await Promise.all(
        toAdd.map((r) =>
          this.chatService!.ensureChannel(r.id, userId).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('[editors] ensureChannel failed:', err);
          }),
        ),
      );
    }

    return saved;
  }

  /**
   * Remueve un restaurante específico del set de asignaciones del editor.
   */
  async unassignRestaurant(
    userId: string,
    restaurantId: string,
  ): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['editedRestaurants'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.editedRestaurants = (user.editedRestaurants ?? []).filter(
      (r) => r.id !== restaurantId,
    );
    return this.usersRepo.save(user);
  }

  /**
   * Helper usado por los guards de productos/uploads: verifica si un
   * editor tiene permiso para editar contenido de cierto restaurante.
   */
  async canEditorEditRestaurant(
    userId: string,
    restaurantId: string,
  ): Promise<boolean> {
    const count = await this.usersRepo
      .createQueryBuilder('user')
      .innerJoin('user.editedRestaurants', 'r', 'r.id = :restaurantId', {
        restaurantId,
      })
      .where('user.id = :userId AND user.role = :role', {
        userId,
        role: UserRole.EDITOR,
      })
      .getCount();
    return count > 0;
  }

  /**
   * Regla unificada de permisos sobre contenido de un restaurante.
   * Tienen permiso:
   *   - El admin (cualquier restaurante)
   *   - El dueño del restaurante (role=restaurant AND ownerId matches)
   *   - Un editor asignado al restaurante
   * Usado por ProductsController y RestaurantsController.
   */
  async canUserEditRestaurant(
    userId: string,
    userRole: UserRole,
    restaurantId: string,
  ): Promise<boolean> {
    // 1. Admin puede todo
    if (userRole === UserRole.ADMIN) return true;

    // 2. Dueño del restaurante
    if (userRole === UserRole.RESTAURANT || userRole === UserRole.MERCHANT) {
      const ownerMatch = await this.restaurantsRepo.count({
        where: { id: restaurantId, ownerId: userId },
      });
      if (ownerMatch > 0) return true;
    }

    // 3. Editor asignado
    if (userRole === UserRole.EDITOR) {
      return this.canEditorEditRestaurant(userId, restaurantId);
    }

    return false;
  }
}
