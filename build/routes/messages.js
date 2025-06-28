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
const Message_1 = require("../models/Message");
const Chat_1 = require("../models/Chat");
const router = express_1.default.Router();
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const message = new Message_1.Message(req.body);
        let savedMessage = yield message.save();
        savedMessage = yield savedMessage.populate("sender");
        savedMessage = yield savedMessage.populate("chat");
        yield Chat_1.Chat.findByIdAndUpdate(req.body.chat, { latestMessage: savedMessage._id });
        res.status(201).json(savedMessage);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
router.get("/:chatId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const messages = yield Message_1.Message.find({ chat: req.params.chatId }).populate("sender").populate("chat");
        res.json({ documents: messages, total: messages.length });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
exports.default = router;
