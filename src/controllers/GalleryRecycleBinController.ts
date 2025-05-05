import { Request, Response } from "express";
import GalleryRecycleBin from "../models/GalleryRecyclebin";
import Gallery from "../models/Gallery";

// GET all recycled images
export const getAllRecycleItems = (req: Request, res: Response): void => {
  GalleryRecycleBin.find()
    .populate("uploadedBy", "name email")
    .then((items) => res.json({ items }))
    .catch((err) => res.status(500).json({ message: err.message }));
};

// POST: Restore image from recycle bin
export const restoreImage = (req: Request, res: Response): void => {
  GalleryRecycleBin.findById(req.params.id)
    .then((item) => {
      if (!item) {
        return res.status(404).json({ message: "Recycle item not found" });
      }

      const restored = new Gallery({
        imageUrl: item.imageUrl,
        title: item.title,
        schoolName: item.schoolName,
        uploadedBy: item.uploadedBy,
        approved: item.approved,
      });

      restored
        .save()
        .then(() =>
          GalleryRecycleBin.findByIdAndDelete(req.params.id).then(() => {
            res.json({ message: "Image restored", restored });
          })
        )
        .catch((err) =>
          res.status(500).json({ message: "Restore failed", error: err })
        );
    })
    .catch((err) =>
      res.status(500).json({ message: "Restore lookup failed", error: err })
    );
};

// DELETE: Permanently delete a recycled image
export const permanentDeleteImage = (req: Request, res: Response): void => {
  GalleryRecycleBin.findById(req.params.id)
    .then((item) => {
      if (!item) {
        return res.status(404).json({ message: "Recycle item not found" });
      }

      item
        .deleteOne()
        .then(() => res.json({ message: "Image permanently deleted" }))
        .catch((err) =>
          res.status(500).json({ message: "Permanent delete failed", error: err })
        );
    })
    .catch((err) =>
      res.status(500).json({ message: "Delete lookup failed", error: err })
    );
};
