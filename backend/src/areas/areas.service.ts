import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.areas.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  findOne(id: string): Prisma.PrismaPromise<{ id: string; name: string } | null> {
    return this.prisma.areas.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });
  }
}
