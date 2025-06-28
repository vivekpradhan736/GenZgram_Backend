import express, { Request, Response } from "express";
import { Chat } from "../models/Chat";
import { User } from "../models/User";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { usersHash } = req.body;
    const existingChat = await Chat.findOne({ usersHash });
    if (existingChat) return res.json(existingChat);

    for (const userId of req.body.users) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: `User with ID ${userId} not found` });
    }

    const chat = new Chat(req.body);
    await chat.save();
    const populatedChat = await Chat.findById(chat._id).populate("users").populate("latestMessage");
    res.status(201).json(populatedChat);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get all chats for a specific user
router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    // Optional: Validate that user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const chats = await Chat.find({ users: userId })
      .populate("users", "-password") // exclude password if it exists
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats by user ID:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;