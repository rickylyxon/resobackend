import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import {
  emailSchema,
  stringSchema,
  passwordSchema,
  booleanSchema,
  genderSchema,
  playersSchema,
  contactSchema,
} from "./validation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
dotenv.config();

interface CostomRequestSignup extends Request {
  email?: string;
  name?: string;
  password?: string;
}

//user signup Middleware
export const userSignupMiddleware = async (
  req: CostomRequestSignup,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    // Validate input using Zod
    const nameParsed = stringSchema.safeParse(name);
    if (!nameParsed.success) {
      res.status(400).json({
        message: "Invalid name",
        error: nameParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const emailParsed = emailSchema.safeParse(email);
    if (!emailParsed.success) {
      res.status(400).json({
        message: "Invalid email",
        error: emailParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const passwordParsed = passwordSchema.safeParse(password);
    if (!passwordParsed.success) {
      res.status(400).json({
        message: "Invalid password",
        error: passwordParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: emailParsed.data! },
    });

    if (user) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    req.name = nameParsed.data;
    req.email = emailParsed.data;
    req.password = passwordParsed.data;

    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

interface CostomRequestSignin extends Request {
  email?: string;
  name?: string;
  userId?: number;
}

//user signin Middleware
export const userSigninMiddleware = async (
  req: CostomRequestSignin,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Validate input using Zod
    const emailParsed = emailSchema.safeParse(email);
    if (!emailParsed.success) {
      res.status(400).json({
        message: "Invalid email",
        error: emailParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const passwordParsed = passwordSchema.safeParse(password);
    if (!passwordParsed.success) {
      res.status(400).json({
        message: "Invalid password",
        error: passwordParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: emailParsed.data! },
    });
    if (!user) {
      res.status(409).json({ message: "User doesn't exist" });
      return;
    }
    if (
      !(
        user.password === passwordParsed.data && user.email === emailParsed.data
      )
    ) {
      res.status(403).json({ message: "Forbidden: Incorrect credential" });
      return;
    }
    req.email = user.email;
    req.name = user.name;
    req.userId = user.id;
    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

interface Player {
  name: string;
  gender: "male" | "female" | "other";
  gameId: string;
  teamLeader: boolean;
}

interface CustomRequest extends Request {
  userId?: number;
  event?: string;
  gender?: "male" | "female" | "other" | null;
  name?: string;
  contact?: string;
  address?: string;
  individual?: boolean;
  teamName?: string;
  players?: Player[];
  bankingName?: string;
  transactionId?: string;
  eventId?: number;
}

//user event register Middleware
export const userRegisterMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req;

    const {
      event,
      name,
      gender,
      contact,
      address,
      individual,
      transactionId,
      bankingName,
    } = req.body;
    // Input validation using Zod
    const individualParsed = booleanSchema.safeParse(individual);
    if (!individualParsed.success) {
      res.status(400).json({
        message: "Invalid individual input",
        error: individualParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const eventParsed = stringSchema.safeParse(event.toLowerCase());
    if (!eventParsed.success) {
      res.status(400).json({
        message: "Invalid event",
        error: eventParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const nameParsed = stringSchema.safeParse(name);
    if (!nameParsed.success) {
      res.status(400).json({
        message: "Invalid name",
        error: nameParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const contactParsed = contactSchema.safeParse(contact);
    if (!contactParsed.success) {
      res.status(400).json({
        message: "Invalid contact",
        error: contactParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const addressParsed = stringSchema.safeParse(address);
    if (!addressParsed.success) {
      res.status(400).json({
        message: "Invalid address",
        error: addressParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const genderParsed = genderSchema.safeParse(gender);
    if (!genderParsed.success) {
      res.status(400).json({
        message: "Invalid gender",
        error: genderParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const transactionIdParsed = stringSchema.safeParse(transactionId);
    if (!transactionIdParsed.success) {
      res.status(400).json({
        message: "Invalid transaction ID",
        error: transactionIdParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const bankingNameParsed = stringSchema.safeParse(bankingName);
    if (!bankingNameParsed.success) {
      res.status(400).json({
        message: "Invalid banking name",
        error: bankingNameParsed.error.format()._errors.join(", "),
      });
      return;
    }

    // Check if the event exists
    const eventExist = await prisma.event.findUnique({
      where: { event: eventParsed.data! },
    });
    if (!eventExist) {
      res.status(409).json({ message: "Event doesn't exist" });
      return;
    }
    const registeredDetails = await prisma.registration.findMany({
      where: { userId: userId },
    });
    const filtered = registeredDetails.filter(
      (item) => item.eventId === eventExist.id
    );
    if (filtered.length > 0) {
      res.status(409).json({ message: "Already registered in this event " });
      return;
    }
    // Attach validated data to request
    req.event = eventParsed.data;
    req.individual = individualParsed.data;
    req.name = nameParsed.data;
    req.gender = genderParsed.data;
    req.contact = contactParsed.data;
    req.address = addressParsed.data;
    req.transactionId = transactionIdParsed.data;
    req.bankingName = bankingNameParsed.data;
    req.eventId = eventExist.id;

    // If it's a team registration, validate team-specific fields
    if (!individualParsed.data!) {
      let { teamName, players } = req.body;

      if (typeof players === "string") {
        try {
          players = JSON.parse(players); // Convert JSON string to object
        } catch (error) {
          res.status(400).json({ message: "Invalid players format" });
          return;
        }
      }

      // Validate team name & players
      const teamNameParsed = stringSchema.safeParse(teamName);
      const playersParsed = playersSchema.safeParse(players);

      if (!teamNameParsed.success || !playersParsed.success) {
        res.status(400).json({ message: "Invalid team registration details" });
        return;
      }

      req.teamName = teamNameParsed.data;
      req.players = playersParsed.data;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
