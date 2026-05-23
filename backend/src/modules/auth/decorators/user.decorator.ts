import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// esto es un decorador para extraer el usuario de la request, 
// luego al implementar el jwt real, se eliminara el mockauthguard y se usara el jwt guard, 
// que se encargara de validar el token y extraer el usuario, 
// este decorador simplemente facilita el acceso al usuario en los controladores sin tener que acceder a la request directamente.
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; 
  },
);