import { Router } from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  adminSigninMiddleware,
  adminEventMiddleware,
} from "../middleware/adminMiddleware";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { adminValidate } from "../middleware/validation";
dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;
const router = Router();

interface CostomRequestSignin extends Request {
  email?: string;
  adminId?: number;
  eventId?: number;
  adminName?: string;
  eventName?: string;
}

//admin sign in route
router.post(
  "/signin",
  adminSigninMiddleware,
  (req: CostomRequestSignin, res: Response) => {
    const { email, adminId, eventId, adminName, eventName } = req;

    try {
      const details = {
        id: adminId,
        email: email,
        eventId: eventId,
        role: "ADMIN",
      };
      const userData = {
        email: email,
        name: adminName,
        event: eventName,
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

interface CustomRequestEvent extends Request {
  eventId?: number;
  updatedData?: Partial<Event>;
}

//admin event update route
router.put(
  "/event",
  adminValidate,
  adminEventMiddleware,
  async (req: CustomRequestEvent, res: Response) => {
    const { updatedData, eventId } = req;
    try {
      const eventDetails = await prisma.event.update({
        where: { id: eventId },
        data: { ...updatedData },
      });

      res
        .status(200)
        .json({ message: "Event updated successfully", eventDetails });
      return;
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
      return;
    }
  }
);

interface CustomRequestGetEvent extends Request {
  adminId?: number;
}
//admin get their event details
router.get(
  "/event",
  adminValidate,
  async (req: CustomRequestGetEvent, res: Response) => {
    const { adminId } = req;
    try {
      const eventDetails = await prisma.admin.findUnique({
        where: { id: adminId },
        include: {
          event: true,
        },
      });

      res
        .status(200)
        .json({ message: "Get details  successfully", eventDetails });
      return;
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
      return;
    }
  }
);

interface CustomRequestGetEventUser extends Request {
  eventId?: number;
}
//get user register details for a specific event
router.get(
  "/register-details",
  adminValidate,
  async (req: CustomRequestGetEventUser, res: Response) => {
    const { eventId } = req;
    try {
      const registerDetails = await prisma.registration.findMany({
        where: { eventId: eventId! },
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
        .json({ message: "Get details  successfully", registerDetails });
      return;
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
      return;
    }
  }
);

interface CustomRequestProfile extends Request {
  email?: string;
}
//get admin profile data
router.get(
  "/profile",
  adminValidate,
  async (req: CustomRequestProfile, res: Response) => {
    try {
      const { email } = req;
      const user = await prisma.admin.findUnique({
        where: { email },
        include: {
          event: true,
        },
      });
      if (!user) {
        res.status(409).json({ message: "User doesn't exist" });
        return;
      }
      const userData = {
        email: email,
        name: user.name,
        event: user.event.event,
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


//update approve of the payment
router.put("/approve/:registrationId", adminValidate, async (req, res) => {
  const registrationId = Number(req.params.registrationId);
  const { approved } = req.body;

  try {
    const updatedRegistration = await prisma.registration.update({
      where: { id: registrationId },
      data: { approved },
    });

    res.json({ message: "Updated successfully", data: updatedRegistration });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;
