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

// ----------------------
// HEALTH CHECK
// ----------------------
app.get("/", (req, res) => {
  res.send("🧠 Therapist API is running!");
});

// ----------------------
// SIGNUP
// ----------------------
app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Password validation
    const strongPassword =
      /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,}$/;

    if (!strongPassword.test(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 6 characters, include a number, and a special character.",
      });
    }

    // Email validation
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
    });

    // Auto-create correct profile
    if (role === "THERAPIST") {
      await prisma.therapistProfile.create({
        data: {
          userId: user.id,
          bio: "",
          specialization: "",
          availability: "",
        },
      });
    } else if (role === "USER") {
      await prisma.clientProfile.create({
        data: {
          userId: user.id,
          notes: "",
          preferences: "",
          emergencyContact: "",
        },
      });
    }

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

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const valid = await comparePasswords(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

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
// ME (AUTH CHECK)
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
  requireRole("THERAPIST"),
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Client email required" });

      const therapistId = req.user.id;

      const client = await prisma.user.findUnique({ where: { email } });

      if (!client || client.role !== "USER") {
        return res.status(404).json({ error: "Client not found" });
      }

      const link = await prisma.therapistClient.upsert({
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
  requireRole("THERAPIST"),
  async (req, res) => {
    try {
      const therapistId = req.user.id;

      const links = await prisma.therapistClient.findMany({
        where: { therapistId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
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
// CLIENT DASHBOARD
// ----------------------
app.get(
  "/client/dashboard",
  requireAuth,
  requireRole("USER"),
  async (req, res) => {
    try {
      const clientId = req.user.id;

      const link = await prisma.therapistClient.findFirst({
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

    const validLink = await prisma.therapistClient.findFirst({
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
// GET MESSAGE THREAD
// ----------------------
app.get("/messages/thread/:otherUserId", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = parseInt(req.params.otherUserId);

    const validLink = await prisma.therapistClient.findFirst({
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
// MESSAGE LIST (WHO CAN I CHAT WITH?)
// ----------------------
app.get("/messages/list", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === "THERAPIST") {
      const links = await prisma.therapistClient.findMany({
        where: { therapistId: userId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.json({
        allowed: links.map((l) => l.client),
      });
    }

    if (role === "USER") {
      const link = await prisma.therapistClient.findFirst({
        where: { clientId: userId },
        include: {
          therapist: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.json({
        allowed: link ? [link.therapist] : [],
      });
    }

    res.status(400).json({ error: "Invalid role" });
  } catch (err) {
    console.error("list error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
});


