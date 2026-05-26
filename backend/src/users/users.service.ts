import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.prisma.users.findMany({
      where:{
        deleted_at:null,
      },
      include:{
        areas:true,
      },
      orderBy:{
        created_at:'desc',
      },
    });
  }

  async findOne(id: string) {
    const user =
      await this.prisma.users.findFirst({
        where:{
          id,
          deleted_at:null,
        },
        include:{
          areas:true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const existingUser =
      await this.prisma.users.findFirst({
        where:{
          email:dto.email,
          deleted_at:null,
        },
      });

    if (existingUser) {
      throw new BadRequestException(
        'El email ya existe',
      );
    }

    return this.prisma.users.create({
      data:{
        name:dto.name,
        last_name:dto.last_name,
        email:dto.email,
        role:dto.role,
        state:dto.state,
        area_id:dto.area_id,
      },
      include:{
        areas:true,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ) {
    await this.findOne(id);

    if (dto.email) {
      const existingUser =
        await this.prisma.users.findFirst({
          where:{
            email:dto.email,
            NOT:{ id },
          },
        });

      if (existingUser) {
        throw new BadRequestException(
          'El email ya existe',
        );
      }
    }

    return this.prisma.users.update({
      where:{ id },
      data:dto,
      include:{
        areas:true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    return this.prisma.users.update({
      where:{ id },
      data:{
        deleted_at:new Date(),
        email:`${user.email}__deleted_${id}`,
      },
    });
  }
}