import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateNotificationDto, NotificationDto } from './notifications.types'
import type { newsletter_state } from '@prisma/client'
import { user_role } from '@prisma/client'
import type { notifications } from '@prisma/client'

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

        // Notificaciones según el estado
        const notificationsToCreate: CreateNotificationDto[] = []

        console.log({
            creator: newsletter.created_by_user_id,
            approver: newsletter.approved_by_user_id,
            state: newState,
        })

        switch (newState) {
            case 'IN_REVIEW':
            case 'RESUBMITTED':
                // Notificar a revisores y admins
                await this.notifyReviewersAndAdmins(
                    newsletterId,
                    `Newsletter "${newsletter.title}" está en revisión`,
                    `El newsletter "${newsletter.title}" de ${creatorName} está esperando tu revisión.`,
                    '/reviews',
                )

                return

            case 'APPROVED':
                // Notificar al creador que fue aprobado
                if (newsletter.users_newsletters_created_by_user_idTousers?.id) {
                    notificationsToCreate.push({
                        userId: newsletter.users_newsletters_created_by_user_idTousers.id,
                        title: 'Newsletter Aprobado',
                        message: `Tu newsletter "${newsletter.title}" ha sido aprobado y está listo para exportar.`,
                        type: 'APPROVED',
                        actionPath: `/exportarNewsletter/${newsletterId}`,
                        newsletterId,
                    })
                }
                break

            case 'CHANGES_REQUESTED':
                // Notificar al creador que debe hacer cambios
                if (newsletter.users_newsletters_created_by_user_idTousers?.id) {
                    notificationsToCreate.push({
                        userId: newsletter.users_newsletters_created_by_user_idTousers.id,
                        title: 'Cambios Solicitados',
                        message: `Se han solicitado cambios en tu newsletter "${newsletter.title}". Por favor revísalos.`,
                        type: 'REJECTED',
                        actionPath: `/editarNewsletter/${newsletterId}`,
                        newsletterId,
                    })
                }
                break

            case 'DISCARDED':
                // Notificar al creador que fue descartado
                if (newsletter.users_newsletters_created_by_user_idTousers?.id) {
                    notificationsToCreate.push({
                        userId: newsletter.users_newsletters_created_by_user_idTousers.id,
                        title: 'Newsletter Descartado',
                        message: `Tu newsletter "${newsletter.title}" ha sido descartado.`,
                        type: 'REJECTED',
                        actionPath: `/dashboard`,
                        newsletterId,
                    })
                }
                break
        }

        // Crear todas las notificaciones en paralelo
        await Promise.all(notificationsToCreate.map(notif => this.createNotification(notif)))
    }

    async notifyNewNewsletter(newsletterId: string): Promise<void> {
        const newsletter = await this.prisma.newsletters.findUnique({
            where: { id: newsletterId },
            include: {
                users_newsletters_created_by_user_idTousers: {
                    select: { name: true, last_name: true },
                },
            },
        })

        if (!newsletter) {
            throw new BadRequestException('Newsletter no encontrado')
        }

        const creatorName = newsletter.users_newsletters_created_by_user_idTousers
            ? `${newsletter.users_newsletters_created_by_user_idTousers.name} ${newsletter.users_newsletters_created_by_user_idTousers.last_name}`
            : 'Un usuario'

        // Notificar a revisores y admins cuando hay un newsletter nuevo
        await this.notifyReviewersAndAdmins(
            newsletterId,
            `Nuevo newsletter: ${newsletter.title}`,
            `${creatorName} ha creado un nuevo newsletter "${newsletter.title}".`,
            '/reviews',
        )
    }

    async notifyReviewersAndAdmins(
        newsletterId: string,
        title: string,
        message: string,
        actionPath: string,
    ): Promise<void> {
        // Obtener todos los usuarios con rol FUNCTIONAL o ADMIN
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
            type: 'PENDING_REVIEW',
            actionPath,
            newsletterId,
        }))

        await Promise.all(notificationsToCreate.map(notif => this.createNotification(notif)))
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
