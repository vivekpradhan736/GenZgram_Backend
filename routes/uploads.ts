import express, { Request, Response } from "express";
import cloudinary from "../config/cloudinary";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const file = req.file; 
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Convert buffer to data URI
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "social_media",
      resource_type: "auto",
    });
    const publicId = result?.public_id?.split("/")[1];
    res.json({ id: publicId, url: result.secure_url });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    await cloudinary.uploader.destroy(req.params.id);
    res.json({ status: "Ok" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;