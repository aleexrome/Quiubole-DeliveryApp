import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EditorsService } from './editors.service';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { UserRole } from '../common/enums/user-role.enum';

describe('EditorsService', () => {
  let service: EditorsService;
  let usersRepo: any;
  let restaurantsRepo: any;
  let qb: any;

  beforeEach(async () => {
    qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };
    usersRepo = {
      findOne: jest.fn(),
      save: jest.fn((u) => Promise.resolve(u)),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    restaurantsRepo = {
      count: jest.fn().mockResolvedValue(0),
      findByIds: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        EditorsService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Restaurant), useValue: restaurantsRepo },
      ],
    }).compile();
    service = module.get(EditorsService);
  });

  describe('canUserEditRestaurant()', () => {
    it('admin siempre puede editar cualquier restaurante (sin tocar DB)', async () => {
      const result = await service.canUserEditRestaurant(
        'admin-id',
        UserRole.ADMIN,
        'r1',
      );
      expect(result).toBe(true);
      expect(restaurantsRepo.count).not.toHaveBeenCalled();
      expect(usersRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('dueño con ownerId que coincide → true', async () => {
      restaurantsRepo.count.mockResolvedValueOnce(1);
      const result = await service.canUserEditRestaurant(
        'owner-id',
        UserRole.RESTAURANT,
        'r1',
      );
      expect(result).toBe(true);
      expect(restaurantsRepo.count).toHaveBeenCalledWith({
        where: { id: 'r1', ownerId: 'owner-id' },
      });
    });

    it('usuario restaurant sin ownerId match → false', async () => {
      restaurantsRepo.count.mockResolvedValueOnce(0);
      const result = await service.canUserEditRestaurant(
        'other-owner',
        UserRole.RESTAURANT,
        'r1',
      );
      expect(result).toBe(false);
    });

    it('editor asignado al restaurante → true', async () => {
      qb.getCount.mockResolvedValueOnce(1);
      const result = await service.canUserEditRestaurant(
        'editor-id',
        UserRole.EDITOR,
        'r1',
      );
      expect(result).toBe(true);
      expect(qb.innerJoin).toHaveBeenCalled();
    });

    it('editor NO asignado al restaurante → false', async () => {
      qb.getCount.mockResolvedValueOnce(0);
      const result = await service.canUserEditRestaurant(
        'editor-id',
        UserRole.EDITOR,
        'r1',
      );
      expect(result).toBe(false);
    });

    it('client/customer no puede editar nunca', async () => {
      const result = await service.canUserEditRestaurant(
        'c-id',
        UserRole.CLIENT,
        'r1',
      );
      expect(result).toBe(false);
      expect(restaurantsRepo.count).not.toHaveBeenCalled();
    });

    it('driver no puede editar', async () => {
      const result = await service.canUserEditRestaurant(
        'd-id',
        UserRole.DRIVER,
        'r1',
      );
      expect(result).toBe(false);
    });
  });

  describe('promoteToEditor()', () => {
    it('es idempotente si el usuario ya es editor', async () => {
      const existing = { id: 'u1', role: UserRole.EDITOR };
      usersRepo.findOne.mockResolvedValue(existing);
      const result = await service.promoteToEditor('u1');
      expect(result).toBe(existing);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });

    it('cambia role a editor y guarda', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 'u1', role: UserRole.CLIENT });
      await service.promoteToEditor('u1');
      expect(usersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'u1', role: UserRole.EDITOR }),
      );
    });

    it('404 si el usuario no existe', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.promoteToEditor('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('demoteEditor()', () => {
    it('vuelve a CLIENT y limpia asignaciones', async () => {
      const editor = {
        id: 'e1',
        role: UserRole.EDITOR,
        editedRestaurants: [{ id: 'r1' }, { id: 'r2' }],
      };
      usersRepo.findOne.mockResolvedValue(editor);
      await service.demoteEditor('e1');
      expect(editor.editedRestaurants).toEqual([]);
      expect(editor.role).toBe(UserRole.CLIENT);
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('400 si el usuario no es editor', async () => {
      usersRepo.findOne.mockResolvedValue({
        id: 'u1',
        role: UserRole.CLIENT,
      });
      await expect(service.demoteEditor('u1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('assignRestaurants()', () => {
    it('rechaza si el usuario no es editor', async () => {
      usersRepo.findOne.mockResolvedValue({
        id: 'u1',
        role: UserRole.CLIENT,
        editedRestaurants: [],
      });
      await expect(
        service.assignRestaurants('u1', ['r1']),
      ).rejects.toThrow(BadRequestException);
    });

    it('es aditivo — no reemplaza asignaciones existentes', async () => {
      const editor = {
        id: 'e1',
        role: UserRole.EDITOR,
        editedRestaurants: [{ id: 'r1' }],
      };
      usersRepo.findOne.mockResolvedValue(editor);
      restaurantsRepo.findByIds.mockResolvedValue([
        { id: 'r1' },
        { id: 'r2' },
      ]);
      await service.assignRestaurants('e1', ['r1', 'r2']);
      // r1 ya existía, solo se agrega r2 (no se duplica)
      expect(editor.editedRestaurants.map((r) => r.id).sort()).toEqual([
        'r1',
        'r2',
      ]);
    });

    it('404 si algún restaurantId no existe', async () => {
      usersRepo.findOne.mockResolvedValue({
        id: 'e1',
        role: UserRole.EDITOR,
        editedRestaurants: [],
      });
      restaurantsRepo.findByIds.mockResolvedValue([{ id: 'r1' }]);
      await expect(
        service.assignRestaurants('e1', ['r1', 'r2']),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
