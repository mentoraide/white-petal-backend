import { Request, Response } from "express";
import VideoSetting, { IVideoSetting } from "../models/VideoSetting";

// CREATE (Only one allowed)
export const createVideoSetting = function (req: Request, res: Response) {
    const { pricePerVideo, maxVideoLength } = req.body;
  
    VideoSetting.findOne({})
      .then(existing => {
        if (existing) {
          return res.status(400).json({ message: "Settings already exist." });
        }
  
        const setting = new VideoSetting({ pricePerVideo, maxVideoLength });
  
        setting.save()
          .then(saved => {
            res.status(201).json({
              message: "Video setting created successfully.",
              data: saved
            });
          })
          .catch(err => res.status(500).json({ message: "Save failed", error: err }));
      })
      .catch(err => res.status(500).json({ message: "Error checking existing settings", error: err }));
  };

// GET All (get first/default setting)
export const getVideoSetting = function (req: Request, res: Response) {
  VideoSetting.findOne({})
    .then(setting => {
      if (!setting) return res.status(404).json({ message: "No Video settings found." });
      res.status(200).json(setting);
    })
    .catch(err => res.status(500).json({ message: "Error fetching settings", error: err }));
};

// GET by ID
export const getVideoSettingById = function (req: Request, res: Response) {
  const id = req.params.id;

  VideoSetting.findById(id)
    .then(setting => {
      if (!setting) return res.status(404).json({ message: "Video Setting not found." });
      res.status(200).json(setting);
    })
    .catch(err => res.status(500).json({ message: "Error fetching by ID", error: err }));
};

// UPDATE by ID
export const updateVideoSettingById = function (req: Request, res: Response) {
  const id = req.params.id;
  const { pricePerVideo, maxVideoLength } = req.body;

  VideoSetting.findByIdAndUpdate(id, { pricePerVideo, maxVideoLength }, { new: true })
    .then(updated => {
      if (!updated) return res.status(404).json({ message: "Video Setting not found to update." });
      res.status(200).json({
         message: "VideoSetting Updated successfully.",
         updated 
        });
    })
    .catch(err => res.status(500).json({ message: "Update by ID failed", error: err }));
};


// DELETE by ID
export const deleteVideoSettingById = function (req: Request, res: Response) {
  const id = req.params.id;

  VideoSetting.findByIdAndDelete(id)
    .then(deleted => {
      if (!deleted) return res.status(404).json({ message: "Video Setting not found to delete." });
      res.status(200).json({ message: "VideoSetting deleted successfully." });
    })
    .catch(err => res.status(500).json({ message: "Delete by ID failed", error: err }));
};


