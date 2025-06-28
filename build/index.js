"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_1 = __importDefault(require("http"));
const multer_1 = __importDefault(require("multer"));
const socket_io_1 = require("socket.io");
// Routes
const db_1 = require("./config/db");
const users_1 = __importDefault(require("./routes/users"));
const posts_1 = __importDefault(require("./routes/posts"));
const following_1 = __importDefault(require("./routes/following"));
const comments_1 = __importDefault(require("./routes/comments"));
const saves_1 = __importDefault(require("./routes/saves"));
const chats_1 = __importDefault(require("./routes/chats"));
const messages_1 = __importDefault(require("./routes/messages"));
const auth_1 = __importDefault(require("./routes/auth"));
const uploads_1 = __importDefault(require("./routes/uploads"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Middleware
app.use(express_1.default.json());
const allowedOrigins = ["http://localhost:5173", "https://wrnv09jh-5173.inc1.devtunnels.ms"];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
// File upload setup
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
app.use("/api/uploads", upload.single("file"), uploads_1.default);
// JWT Middleware
app.use((req, res, next) => {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
        }
        catch (error) {
            console.error("JWT verification failed:", error);
        }
    }
    next();
});
// API Routes
app.use("/api/users", users_1.default);
app.use("/api/posts", posts_1.default);
app.use("/api/following", following_1.default);
app.use("/api/comments", comments_1.default);
app.use("/api/saves", saves_1.default);
app.use("/api/chats", chats_1.default);
app.use("/api/messages", messages_1.default);
app.use("/api/auth", auth_1.default);
// Socket.IO setup
const io = new socket_io_1.Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
    },
});
// Socket.IO connection
io.on("connection", (socket) => {
    console.log("A user connected");
    socket.on("setup", (userData) => {
        socket.join(userData._id);
        console.log("User joined room:", userData._id);
        socket.emit("connected");
    });
    socket.on("join chat", (room) => {
        socket.join(room);
        console.log("User Joined Room:", room);
    });
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
    socket.on("new message", (newMessageRecieved) => {
        console.log("newMessageRecieved: ", newMessageRecieved);
        const chat = newMessageRecieved.chat;
        if (!(chat === null || chat === void 0 ? void 0 : chat.users))
            return console.log("chat.users not defined");
        chat.users.forEach((user) => {
            if (user === newMessageRecieved.sender._id)
                return;
            console.log("user", user);
            socket.in(user).emit("message recieved", newMessageRecieved);
        });
    });
});
// Start server
const PORT = process.env.PORT || 5000;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.connectDB)();
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
startServer();
