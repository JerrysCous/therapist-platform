import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword, generateToken, comparePasswords } from "./auth.js";
import { requireAuth, requireRole } from "./authMiddleware.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const prisma = new PrismaClient();


// ----------------------
// HEALTH CHECK
// ----------------------
app.get("/", (req, res) => {
  res.send("🧠 Therapist API is running!");
});


// ----------------------
// SIGNUP (PUBLIC ROLES ONLY)
// ----------------------
app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const ALLOWED_PUBLIC_ROLES = ["CLIENT", "THERAPIST", "INTERN"];
    const selectedRole = role || "CLIENT";

    if (!ALLOWED_PUBLIC_ROLES.includes(selectedRole)) {
      return res.status(403).json({
        error: `You cannot sign up as role: ${selectedRole}`,
      });
    }

    // Password rule
    const strongPassword =
      /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,}$/;

    if (!strongPassword.test(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 6 characters, include a number, and a special character.",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: selectedRole },
    });

    // Create profiles
    if (selectedRole === "CLIENT") {
      await prisma.clientProfile.create({
        data: {
          userId: user.id,
          notes: "",
          preferences: "",
          emergencyContact: "",
        },
      });
    }

    if (selectedRole === "THERAPIST" || selectedRole === "INTERN") {
      await prisma.therapistProfile.create({
        data: {
          userId: user.id,
          bio: "",
          specialization: "",
          availability: "",
        },
      });
    }

    // JWT
    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// ----------------------
