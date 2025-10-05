import express, { type Request, type Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "../generated/prisma/index.js";
import {
  createUser,
  loginUser,
  loginUserWithToken,
  type CreateUserInput,
  type LoginUserInput,
  type UserDetails,
} from "./user.js";
import { auth } from "./middleware/auth.js";
import { rewriteServicePath } from "./middleware/pathRewrite.js";
import {
  insertRoomMember,
  getRoomById,
  getRooms,
  insertRoom,
  deleteRoomMember,
  type CreateRoomInput,
} from "./room.js";
import { getMessages, insertMessage, type MessageInput } from "./message.js";
import { emitWithRetry } from "./socket.js";
import cors from "cors";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  path: process.env.SOCKET_IO_PATH ?? "/socket.io",
  connectionStateRecovery: {},
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

type EventResponse = {
  status: string;
};

app.use(
  express.json(),
  cors({
    maxAge: 84600,
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  }),
  rewriteServicePath
);

app.post("/user/new", async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateUserInput;
    const result = await createUser(prisma, body);

    res.status(200).send(result);
  } catch (e) {
    if (e instanceof Error) {
      res.status(400).send({ error: e.message });
      return;
    }
    res.status(500).send({ error: "Unexpected error" });
    return;
  }
});

app.post("/user/login", async (req: Request, res: Response) => {
  const userDetails = await loginUser(prisma, req.body as LoginUserInput);
  if (userDetails) {
    res.status(200).send(userDetails);
    return;
  }
  res.status(500).send({ error: "Login failed" });
  return;
});

app.post("/user/verify", async (req: Request, res: Response) => {
  const userDetails = await loginUserWithToken(
    prisma,
    req.body as { token: string }
  );
  if (userDetails) {
    res.status(200).send(userDetails);
    return;
  }
  res.status(500).send({ error: "Login failed" });
  return;
});

app.get("/rooms", auth, async (_: Request, res: Response) => {
  const rooms = await getRooms(prisma);
  res.send(rooms);
});

app.post("/room", auth, async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateRoomInput;
    const result = await insertRoom(prisma, body);
    if (!result) {
      throw new Error("Could not create room");
    }

    res.status(201).send(result);
  } catch (e) {
    if (e instanceof Error) {
      res.status(400).send({ error: e.message });
      return;
    }
    res.status(500).send({ error: "Unexpected error" });
    return;
  }
});

app.get("/rooms/:roomId", auth, async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const roomIdInt = parseInt(roomId ?? "");
  if (isNaN(roomIdInt)) {
    res.status(400).send({ error: "Invalid request" });
    return;
  }

  const room = await getRoomById(prisma, roomIdInt);
  room ? res.send(room) : res.status(404).send();
});

app.get(
  "/rooms/:roomId/messages",
  auth,
  async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const roomIdInt = parseInt(roomId ?? "");
    if (isNaN(roomIdInt)) {
      res.status(400).send({ error: "Invalid request" });
      return;
    }
    const room = await getMessages(prisma, roomIdInt);
    res.send(room);
  }
);

app.post(
  "/rooms/:roomId/members",
  auth,
  async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const roomIdInt = parseInt(roomId ?? "");
      if (isNaN(roomIdInt)) {
        res.status(400).send({ error: "Invalid request" });
        return;
      }

      const { id: userId } = req.body as UserDetails;

      const result = await insertRoomMember(prisma, {
        roomId: roomIdInt,
        userId,
      });
      if (!result) {
        throw new Error("Could not add member to room");
      }
      res.status(200).send(result);
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).send({ error: e.message });
        return;
      }
      res.status(500).send({ error: "Unexpected error" });
      return;
    }
  }
);

app.delete(
  "/rooms/:roomId/members/:userId",
  auth,
  async (req: Request, res: Response) => {
    try {
      const { roomId, userId } = req.params;
      const roomIdInt = parseInt(roomId ?? "");
      const userIdInt = parseInt(userId ?? "");
      if (isNaN(roomIdInt) || isNaN(userIdInt)) {
        res.status(400).send({ error: "Invalid request" });
        return;
      }

      const result = await deleteRoomMember(prisma, {
        roomId: roomIdInt,
        userId: userIdInt,
      });

      if (!result) {
        throw new Error("Could not remove member from room");
      }

      res.status(204).send();
      return;
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).send({ error: e.message });
        return;
      }
      res.status(500).send({ error: "Unexpected error" });
      return;
    }
  }
);

app.post("/messages", auth, async (req: Request, res: Response) => {
  try {
    const message = await insertMessage(prisma, req.body as MessageInput);
    if (!message) throw new Error("Message creation failed");

    await emitWithRetry(io, message.roomId, "chat message", message);

    res.status(201).send(message);
  } catch (e) {
    res.status(500).send();
  }
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on(
    "join room",
    async (roomId: number, callback: ({ status }: EventResponse) => void) => {
      await socket.join(roomId.toString());
      callback({ status: "room join acknowledged" });
    }
  );

  socket.on(
    "leave room",
    async (roomId: number, callback: ({ status }: EventResponse) => void) => {
      await socket.leave(roomId.toString());
      callback({ status: "room leave acknowledged" });
    }
  );

  socket.on("disconnect", () => console.log("user disconnected"));
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
