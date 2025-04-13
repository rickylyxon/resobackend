import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import { emailSchema, stringSchema, passwordSchema, numberSchema } from "./validation";
import { PrismaClient, Event } from "@prisma/client";

const prisma = new PrismaClient();
dotenv.config();


interface CostomRequestSignin extends Request {
  email?: string;
  password?: string;
  role?: "ADMIN";
  adminId?: number;
  eventId?: number;
  adminName?: string
  eventName?: string
}

//admin signin middleware
export const adminSigninMiddleware = async (
  req: CostomRequestSignin,
  res: Response,
  next: NextFunction
) => {
  try {
    const { adminEmail, adminPassword } = req.body;

    // Validate input using Zod
    const emailParsed = emailSchema.safeParse(adminEmail);
    const passwordParsed = passwordSchema.safeParse(adminPassword);

    if (!emailParsed.success || !passwordParsed.success) {
      res.status(400).json({ message: "Please enter correct input" });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { email: emailParsed.data! },
      include:{
        event:true
      }
    });
    if (!admin) {
      res.status(409).json({ message: "Admin doesn't exist" });
      return;
    }
    if (
      !(
        admin.password === passwordParsed.data &&
        admin.email === emailParsed.data
      )
    ) {
      res.status(403).json({ message: "Forbidden: Incorrect credential" });
      return;
    }
    req.email = admin.email;
    req.adminName = admin.name
    req.adminId = admin.id;
    req.eventId = admin.eventId;
    req.eventName = admin.event.event
    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

interface CustomRequestEvent extends Request {
  email?: string;
  adminId?: number;
  eventId?: number;
  updatedData?: Partial<Event>;
}

//admin event update middleware
export const adminEventMiddleware = async (
  req: CustomRequestEvent,
  res: Response,
  next: NextFunction
) => {
  try {
    const {  email, eventId } = req;
    const { event, date, description, fee} = req.body;

    // Find Admin in Database
    const admin = await prisma.admin.findUnique({
      where: { email: email },
    });

    if (!admin) {
      res.status(409).json({ message: "Admin doesn't exist" });
      return;
    }

    // Ensure the Admin is linked to the Event
    if (!admin.eventId || admin.eventId !== eventId) {
      res.status(403).json({
        message:
          "Forbidden - You're not allowed to change this event's details",
      });
      return;
    }

    // Find the event
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Validate only the fields that are provided
    const updatedData: Partial<Event> = {};

    if (event !== undefined) {
      const eventParse = stringSchema.safeParse(event.toLowerCase());
      if (!eventParse.success) {
        res.status(400).json({
          message: "Invalid event",
          error: eventParse.error.format()._errors.join(", "),
        });
        return;
      }
      const existingEventCheck = await prisma.event.findUnique({
        where: { event: eventParse.data! },
      });
      if(existingEventCheck){
        res.status(409).json({message:"Event name already existed"})
        return
      }
      updatedData.event = eventParse.data;
    }

    if (date !== undefined) {
      const dateParse = stringSchema.safeParse(date);
      if (!dateParse.success) {
        res.status(400).json({
          message: "Invalid date",
          error: dateParse.error.format()._errors.join(", "),
        });
        return;
      }
      updatedData.date = dateParse.data;
    }

    if (description !== undefined) {
      const descriptionParse = stringSchema.safeParse(description);
      if (!descriptionParse.success) {
        res.status(400).json({
          message: "Invalid description",
          error: descriptionParse.error.format()._errors.join(", "),
        });
        return;
      }
      updatedData.description = descriptionParse.data;
    }

    if (fee !== undefined) {
      const feeParse = numberSchema.safeParse(fee);
      if (!feeParse.success) {
        res.status(400).json({
          message: "Invalid fee",
          error: feeParse.error.format()._errors.join(", "),
        });
        return;
      }
      updatedData.fee = String(feeParse.data);
    }
    // Attach validated partial update data to request
    req.updatedData = updatedData;

    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