// LOGIN
// ----------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await comparePasswords(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// ----------------------
// ME
// ----------------------
app.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("ME error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// ----------------------
// LINK CLIENT TO THERAPIST
// ----------------------
app.post(
  "/therapist/link-client",
  requireAuth,
  requireRole("THERAPIST", "INTERN", "PRACTICE_MANAGER_ADMIN", "OWNER"),
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Client email required" });

      const therapistId = req.user.id;
      const client = await prisma.user.findUnique({ where: { email } });

      if (!client || client.role !== "CLIENT") {
        return res.status(404).json({ error: "Client not found or invalid role." });
      }

      const link = await prisma.therapistLink.upsert({
        where: {
          therapistId_clientId: {
            therapistId,
            clientId: client.id,
          },
        },
        update: {},
        create: {
          therapistId,
          clientId: client.id,
        },
      });

      res.json({
        message: "Client linked successfully",
        link,
      });
    } catch (err) {
      console.error("link-client error:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);


// ----------------------
// THERAPIST CLIENT LIST
// ----------------------
app.get(
  "/therapist/clients",
  requireAuth,
  requireRole("THERAPIST", "INTERN"),
  async (req, res) => {
    try {
      const therapistId = req.user.id;

      const links = await prisma.therapistLink.findMany({
        where: { therapistId },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.json({
        therapistId,
        clients: links.map((l) => l.client),
      });
    } catch (err) {
      console.error("therapist/clients error:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);


// ----------------------
// CLIENT DASHBOARD (FIXED)
// ----------------------
app.get(
  "/client/dashboard",
  requireAuth,
  requireRole("CLIENT"),
  async (req, res) => {
    try {
      const clientId = req.user.id;

      const link = await prisma.therapistLink.findFirst({
        where: { clientId },
        include: {
          therapist: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      const appointments = await prisma.appointment.findMany({
        where: { clientId },
        orderBy: { time: "asc" },
      });

      res.json({
        clientId,
        therapist: link ? link.therapist : null,
        appointments,
      });
    } catch (err) {
      console.error("client/dashboard error:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);


// ----------------------
// SEND MESSAGE
// ----------------------
app.post("/messages/send", requireAuth, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, text } = req.body;

    if (!receiverId || !text)
      return res.status(400).json({ error: "receiverId and text required" });

    const validLink = await prisma.therapistLink.findFirst({
      where: {
        OR: [
          { therapistId: senderId, clientId: receiverId },
          { therapistId: receiverId, clientId: senderId },
        ],
      },
    });

    if (!validLink)
      return res.status(403).json({ error: "Unauthorized messaging" });

    const msg = await prisma.message.create({
      data: { senderId, receiverId, text },
    });

    res.json({ success: true, message: msg });
  } catch (err) {
    console.error("send-message error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// ----------------------
// MESSAGE THREAD
// ----------------------
app.get("/messages/thread/:otherUserId", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = parseInt(req.params.otherUserId);

    const validLink = await prisma.therapistLink.findFirst({
      where: {
        OR: [
          { therapistId: userId, clientId: otherUserId },
          { therapistId: otherUserId, clientId: userId },
        ],
      },
    });

    if (!validLink)
      return res.status(403).json({ error: "Unauthorized to view messages" });

    const msgs = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ thread: msgs });
  } catch (err) {
    console.error("thread error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// ----------------------
// MESSAGE LIST
// ----------------------
app.get("/messages/list", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    // Therapist/Intern can message all linked clients
    if (role === "THERAPIST" || role === "INTERN") {
      const links = await prisma.therapistLink.findMany({
        where: { therapistId: userId },
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return res.json({
        allowed: links.map((l) => l.client),
      });
    }

    // Clients can only message their therapist
    if (role === "CLIENT") {
      const link = await prisma.therapistLink.findFirst({
        where: { clientId: userId },
        include: {
          therapist: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return res.json({
        allowed: link ? [link.therapist] : [],
      });
    }

    res.status(403).json({ error: "Role cannot use messaging." });
  } catch (err) {
    console.error("list error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});


// ----------------------
// THERAPIST DASHBOARD (FIXED)
// ----------------------
app.get(
  "/therapist/dashboard",
  requireAuth,
  requireRole("THERAPIST", "INTERN"),
  async (req, res) => {
    try {
      const therapistId = req.user.id;

      const [clients, appointments, profile] = await Promise.all([
        prisma.therapistLink.findMany({
          where: { therapistId },
          include: {
            client: {
              select: { id: true, name: true, email: true },
            },
          },
        }),

        prisma.appointment.findMany({
          where: { therapistId },
          include: {
            client: { select: { id: true, name: true } },
          },
          orderBy: { time: "asc" },
          take: 20,
        }),

        prisma.therapistProfile.findUnique({
          where: { userId: therapistId },
          select: { bio: true, specialization: true, availability: true },
        }),
      ]);

      res.json({
        profile,
        clients: clients.map((c) => c.client),
        appointments,
      });
    } catch (err) {
      console.error("therapist/dashboard error:", err);
      res.status(500).json({ error: "Failed to load therapist dashboard" });
    }
  }
);


// ----------------------
// OWNER DASHBOARD
// ----------------------
app.get(
  "/owner/dashboard",
  requireAuth,
  requireRole("OWNER"),
  async (req, res) => {
    try {
      const now = new Date();

      const [
        totalUsers,
        owners,
        practiceManagersAdmin,
        practiceManagersClinical,
        therapists,
        interns,
        clients,
        totalAppointments,
        upcomingAppointments,
        totalMessages,
        recentUsers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "OWNER" } }),
        prisma.user.count({ where: { role: "PRACTICE_MANAGER_ADMIN" } }),
        prisma.user.count({ where: { role: "PRACTICE_MANAGER_CLINICAL" } }),
        prisma.user.count({ where: { role: "THERAPIST" } }),
        prisma.user.count({ where: { role: "INTERN" } }),
        prisma.user.count({ where: { role: "CLIENT" } }),
        prisma.appointment.count(),
        prisma.appointment.findMany({
          where: { time: { gte: now } },
          include: {
            therapist: { select: { id: true, name: true, email: true } },
            client: { select: { id: true, name: true, email: true } },
          },
          orderBy: { time: "asc" },
          take: 10,
        }),
        prisma.message.count(),
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        }),
      ]);

      res.json({
        stats: {
          users: {
            total: totalUsers,
            owners,
            practiceManagersAdmin,
            practiceManagersClinical,
            therapists,
            interns,
            clients,
          },
          messages: {
            total: totalMessages,
          },
          appointments: {
            total: totalAppointments,
            upcomingCount: upcomingAppointments.length,
          },
        },
        upcomingAppointments,
        recentUsers,
      });
    } catch (err) {
      console.error("owner/dashboard error:", err);
      res.status(500).json({ error: "Failed to load owner dashboard" });
    }
  }
);


// ----------------------
// PRACTICE MANAGER ADMIN DASHBOARD
// ----------------------
app.get(
  "/practice-manager-admin/dashboard",
  requireAuth,
  requireRole("PRACTICE_MANAGER_ADMIN"),
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      });

      res.json({ users });
    } catch (err) {
      console.error("admin dashboard error:", err);
      res.status(500).json({ error: "Failed to load practice admin dashboard" });
    }
  }
);

// ----------------------
// PRACTICE MANAGER ADMIN - UPDATE USER ROLE
// ----------------------
app.post(
  "/practice-manager-admin/users/:id/role",
  requireAuth,
  requireRole("PRACTICE_MANAGER_ADMIN", "OWNER"),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const { role } = req.body;

      if (Number.isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user id" });
      }

      // Check that target user exists
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Optional safety: don't allow changing OWNERs
      if (targetUser.role === "OWNER") {
        return res.status(403).json({ error: "Cannot change OWNER role" });
      }

      // Validate role against Prisma enum
      if (!Object.values(Role).includes(role)) {
        return res.status(400).json({ error: "Invalid role value" });
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      res.json({ user: updated });
    } catch (err) {
      console.error("update role error:", err);
      res.status(500).json({ error: "Failed to update user role" });
    }
  }
);


// ----------------------
// PRACTICE MANAGER ADMIN - DELETE USER
// ----------------------
app.delete(
  "/practice-manager-admin/users/:id/delete",
  requireAuth,
  requireRole("PRACTICE_MANAGER_ADMIN", "OWNER"),
  async (req, res) => {
    try {
      const targetId = parseInt(req.params.id, 10);
      const requesterId = req.user.id;

      if (Number.isNaN(targetId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Can't delete yourself
      if (targetId === requesterId) {
        return res.status(403).json({ error: "You cannot delete your own account." });
      }

      const target = await prisma.user.findUnique({ where: { id: targetId } });
      if (!target) {
        return res.status(404).json({ error: "User not found" });
      }

      // Cannot delete OWNER
      if (target.role === "OWNER") {
        return res.status(403).json({ error: "Cannot delete OWNER accounts." });
      }

      // Clean related data
      await prisma.message.deleteMany({
        where: {
          OR: [{ senderId: targetId }, { receiverId: targetId }],
        },
      });

      await prisma.therapistLink.deleteMany({
        where: {
          OR: [{ therapistId: targetId }, { clientId: targetId }],
        },
      });

      await prisma.appointment.deleteMany({
        where: {
          OR: [{ therapistId: targetId }, { clientId: targetId }],
        },
      });

      await prisma.therapistProfile.deleteMany({ where: { userId: targetId } });
      await prisma.clientProfile.deleteMany({ where: { userId: targetId } });

      // Finally delete user
      await prisma.user.delete({ where: { id: targetId } });

      res.json({ success: true, message: "User deleted successfully", userId: targetId });
    } catch (err) {
      console.error("Delete user error:", err);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);


// ----------------------
// PRACTICE MANAGER CLINICAL DASHBOARD
// ----------------------
app.get(
  "/practice-manager-clinical/dashboard",
  requireAuth,
  requireRole("PRACTICE_MANAGER_CLINICAL"),
  async (req, res) => {
    try {
      const therapists = await prisma.user.findMany({
        where: { role: "THERAPIST" },
        select: { id: true, name: true, email: true }
      });

      res.json({ therapists });
    } catch (err) {
      console.error("clinical dashboard error:", err);
      res.status(500).json({ error: "Failed to load clinical dashboard" });
    }
  }
);


// ----------------------
// INTERN DASHBOARD
// ----------------------
app.get(
  "/intern/dashboard",
  requireAuth,
  requireRole("INTERN"),
  async (req, res) => {
    try {
      const internId = req.user.id;

      const [clients, appointments, profile] = await Promise.all([
        prisma.therapistLink.findMany({
          where: { therapistId: internId },
          include: {
            client: {
              select: { id: true, name: true, email: true },
            },
          },
        }),

        prisma.appointment.findMany({
          where: { therapistId: internId },
          include: {
            client: { select: { id: true, name: true } },
          },
          orderBy: { time: "asc" },
          take: 20,
        }),

        prisma.therapistProfile.findUnique({
          where: { userId: internId },
          select: { bio: true, specialization: true, availability: true },
        }),
      ]);

      res.json({
        profile,
        clients: clients.map((c) => c.client),
        appointments,
      });
    } catch (err) {
      console.error("intern/dashboard error:", err);
      res.status(500).json({ error: "Failed to load intern dashboard" });
    }
  }
);

// ----------------------
// SET AVAILABILITY SLOTS
// ----------------------
app.post(
  "/availability/set",
  requireAuth,
  requireRole("THERAPIST", "INTERN"),
  async (req, res) => {
    try {
      const therapistId = req.user.id;
      const { slots } = req.body;

      if (!Array.isArray(slots)) {
        return res.status(400).json({ error: "Slots must be an array" });
      }

      // Clear old slots
      await prisma.availabilitySlot.deleteMany({
        where: { therapistId },
      });

      // Insert new slots
      const created = await prisma.availabilitySlot.createMany({
        data: slots.map((s) => ({
          therapistId,
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });

      res.json({
        success: true,
        message: "Availability updated",
        count: created.count,
      });
    } catch (err) {
      console.error("Set availability error:", err);
      res.status(500).json({ error: "Failed to update availability" });
    }
  }
);


// ----------------------
// GET MY AVAILABILITY (THERAPIST)
// ----------------------
app.get(
  "/availability/my",
  requireAuth,
  requireRole("THERAPIST", "INTERN"),
  async (req, res) => {
    try {
      const therapistId = req.user.id;

      const slots = await prisma.availabilitySlot.findMany({
        where: { therapistId },
        orderBy: [{ weekday: "asc" }, { startTime: "asc" }]
      });

      res.json({ slots });
    } catch (err) {
      console.error("availability/my error:", err);
      res.status(500).json({ error: "Failed to load availability" });
    }
  }
);


// ----------------------
// GET AVAILABILITY FOR ANY THERAPIST
// ----------------------
app.get(
  "/availability/therapist/:therapistId",
  requireAuth,
  async (req, res) => {
    try {
      const therapistId = parseInt(req.params.therapistId, 10);

      const slots = await prisma.availabilitySlot.findMany({
        where: { therapistId },
        orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
      });

      res.json({ slots });
    } catch (err) {
      console.error("availability/therapist error:", err);
      res.status(500).json({ error: "Failed to load availability" });
    }
  }
);




// ----------------------
// DELETE AVAILABILITY SLOT
// ----------------------
app.delete(
  "/availability/:slotId",
  requireAuth,
  requireRole("THERAPIST", "INTERN"),
  async (req, res) => {
    try {
      const slotId = parseInt(req.params.slotId, 10);
      const therapistId = req.user.id;

      if (isNaN(slotId)) {
        return res.status(400).json({ error: "Invalid slot ID" });
      }

      const slot = await prisma.availabilitySlot.findUnique({
        where: { id: slotId }
      });

      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      if (slot.therapistId !== therapistId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await prisma.availabilitySlot.delete({
        where: { id: slotId }
      });

      res.json({ success: true, message: "Slot deleted" });
    } catch (err) {
      console.error("delete availability error:", err);
      res.status(500).json({ error: "Failed to delete slot" });
    }
  }
);


// -----------------------------------------------------
// CLIENT → REQUEST APPOINTMENT
// -----------------------------------------------------
app.post(
  "/appointments/request",
  requireAuth,
  requireRole("CLIENT"),
  async (req, res) => {
    try {
      const clientId = req.user.id;
      const { therapistId, time, reason } = req.body;

      if (!therapistId || !time) {
        return res.status(400).json({ error: "Therapist and time required" });
      }

      // Check therapist exists
      const therapist = await prisma.user.findUnique({
        where: { id: therapistId },
      });

      if (!therapist || !["THERAPIST", "INTERN"].includes(therapist.role)) {
        return res.status(404).json({ error: "Invalid therapist" });
      }

      // Check availability slot match
      const date = new Date(time);
      const weekday = date.getDay(); // 0-6
      const timeStr = date.toTimeString().slice(0, 5); // "13:30"

      const slot = await prisma.availabilitySlot.findFirst({
        where: {
          therapistId,
          weekday,
          startTime: { lte: timeStr },
          endTime: { gte: timeStr },
        },
      });

      if (!slot) {
        return res.status(400).json({
          error: "Therapist is not available at this time",
        });
      }

      // Prevent double booking
      const conflict = await prisma.appointment.findFirst({
        where: {
          therapistId,
          time: new Date(time),
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

      if (conflict) {
        return res
          .status(409)
          .json({ error: "There is already an appointment at this time" });
      }

      // Create the appointment request
      const appt = await prisma.appointment.create({
        data: {
          therapistId,
          clientId,
          time: new Date(time),
          status: "PENDING",
          reason: reason || "",
        },
      });

      res.json({
        success: true,
        message: "Appointment request submitted",
        appointment: appt,
      });
    } catch (err) {
      console.error("appointment request error:", err);
      res.status(500).json({ error: "Failed to request appointment" });
    }
  }
);


// ----------------------
// APPOINTMENT LIST BY ROLE
// ----------------------
app.get("/appointments", requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;

    let appointments = [];

    // OWNER / ADMIN: Full visibility
    if (role === "OWNER" || role === "PRACTICE_MANAGER_ADMIN") {
      appointments = await prisma.appointment.findMany({
        include: {
          therapist: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
        },
        orderBy: { time: "asc" },
      });
    }

    // CLINICAL MANAGER: Can see ALL therapists & interns
    else if (role === "PRACTICE_MANAGER_CLINICAL") {
      appointments = await prisma.appointment.findMany({
        where: {
          therapist: {
            role: { in: ["THERAPIST", "INTERN"] }
          }
        },
        include: {
          therapist: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
        },
        orderBy: { time: "asc" },
      });
    }

    // THERAPIST / INTERN: Only their own appointments
    else if (role === "THERAPIST" || role === "INTERN") {
      appointments = await prisma.appointment.findMany({
        where: { therapistId: userId },
        include: {
          therapist: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
        },
        orderBy: { time: "asc" },
      });
    }

    // CLIENT: Only their own
    else if (role === "CLIENT") {
      appointments = await prisma.appointment.findMany({
        where: { clientId: userId },
        include: {
          therapist: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
        },
        orderBy: { time: "asc" },
      });
    }

    else {
      return res.status(403).json({ error: "Role cannot view appointments" });
    }

    res.json({ appointments });

  } catch (err) {
    console.error("appointment list error:", err);
    res.status(500).json({ error: "Failed to load appointments" });
  }
});


// ----------------------
// THERAPIST: VIEW PENDING REQUESTS
// ----------------------
app.get(
  "/appointments/pending",
  requireAuth,
  requireRole("THERAPIST", "INTERN"),
  async (req, res) => {
    try {
      const therapistId = req.user.id;

      const pending = await prisma.appointment.findMany({
        where: {
          therapistId,
          status: "PENDING"
        },
        include: {
          client: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { time: "asc" }
      });

      res.json({ pending });
    } catch (err) {
      console.error("pending appts error:", err);
      res.status(500).json({ error: "Failed to load pending requests" });
    }
  }
);


// ----------------------
// APPROVE APPOINTMENT
// ----------------------
app.post(
  "/appointments/:id/approve",
  requireAuth,
  requireRole("THERAPIST", "INTERN"),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const therapistId = req.user.id;

      const appt = await prisma.appointment.findUnique({ where: { id } });

      if (!appt) return res.status(404).json({ error: "Appointment not found" });

      if (appt.therapistId !== therapistId)
        return res.status(403).json({ error: "Unauthorized" });

      const updated = await prisma.appointment.update({
        where: { id },
        data: { status: "CONFIRMED" }
      });

      res.json({ success: true, appointment: updated });
    } catch (err) {
      console.error("approve error:", err);
      res.status(500).json({ error: "Failed to approve appointment" });
    }
  }
);


// ----------------------
// DENY APPOINTMENT
// ----------------------
app.post(
  "/appointments/:id/deny",
  requireAuth,
  requireRole("THERAPIST", "INTERN"),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const therapistId = req.user.id;

      const appt = await prisma.appointment.findUnique({ where: { id } });

      if (!appt) return res.status(404).json({ error: "Appointment not found" });

      if (appt.therapistId !== therapistId)
        return res.status(403).json({ error: "Unauthorized" });

      const updated = await prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED" }
      });

      res.json({ success: true, appointment: updated });
    } catch (err) {
      console.error("deny error:", err);
      res.status(500).json({ error: "Failed to deny appointment" });
    }
  }
);


// APPROVE OR DENY APPOINTMENT
app.post(
  "/appointments/:id/update",
  requireAuth,
  requireRole("THERAPIST", "INTERN"),
  async (req, res) => {
    try {
      const apptId = parseInt(req.params.id, 10);
      const { status, newTime } = req.body; // status = CONFIRMED or CANCELLED or RESCHEDULED
      const therapistId = req.user.id;

      const appt = await prisma.appointment.findUnique({
        where: { id: apptId }
      });

      if (!appt || appt.therapistId !== therapistId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updated = await prisma.appointment.update({
        where: { id: apptId },
        data: {
          status,
          time: newTime ? new Date(newTime) : appt.time
        }
      });

      res.json({ success: true, appt: updated });

    } catch (err) {
      console.error("update appointment error:", err);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  }
);


// ----------------------
// PUBLIC — GET THERAPIST AVAILABILITY BY ID
// ----------------------
app.get(
  "/therapist/availability/:id",
  requireAuth,
  async (req, res) => {
    try {
      const therapistId = parseInt(req.params.id, 10);

      if (isNaN(therapistId)) {
        return res.status(400).json({ error: "Invalid therapist ID" });
      }

      const slots = await prisma.availabilitySlot.findMany({
        where: { therapistId },
        orderBy: [
          { weekday: "asc" },
          { startTime: "asc" }
        ]
      });

      res.json({ slots });
    } catch (err) {
      console.error("therapist availability error:", err);
      res.status(500).json({ error: "Failed to load therapist availability" });
    }
  }
);

// UPDATE APPOINTMENT STATUS (THERAPIST/INTERN ONLY)
app.post(
  "/appointments/:id/status",
  requireAuth,
  requireRole("THERAPIST", "INTERN"),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      const therapistId = req.user.id;

      const appt = await prisma.appointment.findUnique({ where: { id } });

      if (!appt) return res.status(404).json({ error: "Appointment not found" });
      if (appt.therapistId !== therapistId)
        return res.status(403).json({ error: "Unauthorized" });

      const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
      if (!validStatuses.includes(status))
        return res.status(400).json({ error: "Invalid status" });

      const updated = await prisma.appointment.update({
        where: { id },
        data: { status }
      });

      res.json({ success: true, appointment: updated });
    } catch (err) {
      console.error("status update error:", err);
      res.status(500).json({ error: "Failed to update status" });
    }
  }
);



// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
});
