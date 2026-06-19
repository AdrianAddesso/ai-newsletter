import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateNotificationDto, NotificationDto } from './notifications.types'
import { newsletter_state } from '@prisma/client'
import { user_role } from '@prisma/client'
import type { notifications } from '@prisma/client'
import { NotificationType } from '@shared/enums/notification-type.enum'

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async createNotification(data: CreateNotificationDto): Promise<NotificationDto> {
        const notification = await this.prisma.notifications.create({
            data: {
                user_id: data.userId,
                newsletter_id: data.newsletterId || null,
                type: data.type,
                title: data.title,
                message: data.message,
                action_path: data.actionPath || null,
            },
        })

        return this.mapToDto(notification)
    }

    async getUserNotifications(userId: string, limit: number = 20): Promise<NotificationDto[]> {
        const notifications = await this.prisma.notifications.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit,
        })

        return notifications.map(
            notification => this.mapToDto(notification),
        )
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.prisma.notifications.count({
            where: {
                user_id: userId,
                is_read: false,
            },
        })
    }

    async markAsRead(notificationId: string): Promise<NotificationDto> {
        const notification = await this.prisma.notifications.update({
            where: { id: notificationId },
            data: { is_read: true },
        })

        return this.mapToDto(notification)
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.prisma.notifications.updateMany({
            where: {
                user_id: userId,
                is_read: false,
            },
            data: { is_read: true },
        })
    }

    async deleteNotification(notificationId: string): Promise<void> {
        await this.prisma.notifications.delete({
            where: { id: notificationId },
        })
    }

    async notifyNewsletterStateChange(
        newsletterId: string,
        newState: newsletter_state,
        reviewedByUserId?: string,
    ): Promise<void> {
        const newsletter = await this.prisma.newsletters.findUnique({
            where: { id: newsletterId },
            include: {
                users_newsletters_created_by_user_idTousers: {
                    select: { id: true, name: true, last_name: true },
                },
                users_newsletters_approved_by_user_idTousers: {
                    select: { id: true, name: true, last_name: true },
                },
            },
        })

        if (!newsletter) {
            throw new BadRequestException('Newsletter no encontrado')
        }

        const creatorName = newsletter.users_newsletters_created_by_user_idTousers
            ? `${newsletter.users_newsletters_created_by_user_idTousers.name} ${newsletter.users_newsletters_created_by_user_idTousers.last_name}`
            : 'Anónimo'

        const reviewer = reviewedByUserId
            ? await this.prisma.users.findUnique({
                where: { id: reviewedByUserId },
                select: {
                    name: true,
                    last_name: true,
                },
            })
            : null

        const reviewerName = reviewer
            ? `${reviewer.name} ${reviewer.last_name}`
            : 'Un revisor'

        // Notificaciones según el estado
        const notificationsToCreate: CreateNotificationDto[] = []

        console.log({
            creator: creatorName,
            reviewer: reviewerName,
            state: newState,
        })

        switch (newState) {
            case newsletter_state.IN_REVIEW:
            case newsletter_state.RESUBMITTED:
                await this.notifyReviewersAndAdmins(
                    newsletterId,
                    `Newsletter "${newsletter.title}" está en revisión`,
                    `El newsletter "${newsletter.title}" de ${creatorName} está esperando tu revisión.`,
                    `/reviews/${newsletterId}`,
                )

                return

            case newsletter_state.APPROVED:
                if (newsletter.users_newsletters_created_by_user_idTousers?.id) {
                    notificationsToCreate.push({
                        userId: newsletter.users_newsletters_created_by_user_idTousers.id,
                        title: 'Newsletter Aprobado',
                        message: `Tu newsletter "${newsletter.title}" ha sido aprobado por ${reviewerName} y está listo para exportar.`,
                        type: NotificationType.APPROVED,
                        actionPath: `/newsletters/export/${newsletterId}`,
                        newsletterId,
                    })
                }
                break

            case newsletter_state.CHANGES_REQUESTED:
                if (newsletter.users_newsletters_created_by_user_idTousers?.id) {
                    notificationsToCreate.push({
                        userId: newsletter.users_newsletters_created_by_user_idTousers.id,
                        title: 'Cambios Solicitados',
                        message: `${reviewerName} solicitó cambios en tu newsletter "${newsletter.title}". Por favor revísalos.`,
                        type: NotificationType.REJECTED,
                        actionPath: `/newsletters/edit/${newsletterId}`,
                        newsletterId,
                    })
                }
                break

            case newsletter_state.DISCARDED:
                if (newsletter.users_newsletters_created_by_user_idTousers?.id) {
                    notificationsToCreate.push({
                        userId: newsletter.users_newsletters_created_by_user_idTousers.id,
                        title: 'Newsletter Descartado',
                        message: `${reviewerName} descartó tu newsletter "${newsletter.title}".`,
                        type: NotificationType.REJECTED,
                        actionPath: '/dashboard',
                        newsletterId,
                    })
                }
                break
        }

        // Crea todas las notificaciones en paralelo
        await Promise.all(notificationsToCreate.map(notif => this.createNotification(notif)))
    }

    async notifyReviewersAndAdmins(
        newsletterId: string,
        title: string,
        message: string,
        actionPath: string,
    ): Promise<void> {

        const reviewersAndAdmins = await this.prisma.users.findMany({
            where: {
                role: {
                    in: [user_role.ADMIN, user_role.FUNCTIONAL],
                },
                deleted_at: null,
                state: 'ACTIVE',
            },
            select: { id: true },
        })

        const notificationsToCreate: CreateNotificationDto[] = reviewersAndAdmins.map(user => ({
            userId: user.id,
            title,
            message,
            type: NotificationType.PENDING_REVIEW,
            actionPath,
            newsletterId,
        }))

        await Promise.all(notificationsToCreate.map(notif => this.createNotification(notif)))
    }

    async notifyNewsletterDeleted(newsletterId: string): Promise<void> {
        const newsletter = await this.prisma.newsletters.findUnique({
            where: { id: newsletterId },
            select: {
                title: true,
                created_by_user_id: true,
            },
        })

        if (!newsletter?.created_by_user_id) {
            return
        }

        await this.createNotification({
            userId: newsletter.created_by_user_id,
            title: 'Newsletter Eliminado',
            message: `El newsletter "${newsletter.title}" fue eliminado por el administrador.`,
            type: NotificationType.INFO,
            actionPath: '/dashboard',
            newsletterId,
        })
    }

    private mapToDto(notification: notifications,): NotificationDto {
        return {
            id: notification.id,
            userId: notification.user_id,
            newsletterId: notification.newsletter_id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            actionPath: notification.action_path,
            isRead: notification.is_read,
            createdAt: notification.created_at,
            updatedAt: notification.updated_at,
        }
    }
}
