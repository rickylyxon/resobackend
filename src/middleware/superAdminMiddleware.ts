import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import {
  emailSchema,
  stringSchema,
  passwordSchema,
  numberSchema,
} from "./validation";
import { PrismaClient,Event } from "@prisma/client";

const prisma = new PrismaClient();
dotenv.config();

interface CostomRequestSignup extends Request {
  email?: string;
  name?: string;
  password?: string;
}
//superadmin signup middleware
export const sAdminSignupMiddleware = async (
  req: CostomRequestSignup,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;

    // Validate input using Zod
    const nameParsed = stringSchema.safeParse(name);
    const emailParsed = emailSchema.safeParse(email);
    const passwordParsed = passwordSchema.safeParse(password);

    if (
      !nameParsed.success ||
      !emailParsed.success ||
      !passwordParsed.success
    ) {
      res.status(400).json({ message: "Please enter correct input" });
      return;
    }

    const sadmin = await prisma.sadmin.findUnique({
      where: { email: emailParsed.data! },
    });

    if (sadmin) {
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
}

//superadmin signin middleware
export const sAdminSigninMiddleware = async (
  req: CostomRequestSignin,
  res: Response,
  next: NextFunction
) => {
  try {
    const { superEmail, superPassword } = req.body;

    // Validate input using Zod
    const emailParsed = emailSchema.safeParse(superEmail);
    const passwordParsed = passwordSchema.safeParse(superPassword);

    if (!emailParsed.success || !passwordParsed.success) {
      res.status(400).json({ message: "Please enter correct input" });
      return;
    }

    const sadmin = await prisma.sadmin.findUnique({
      where: { email: emailParsed.data! },
    });
    if (!sadmin) {
      res.status(409).json({ message: "sadmin doesn't exist" });
      return;
    }
    if (
      !(
        sadmin.password === passwordParsed.data &&
        sadmin.email === emailParsed.data
      )
    ) {
      res.status(403).json({ message: "Forbidden: Incorrect credential" });
      return;
    }
    req.email = sadmin.email;
    req.name = sadmin.name;
    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
interface CustomRequest extends Request {
  email?: string;
  role?: "SUPERADMIN";
  name?: string;
  adminEmail?: string;
  adminPassword?: string;
  event?: string;
  date?: string;
  fee?:number
  description?: string;
}

//superadmin create event with admin
export const createEventWithAdmin = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req;

    //Checking if SUPERADMIN exists
    const superadminExist = await prisma.sadmin.findUnique({
      where: { email: email },
    });

    if (!superadminExist) {
      res.status(404).json({ message: "Superadmin does not exist" });
      return;
    }

    // Extracting data from body
    const {
      name,
      adminEmail,
      adminPassword,
      event,
      date,
      description,
      fee,
    } = req.body;

    // Parsing the input values using Zod
    const nameParsed = stringSchema.safeParse(name);
    if (!nameParsed.success) {
      res.status(400).json({
        message: "Invalid or missing name",
        error: nameParsed.error.format()._errors.join(", "),
      });
      return;
    }
    const feeParse = numberSchema.safeParse(fee);
    if (!feeParse.success) {
      res.status(400).json({
        message: "Invalid fee",
        error: feeParse.error.format()._errors.join(", "),
      });
      return;
    }
    const adminEmailParsed = emailSchema.safeParse(adminEmail);
    if (!adminEmailParsed.success) {
      res.status(400).json({
        message: "Invalid email format",
        error: adminEmailParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const passwordParsed = passwordSchema.safeParse(adminPassword);
    if (!passwordParsed.success) {
      res.status(400).json({
        message: "Password must be at least 6 characters",
        error: passwordParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const eventParsed = stringSchema.safeParse(event.toLowerCase());
    if (!eventParsed.success) {
      res.status(400).json({
        message: "Invalid event name",
        error: eventParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const dateParsed = stringSchema.safeParse(date);
    if (!dateParsed.success) {
      res.status(400).json({
        message: "Invalid date format",
        error: dateParsed.error.format()._errors.join(", "),
      });
      return;
    }

    const descriptionParsed = stringSchema.safeParse(description);
    if (!descriptionParsed.success) {
      res.status(400).json({
        message: "Invalid description",
        error: descriptionParsed.error.format()._errors.join(", "),
      });
      return;
    }

    //Checking if event already exists
    const eventExist = await prisma.event.findUnique({
      where: { event: eventParsed.data! },
    });

    if (eventExist) {
      res.status(409).json({ message: "Event already exists" });
      return;
    }

    // Checking if admin already exists
    const adminExist = await prisma.admin.findUnique({
      where: { email: adminEmailParsed.data! },
    });

    if (adminExist) {
      res.status(409).json({ message: "Admin already exists" });
      return;
    }

    // Attach data to request and proceed
    req.name = nameParsed.data;
    req.adminEmail = adminEmailParsed.data;
    req.adminPassword = passwordParsed.data;
    req.event = eventParsed.data;
    req.date = dateParsed.data;
    req.description = descriptionParsed.data;
    req.fee = feeParse.data

    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

interface CustomRequestEvent extends Request {
  email?: string;
  eventId?: number;
  updatedData?: Partial<Event>;
}

export const superAdminEventMiddleware = async (
  req: CustomRequestEvent,
  res: Response,
  next: NextFunction
) => {
  try {
    const {  email } = req;
    const { event, date, description, fee, eventId} = req.body;

    //parsing eventId to number and checking it's a number or not
    const parsedEventId = parseInt(eventId);
    if (isNaN(parsedEventId)) {
      res.status(400).json({ message: "Invalid event ID" });
      return;
    }
    
    // Find Admin in Database
    const admin = await prisma.sadmin.findUnique({
      where: { email: email },
    });

    if (!admin) {
      res.status(409).json({ message: "Admin doesn't exist" });
      return;
    }

    // Find the event
    const existingEvent = await prisma.event.findUnique({
      where: { id: parsedEventId },
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
    req.eventId = parsedEventId;
    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
