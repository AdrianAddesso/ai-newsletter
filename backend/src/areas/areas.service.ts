import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.areas.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const area = await this.prisma.areas.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!area) {
      throw new NotFoundException(`Area with ID ${id} not found`);
    }

    return area;
  }
}
