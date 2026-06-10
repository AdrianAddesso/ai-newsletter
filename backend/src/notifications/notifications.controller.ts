import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  Query,
} from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../modules/auth/decorators/user.decorator'
import type { NotificationDto } from './notifications.types'
import type { AuthUser } from '../modules/auth/types/auth-user.type'

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @GetUser() user: AuthUser,
    @Query('limit') limit?: string,
  ): Promise<NotificationDto[]> {
    const notificationLimit = Math.min(parseInt(limit || '20', 10) || 20, 100)
    return this.notificationsService.getUserNotifications(user.id, notificationLimit)
  }

  @Get('unread-count')
  async getUnreadCount(@GetUser() user: AuthUser): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(user.id)
    return { count }
  }

  @Patch(':id/read')
  @HttpCode(200)
  async markAsRead(@Param('id') notificationId: string): Promise<NotificationDto> {
    return this.notificationsService.markAsRead(notificationId)
  }

  @Patch('read-all')
  @HttpCode(200)
  async markAllAsRead(@GetUser() user: AuthUser): Promise<{ success: boolean }> {
    await this.notificationsService.markAllAsRead(user.id)
    return { success: true }
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteNotification(@Param('id') notificationId: string): Promise<void> {
    await this.notificationsService.deleteNotification(notificationId)
  }
}
