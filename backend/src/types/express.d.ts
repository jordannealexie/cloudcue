import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface UserContext extends JwtPayload {
      userId: string;
      email: string;
    }

    interface Request {
      user?: UserContext;
    }
  }
}

export {};
