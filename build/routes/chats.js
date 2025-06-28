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
const Chat_1 = require("../models/Chat");
const User_1 = require("../models/User");
const router = express_1.default.Router();
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { usersHash } = req.body;
        const existingChat = yield Chat_1.Chat.findOne({ usersHash });
        if (existingChat)
            return res.json(existingChat);
        for (const userId of req.body.users) {
            const user = yield User_1.User.findById(userId);
            if (!user)
                return res.status(404).json({ error: `User with ID ${userId} not found` });
        }
        const chat = new Chat_1.Chat(req.body);
        yield chat.save();
        const populatedChat = yield Chat_1.Chat.findById(chat._id).populate("users").populate("latestMessage");
        res.status(201).json(populatedChat);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
// Get all chats for a specific user
router.get("/:userId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        // Optional: Validate that user exists
        const user = yield User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const chats = yield Chat_1.Chat.find({ users: userId })
            .populate("users", "-password") // exclude password if it exists
            .populate("latestMessage")
            .sort({ updatedAt: -1 });
        res.status(200).json(chats);
    }
    catch (error) {
        console.error("Error fetching chats by user ID:", error);
        res.status(500).json({ error: error.message });
    }
}));
exports.default = router;
