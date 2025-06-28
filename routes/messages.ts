import express, { Request, Response } from "express";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const message = new Message(req.body);
    let savedMessage = await message.save();
    savedMessage = await savedMessage.populate("sender");
    savedMessage = await savedMessage.populate("chat");

    await Chat.findByIdAndUpdate(req.body.chat, { latestMessage: savedMessage._id });

    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.get("/:chatId", async (req: Request, res: Response) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId }).populate("sender").populate("chat");
    res.json({ documents: messages, total: messages.length });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;