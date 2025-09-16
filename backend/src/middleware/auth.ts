import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Please set it in your cloud provider dashboard.");
}

/**
 * JWT authentication middleware.
 * Security:
 * - Requires Authorization header with Bearer token
 * - Verifies JWT using server secret
 * - Attaches decoded user info to request
 * - Responds with 401 if no token, 403 if token is invalid
 */

/**
 * JWT authentication middleware.
 * Verifies JWT and attaches user info to request.
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.sendStatus(401);
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET as string);
    (req as any).user = payload;
    next();
  } catch {
    res.sendStatus(401);
  }
}

/**
 * Role-based authorization middleware.
 * Usage: authorizeRoles('admin', 'manager')
 * Only allows access if req.user.role matches one of the allowed roles.
 */
export function authorizeRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
    }
    next();
  };
}