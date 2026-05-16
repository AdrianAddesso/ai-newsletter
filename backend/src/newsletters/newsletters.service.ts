import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateNewsletterStatusBody } from './newsletters.schemas';

@Injectable()
export class NewsLettersService {
  constructor(private prisma: PrismaService) {}

  async getAll(page: number = 1, limit: number = 10) {
    // Calculamos cuántos registros saltar
    const skip = (page - 1) * limit;

    // Ejecutamos dos tareas en paralelo para ser más rápidos
    const [data, total] = await Promise.all([
      this.prisma.newsletters.findMany({
        skip: skip,
        take: limit,
        orderBy: { created_at: 'desc' }, // Los más nuevos primero
        include: {
          // Esto trae los datos del creador (su nombre) en lugar de solo el ID
          users_newsletters_created_by_user_idTousers: {
            select: { name: true, last_name: true },
          },
        },
      }),
      this.prisma.newsletters.count(), // Necesitamos el total para que el front sepa cuántas páginas hay
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  create() {
    return 'Desde newsletters';
  }

  getById(id: string) {
    return 'Desde newsletters con ID' + id;
  }

  update(id: string) {
    return 'Desde update newsletters con ID' + id;
  }

  delete(id: string) {
    return 'Desde delete newsletters con ID' + id;
  }

  async updateStatus(id: string, body: UpdateNewsletterStatusBody) {
    const newsletter = await this.prisma.newsletters.findUnique({ where: { id } });
    if (!newsletter) throw new NotFoundException(`Newsletter ${id} no encontrado`);

    const [updated] = await Promise.all([
      this.prisma.newsletters.update({
        where: { id },
        data: { state: body.state },
      }),
      this.prisma.newsletter_state_log.create({
        data: {
          newsletter_id: id,
          previous_state: body.previousState ?? newsletter.state,
          new_state: body.state,
          reviewed_by_user_id: body.reviewedByUserId ?? null,
          all_commentaries: body.allCommentaries ?? null,
        },
      }),
    ]);

    return updated;
  }

  getLogs(id: string) {
    return 'Desde logs newsletters con ID' + id;
  }

  addLog(id: string) {
    return 'Desde add log newsletters con ID' + id;
  }

  getComments(id: string) {
    return 'Desde comments newsletters con ID' + id;
  }

  addComment(id: string) {
    return 'Desde add comment newsletters con ID' + id;
  }

  updateComment(id: string, commentId: string) {
    return `Desde update comment newsletters con ID ${id} y commentId ${commentId}`;
  }

  updateExports(id: string, exportId: string) {
    return `Desde update exports newsletters con ID ${id} y exportId ${exportId}`;
  }

  getExports(id: string) {
    return `Desde exports newsletters con ID ${id}`;
  }
}
