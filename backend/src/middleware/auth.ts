import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Get JWT secret from environment and ensure it is set
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set. Please set it in your cloud provider dashboard.");
}

/**
 * Helper to send a 401 Unauthorized JSON response.
 * @param res Express response object
 * @returns Response with 401 status and error message
 */
function sendUnauthorized(res: Response) {
  return res.status(401).json({ error: "Unauthorized" });
}

/**
 * JWT authentication middleware.
 *
 * - Requires Authorization header with Bearer token
 * - Verifies JWT using server secret
 * - Attaches decoded user info to request as req.user
 * - Responds with 401 if no or invalid token
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next middleware function
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return sendUnauthorized(res);

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return sendUnauthorized(res);

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET as string);
    (req as any).user = payload;
    next();
  } catch {
    sendUnauthorized(res);
  }
}

/**
 * Role-based authorization middleware.
 *
 * Usage: authorizeRoles('admin', 'manager')
 * Only allows access if req.user.role matches one of the allowed roles.
 * Responds with 403 if user is not authorized.
 *
 * @param allowedRoles List of allowed user roles
 * @returns Middleware function
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