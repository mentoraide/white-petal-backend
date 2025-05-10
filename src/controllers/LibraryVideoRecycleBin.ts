import { Request, Response } from "express";
import LibraryRecycleBinModel from "../models/LibraryVideoRecycleBinModel";
import LibraryVideo from "../models/LibraryBook"; // Main model

export const getAllLibraryRecycleItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const items = await LibraryRecycleBinModel.find().populate(
      "uploadedBy",
      "name email"
    );

    res.status(200).json(items);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
export const restoreLibraryVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const item = await LibraryRecycleBinModel.findById(req.params.id);
    if (!item) {
      res.status(404).json({ message: "Recycle item not found" });
      return;
    }

    const restoredVideo = new LibraryVideo({
      originalVideoId: item._id,
      title: item.title,
      author: item.author,
      subject: item.subject,
      keywords: item.keywords,
      videoUrl: item.videoUrl, // Ensure this field is populated
      coverImage: item.coverImage,
      description: item.description,
      uploadedBy: item.uploadedBy,
      approved: item.approved,
      deletedAt: new Date(),
    });

    await restoredVideo.save();
    await LibraryRecycleBinModel.findByIdAndDelete(item._id);

    res
      .status(200)
      .json({ message: "Video restored successfully", restoredVideo });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const permanentDeleteLibraryVideo = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const deleted = await LibraryRecycleBinModel.findByIdAndDelete(
      req.params.id
    );
    if (!deleted) {
      res.status(404).json({ message: "Recycle item not found" });
      return;
    }

    res
      .status(200)
      .json({ message: "Library video permanently deleted from Recycle Bin" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
