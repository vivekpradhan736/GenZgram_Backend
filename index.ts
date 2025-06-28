import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import http from "http";
import multer from "multer";
import { Server as SocketIOServer, Socket } from "socket.io";

// Routes
import { connectDB } from "./config/db";
import userRoutes from "./routes/users";
import postRoutes from "./routes/posts";
import followingRoutes from "./routes/following";
import commentRoutes from "./routes/comments";
import saveRoutes from "./routes/saves";
import chatRoutes from "./routes/chats";
import messageRoutes from "./routes/messages";
import authRoutes from "./routes/auth";
import uploadRoutes from "./routes/uploads";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Extend Express Request interface to include `userId`
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Middleware
app.use(express.json());

const allowedOrigins = ["https://genzgram.vercel.app","https://wrnv09jh-5173.inc1.devtunnels.ms"];

app.use(
  cors({
    origin: (origin: string | undefined, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// File upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use("/api/uploads", upload.single("file"), uploadRoutes);

// JWT Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { userId: string };
      req.userId = decoded.userId;
    } catch (error) {
      console.error("JWT verification failed:", error);
    }
  }
  next();
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/following", followingRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/saves", saveRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/auth", authRoutes);

// Socket.IO setup
const io = new SocketIOServer(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://genzgram.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

// Types
interface User {
  _id: string;
  name?: string;
}

interface Message {
  sender: User;
  chat: {
    users: User[];
  };
  [key: string]: any;
}

// Socket.IO connection
io.on("connection", (socket: Socket) => {
  console.log("A user connected");

  socket.on("setup", (userData: User) => {
    socket.join(userData._id);
    console.log("User joined room:", userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room: string) => {
    socket.join(room);
    console.log("User Joined Room:", room);
  });

  socket.on("typing", (room: string) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room: string) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved: Message) => {
    console.log("newMessageRecieved: ",newMessageRecieved)
    const chat = newMessageRecieved.chat;
    if (!chat?.users) return console.log("chat.users not defined");

    chat.users.forEach((user: any) => {
      if (user === newMessageRecieved.sender._id) return;
      console.log("user",user)
      socket.in(user).emit("message recieved", newMessageRecieved);
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
