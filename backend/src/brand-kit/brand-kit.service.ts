import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type BrandKitListItem = {
  id: string;
  name: string;
};

@Injectable()
export class BrandKitService {
  private readonly logger = new Logger(BrandKitService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<BrandKitListItem[]> {
    try {
      return this.prisma.brand_kit.findMany({
        where: { deleted_at: null, active: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
        },
      });
    } catch {
      this.logger.error('Brand kit list failed.');
      throw new ServiceUnavailableException(
        'No se pudieron obtener los brand kits en este momento.',
      );
    }
  }

  create(): string {
    return 'Creando brand kit';
  }

  update(id: string): string {
    return `Actualizando brand kit con id: ${id}`;
  }
}
