import { CanActivate, ExecutionContext, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthorizationService } from "../services/authorization.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { PermissionCacheService } from "../services/permission-cache.service";
import { Request } from "express";
import { Role } from "../enum/roles";
import { PrismaEntityModel } from "../types/auth-user.type";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
        private authorizationService: AuthorizationService,
        private permissionCache: PermissionCacheService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const metadata = this.reflector.get<{ action: string; entity: string }>('permissions_metadata', context.getHandler());
        if (!metadata) return true;

        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();

        const user = request.user as { id: string, role: Role };

        const prismaModel = this.prisma[metadata.entity] as unknown as PrismaEntityModel;

        if (!prismaModel) {
            throw new InternalServerErrorException(
                {
                    message: `No se encontró un modelo de Prisma para la entidad ${metadata.entity}`,
                    error: 'Error de configuración',
                    statusCode: 500
                }
            );
        }

        if (!user || !user.role) {
            throw new ForbiddenException({
                message: 'No se encontró información de usuario en la solicitud o el usuario no tiene un rol asignado',
                error: 'Permisos insuficientes',
                statusCode: 403
            });
        }

        const rolePermissions = await this.permissionCache.getPermissionsForRole(user.role);

        if (!rolePermissions.includes(metadata.action)) {
            throw new ForbiddenException({
                message: `Tu rol (${user.role}) no tiene el permiso: ${metadata.action}`,
                error: 'Permisos insuficientes',
                statusCode: 403
            });
        }

        const resourceId = request.params.id as string;

        let resource: unknown = null;
        
        if (resourceId) {

            resource = await prismaModel.findUnique({ where: { id: resourceId }});

            if (!resource) {
                throw new NotFoundException({
                    message: `No se encontró el recurso ${metadata.entity} con ID ${resourceId}`,
                    error: 'Recurso no encontrado',
                    statusCode: 404
                });
            }
        }

        const isAuthorized = this.authorizationService.isAuthorized(user, metadata.action, resource);

        if (!isAuthorized) {
            throw new ForbiddenException({
                message: 'No tienes permisos para realizar esta acción',
                error: 'No se puede realizar esta acción',
                statusCode: 403
            });
        }

        return true;
    }
}