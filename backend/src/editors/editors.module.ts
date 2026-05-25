import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { EditorsService } from './editors.service';
import { EditorsController } from './editors.controller';
import { AdminEditorsController } from './admin-editors.controller';
import { EditorAuditLog } from './editor-audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Restaurant, EditorAuditLog]),
    NotificationsModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [EditorsController, AdminEditorsController],
  providers: [EditorsService, AuditLogService],
  exports: [EditorsService, AuditLogService],
})
export class EditorsModule {}
