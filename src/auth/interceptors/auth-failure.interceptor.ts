import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

@Injectable()
export class AuthFailureInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const ipAddress =
      (request as any).ip || (request as any).socket?.remoteAddress;
    const userAgent = (request as any).get?.('user-agent');

    return next.handle().pipe(
      catchError((error) => {
        // Capturar falhas de autenticação/autorização
        if (error instanceof UnauthorizedException) {
          // Token ausente ou inválido
          void this.auditService.logAuthMissingToken(ipAddress, userAgent, {
            path: (request as any).url,
            method: (request as any).method,
          });
        } else if (error instanceof ForbiddenException) {
          // Role insuficiente
          const userId = request.user?.id;
          const userRole = request.user?.role;
          void this.auditService.logAuthInsufficientRole(
            userId || 'unknown',
            [], // requiredRoles não estão acessíveis aqui
            ipAddress,
            userAgent,
          );
        }
        throw error;
      }),
    );
  }
}
