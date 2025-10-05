import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";

const SECRET_KEY: Secret = "secret-key";

export interface AuthenticatedRequest extends Request {
  token: string | JwtPayload;
}

export function auth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      throw new Error("No token found");
    }
    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Malformed authorization string");
    }
    const [_, token, ...rest] = authHeader.split("Bearer ");
    if (rest.length > 0 || !token) {
      throw new Error("Malformed authorization string");
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    (req as AuthenticatedRequest).token = decoded;

    next();
  } catch (e) {
    res.status(401).send("Please authenticate");
  }
}
