import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { hashPassword, generateToken, comparePasswords } from "./auth.js";
import { requireAuth, requireRole } from "./authMiddleware.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
const prisma = new PrismaClient();

/* -----------------------------
   HEALTH CHECK
----------------------------- */
app.get("/", (req, res) => {
  res.send("🧠 Therapist API is running!");
});

/* -----------------------------
   SIGNUP
----------------------------- */
app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const ALLOWED_PUBLIC_ROLES = ["CLIENT", "THERAPIST", "INTERN"];
    const selectedRole = role || "CLIENT";

    if (!ALLOWED_PUBLIC_ROLES.includes(selectedRole)) {
      return res.status(403).json({
        error: `You cannot sign up as: ${selectedRole}`,
      });
    }

    const strongPassword =
      /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,}$/;

    if (!strongPassword.test(password)) {
      return res.status(400).json({
        error: "Password must be 6+ chars, include a number + symbol",
      });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: selectedRole },
    });

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

    const token = generateToken(user);

    res.json({ user, token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

/* -----------------------------
   LOGIN
----------------------------- */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await comparePasswords(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* -----------------------------
   ME (AUTH CHECK)
----------------------------- */
app.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ user });
  } catch (err) {
    console.error("ME error:", err);
    res.status(500).json({ error: "Failed to load user" });
  }
});

/* -----------------------------
   LINK CLIENT TO THERAPIST
----------------------------- */
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
        return res.status(404).json({ error: "Client not found" });
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

      res.json({ message: "Client linked", link });
    } catch (err) {
      console.error("link-client error:", err);
      res.status(500).json({ error: "Linking failed" });
    }
  }
);

/* -----------------------------
   THERAPIST CLIENT LIST
----------------------------- */
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
          client: { select: { id: true, name: true, email: true } },
        },
      });

      res.json({
        therapistId,
        clients: links.map((l) => l.client),
      });
    } catch (err) {
      console.error("therapist/clients error:", err);
      res.status(500).json({ error: "Failed to load client list" });
    }
  }
);

// ----------------------
// CLIENT DASHBOARD
// ----------------------
app.get(
  "/client/dashboard",
  requireAuth,
  requireRole("CLIENT"),
  async (req, res) => {
    try {
      const clientId = req.user.id;

      const [link, appointments, profile] = await Promise.all([
        prisma.therapistClient.findFirst({
          where: { clientId },
          include: {
            therapist: {
              select: { id: true, name: true, email: true },
            },
          },
        }),

        prisma.appointment.findMany({
          where: { clientId },
          include: {
            therapist: { select: { id: true, name: true } },
          },
          orderBy: { time: "asc" },
        }),

        prisma.clientProfile.findUnique({
          where: { userId: clientId },
          select: {
            notes: true,
            preferences: true,
            emergencyContact: true,
          }
        })
      ]);

      res.json({
        clientId,
        therapist: link ? link.therapist : null,
        profile,
        appointments
      });
    } catch (err) {
      console.error("client/dashboard error:", err);
      res.status(500).json({ error: "Failed to load client dashboard" });
    }
  }
);


/* -----------------------------
   THERAPIST DASHBOARD
----------------------------- */
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
            client: { select: { id: true, name: true, email: true } },
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

/* -----------------------------
   OWNER DASHBOARD
----------------------------- */
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
        adminCount,
        clinicalCount,
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
          select: { id: true, name: true, email: true, role: true, createdAt: true },
        }),
      ]);

      res.json({
        stats: {
          users: {
            total: totalUsers,
            owners,
            adminCount,
            clinicalCount,
            therapists,
            interns,
            clients,
          },
          messages: { total: totalMessages },
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

/* -----------------------------
   START SERVER
----------------------------- */
const PORT = process.env.PORT || 4000;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
});

