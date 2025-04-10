"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVideoSettingById = exports.updateVideoSettingById = exports.getVideoSettingById = exports.getVideoSetting = exports.createVideoSetting = void 0;
const VideoSetting_1 = __importDefault(require("../models/VideoSetting"));
// CREATE (Only one allowed)
const createVideoSetting = function (req, res) {
    const { pricePerVideo, maxVideoLength } = req.body;
    VideoSetting_1.default.findOne({})
        .then(existing => {
        if (existing) {
            return res.status(400).json({ message: "Settings already exist." });
        }
        const setting = new VideoSetting_1.default({ pricePerVideo, maxVideoLength });
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
exports.createVideoSetting = createVideoSetting;
// GET All (get first/default setting)
const getVideoSetting = function (req, res) {
    VideoSetting_1.default.findOne({})
        .then(setting => {
        if (!setting)
            return res.status(404).json({ message: "No Video settings found." });
        res.status(200).json(setting);
    })
        .catch(err => res.status(500).json({ message: "Error fetching settings", error: err }));
};
exports.getVideoSetting = getVideoSetting;
// GET by ID
const getVideoSettingById = function (req, res) {
    const id = req.params.id;
    VideoSetting_1.default.findById(id)
        .then(setting => {
        if (!setting)
            return res.status(404).json({ message: "Video Setting not found." });
        res.status(200).json(setting);
    })
        .catch(err => res.status(500).json({ message: "Error fetching by ID", error: err }));
};
exports.getVideoSettingById = getVideoSettingById;
// UPDATE by ID
const updateVideoSettingById = function (req, res) {
    const id = req.params.id;
    const { pricePerVideo, maxVideoLength } = req.body;
    VideoSetting_1.default.findByIdAndUpdate(id, { pricePerVideo, maxVideoLength }, { new: true })
        .then(updated => {
        if (!updated)
            return res.status(404).json({ message: "Video Setting not found to update." });
        res.status(200).json({
            message: "VideoSetting Updated successfully.",
            updated
        });
    })
        .catch(err => res.status(500).json({ message: "Update by ID failed", error: err }));
};
exports.updateVideoSettingById = updateVideoSettingById;
// DELETE by ID
const deleteVideoSettingById = function (req, res) {
    const id = req.params.id;
    VideoSetting_1.default.findByIdAndDelete(id)
        .then(deleted => {
        if (!deleted)
            return res.status(404).json({ message: "Video Setting not found to delete." });
        res.status(200).json({ message: "VideoSetting deleted successfully." });
    })
        .catch(err => res.status(500).json({ message: "Delete by ID failed", error: err }));
};
exports.deleteVideoSettingById = deleteVideoSettingById;
