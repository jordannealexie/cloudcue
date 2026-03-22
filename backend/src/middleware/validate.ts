import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodTypeAny } from "zod";
import { ApiError } from "../utils/http";

type ValidationTarget = "body" | "params" | "query";

export const validate = <T extends ZodTypeAny>(schema: T, target: ValidationTarget = "body"): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target as keyof Request]);

    if (!result.success) {
      const issue = result.error.issues[0];
      next(new ApiError(400, issue?.message ?? "Invalid request payload"));
      return;
    }

    Object.assign(req[target as keyof Request] as object, result.data);
    next();
  };
};
