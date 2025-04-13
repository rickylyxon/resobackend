import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

interface CustomRequest extends Request {
  email?: string;
  role?: "USER";
  userId?: number;
}
// user validate
export const userValidate = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.status(401).json({ message: "Not Log In", status: false });
    return;
  }
  const token = authorization.split(" ")[1];
  try {
    const verified = jwt.verify(token, JWT_SECRET) as {
      email: string;
      role: "USER";
      uid: number;
    };
    if (verified.role !== "USER") {
      res.status(403).json({ message: "Forbidden: You're not an USER" });
      return;
    }
    req.email = verified.email;
    req.role = verified.role;
    req.userId = verified.uid;
    next();
  } catch {
    res.status(403).json({ message: "Forbidden", notlogin: true });
  }
};
interface CustomSuperAdminRequest extends Request {
  email?: string;
  role?: "SUPERADMIN";
}
// superadmin validate
export const validate = (
  req: CustomSuperAdminRequest,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.status(401).json({ message: "Not Log In", status: false });
    return;
  }
  const token = authorization.split(" ")[1];
  try {
    const verified = jwt.verify(token, JWT_SECRET) as {
      email: string;
      role: "SUPERADMIN";
    };
    if (verified.role !== "SUPERADMIN") {
      res.status(403).json({ message: "Forbidden: You're not an SUPERADMIN" });
      return;
    }
    req.email = verified.email;
    req.role = verified.role;
    next();
  } catch {
    res.status(403).json({ message: "Forbidden", notlogin: true });
  }
};

interface CostomAdminRequest extends Request {
  email?: string;
  role?: "ADMIN";
  adminId?: number;
  eventId?: number;
}
//admin Validate
export const adminValidate = (
  req: CostomAdminRequest,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.status(401).json({ message: "Not Log In", status: false });
    return;
  }
  const token = authorization.split(" ")[1];
  try {
    const verified = jwt.verify(token, JWT_SECRET) as {
      email: string;
      role: "ADMIN";
      id: number;
      eventId: number;
    };
    if (verified.role !== "ADMIN") {
      res.status(403).json({ message: "Forbidden: You're not an ADMIN" });
      return;
    }
    req.email = verified.email;
    req.role = verified.role;
    req.adminId = verified.id;
    req.eventId = verified.eventId;
    next();
  } catch {
    res.status(403).json({ message: "Forbidden", notlogin: true });
  }
};

// Input Validation
import z from "zod";
export const emailSchema = z
  .string()
  .email({ message: "Invalid email address format" });

export const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters long" })
  .max(30, { message: "Password must be at most 30 characters long" });

export const stringSchema = z
  .string()
  .min(1, { message: "This field cannot be empty" });

export const contactSchema = z
  .string()
  .length(10, { message: "Contact number must be exactly 10 digits" })
  .regex(/^\d+$/, { message: "Contact number must contain only digits" });

export const genderSchema = z
  .union([z.enum(["male", "female", "other"]), z.null()])
  .optional();

export const booleanSchema = z.boolean();

const playerSchema = z.object({
  name: stringSchema,
  gender: z.enum(["male", "female", "other"]),
  gameId: stringSchema,
  teamLeader: booleanSchema,
});

export const playersSchema = z.array(playerSchema).min(1, {
  message: "At least one player must be provided",
});
export const numberSchema = z.preprocess(
  (val) => Number(val),
  z.number({ invalid_type_error: "Must be a number" })
);
