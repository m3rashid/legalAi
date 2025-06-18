import type { z } from 'zod';
import type { Handler, NextFunction, Request, Response } from 'express';

import { errorStatusCodes } from 'utils/api';

export function getZodErrors<T extends z.ZodRawShape>(zodSchema: z.ZodObject<T>, body: unknown) {
  const res = zodSchema.safeParse(body);
  if (res.success) return { errors: null, data: res.data };

  const errors = res.error.errors.reduce(
    (acc, error) => ({ ...acc, [error.path[0] as any]: error.message }),
    {}
  );

  return { errors, data: null };
}

export function asyncRoute(handlerFunction: Handler) {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(handlerFunction(req, res, next)).catch(next);
  };
}

export function globalErrorHandlerMiddleware(
  err: Error,
  _: Request,
  res: Response,
  __: NextFunction
) {
  console.error('GLOBAL_ERROR :: ', err);
  res.status(errorStatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
}
