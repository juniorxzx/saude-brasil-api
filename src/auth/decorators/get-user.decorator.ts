import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface CurrentUser {
  userId: string;
  email: string;
  role: string;
}

export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): CurrentUser => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return request.user as CurrentUser;
  },
);
