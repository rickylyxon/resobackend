import { Router } from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  userSignupMiddleware,
  userSigninMiddleware,
  userRegisterMiddleware,
} from "../middleware/usersMiddleware";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { userValidate, stringSchema } from "../middleware/validation";
dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
const router = Router();

interface CostomRequestSignup extends Request {
  email?: string;
  name?: string;
  password?: string;
}

//user sign up route
router.post(
  "/signup",
  userSignupMiddleware,
  async (req: CostomRequestSignup, res: Response) => {
    const name = req.name;
    const email = req.email;
    const password = req.password;

    try {
      const user = await prisma.user.create({
        data: {
          email: email!,
          name: name!,
          password: password!,
        },
      });
      const details = {
        email: user.email,
        role: "USER",
        uid: user.id,
      };
      const userData = {
        email: user.email,
        name: user.name,
      };
      const token = jwt.sign(details, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({
        message: "User registered successfully",
        authorization: "Bearer " + token,
        userData,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error });
    }
  }
);

interface CostomRequestSignin extends Request {
  email?: string;
  name?: string;
  userId?: number;
}

//user sign in route
router.post(
  "/signin",
  userSigninMiddleware,
  (req: CostomRequestSignin, res: Response) => {
    const { email, name, userId } = req;

    try {
      const details = {
        email: email!,
        role: "USER",
        uid: userId,
      };
      const userData = {
        email: email,
        name: name,
      };
      const token = jwt.sign(details, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({
        message: "User signin successfully",
        authorization: "Bearer " + token,
        userData,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error });
    }
  }
);

interface Player {
  name: string;
  gender: "male" | "female" | "other";
  gameId: string;
  teamLeader: boolean;
}

interface CostomRequest extends Request {
  email?: string;
  event?: string;
  eventId?: number;
  userId?: number;
  gender?: "male" | "female" | "other" | null;
  name?: string;
  contact?: string;
  address?: string;
  individual?: boolean;
  teamName?: string;
  players?: Player[];
  bankingName?: string;
  transactionId?: string;
}

//user event registration
router.post(
  "/register",
  userValidate,
  userRegisterMiddleware,
  async (req: CostomRequest, res: Response) => {
    try {
      const {
        userId,
        eventId,
        gender,
        name,
        contact,
        address,
        individual,
        bankingName,
        transactionId,
      } = req;

      // If individual registration
      if (individual) {
        await prisma.registration.create({
          data: {
            gender: individual ? gender! : null,
            name: name!,
            contact: contact!,
            address: address!,
            individual: true,
            bankingName: bankingName!,
            transactionId: transactionId!,
            userId: userId!,
            eventId: eventId!,
          },
        });

        res.status(201).json({
          message: "Individual registration successful",
        });
        return;
      }

      // If team registration
      const { teamName, players } = req;
      if (!teamName || !players || players.length === 0) {
        res.status(400).json({ message: "Team name and players are required" });
        return;
      }

      await prisma.$transaction(async (prisma) => {
        const registration = await prisma.registration.create({
          data: {
            gender: individual ? gender! : null,
            name: name!,
            contact: contact!,
            address: address!,
            individual: false,
            bankingName: bankingName!,
            transactionId: transactionId!,
            userId: userId!,
            eventId: eventId!,
          },
        });

        await prisma.team.create({
          data: {
            teamName: teamName!,
            players: JSON.stringify(players),
            registrationId: registration.id,
          },
        });
      });
      res.status(201).json({
        message: "Team registration successful",
      });
      return;
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal Server Error", error });
      return;
    }
  }
);

interface CustomRequestRegister extends Request {
  userId?: number;
}

//get user event registered details
router.get(
  "/registered",
  userValidate,
  async (req: CustomRequestRegister, res: Response) => {
    const { userId } = req;
    try {
      const registeredDetails = await prisma.registration.findMany({
        where: { userId: userId },
        select: {
          id: true,
          createdAt: true,
          name: true,
          gender: true,
          contact: true,
          address: true,
          individual: true,
          transactionId: true,
          bankingName: true,
          approved: true,
          event: {
            select: {
              event: true,
              date: true,
              description: true,
              fee: true,
            },
          },
          user: {
            select: {
              email: true,
            },
          },
          team: {
            select: {
              teamName: true,
              players: true,
            },
          },
        },
      });

      res
        .status(200)
        .json({ message: "Get details  successfully", registeredDetails });
      return;
    } catch (error) {
      res.status(500).json({ message: "Can't get the details", error });
      return;
    }
  }
);

interface CustomRequestCheck extends Request {
  userId?: number;
}

// check user is regitered to a specific event or not
router.get(
  "/check",
  userValidate,
  async (req: CustomRequestCheck, res: Response) => {
    const { userId } = req;
    const event = req.query.event as string;

    try {
      const eventParsed = stringSchema.safeParse(event?.toLowerCase());
      if (!eventParsed.success) {
        res.status(400).json({
          message: "Invalid event",
          error: eventParsed.error.format()._errors.join(", "),
        });
        return;
      }

      const eventExist = await prisma.event.findUnique({
        where: { event: eventParsed.data },
      });

      if (!eventExist) {
        res.status(409).json({ message: "Event doesn't exist" });
        return;
      }

      const registeredDetails = await prisma.registration.findMany({
        where: { userId: userId },
      });

      const alreadyRegistered = registeredDetails.some(
        (item) => item.eventId === eventExist.id
      );

      if (alreadyRegistered) {
        res.status(409).json({
          message: "Already Registered in this Event",
          eventRegistered: true,
        });
        return;
      }

      res.status(200).json({
        message: "Not Registered Yet",
        fee: eventExist.fee,
        eventRegistered: false,
      });
      return;
    } catch (error) {
      console.error("CHECK ERROR:", error);
      res.status(500).json({ message: "Internal Server Error", error });
      return;
    }
  }
);

interface CustomRequestProfile extends Request {
  email?: string;
}

//get user profile data
router.get(
  "/profile",
  userValidate,
  async (req: CustomRequestProfile, res: Response) => {
    try {
      const { email } = req;
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        res.status(409).json({ message: "User doesn't exist" });
        return;
      }
      const userData = {
        email: email,
        name: user.name!,
      };
      res.status(201).json({
        message: "Get Details Successfull",
        userData,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error", error: error });
    }
  }
);

router.get("/status", async (req, res) => {
  try {
    const setting = await prisma.globalSetting.findUnique({
      where: { id: 1 },
    });

    if (!setting) {
      res.status(404).json({ message: "Global setting not found" });
      return;
    }

    res.json({ registrationOpen: setting.registrationOpen });
    return;
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch registration status" });
    return;
  }
});
router.get("/game-status", async (req, res) => {
  try {
    const setting = await prisma.globalSetting.findUnique({
      where: { id: 1 },
    });

    if (!setting) {
      res.status(404).json({ message: "Global setting not found" });
      return;
    }

    res.json({ registrationOpen: setting.gameRegistrationOpen });
    return;
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch registration status" });
    return;
  }
});
export default router;
