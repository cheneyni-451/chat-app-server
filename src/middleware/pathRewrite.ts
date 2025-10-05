import type { Request, Response, NextFunction } from "express";

export function rewriteServicePath(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.path.startsWith("/service/")) {
    req.url = req.path.slice("/service/".length - 1);
  }
  next();
}
