import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from "../../../prisma/prisma.service";
import { Role } from "../enum/roles";

@Injectable()
export class PermissionCacheService {

    private cachePermissionService: Map<string, string[]> = new Map();

    constructor(private readonly prisma: PrismaService) {}

    async getPermissionsForRole(role: Role): Promise<string[]> {
        if(!role) throw new BadRequestException('El Rol es requerido para obtener los permisos.');

        if(this.cachePermissionService.has(role)) {
            return this.cachePermissionService.get(role) || [];
        }
        
        const rolePermissions = await this.prisma.role_permissions.findMany({
            where: { role: role},
            include: {
                permissions: true
            }
        })

        const permissions = rolePermissions.map(rolePermission => rolePermission.permissions.code);
        this.cachePermissionService.set(role, permissions);
        return permissions;
    }

    clearCache() {
        this.cachePermissionService.clear();
    }
}