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
exports.InputValidator = exports.dbError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const node_input_validator_1 = require("node-input-validator");
const ResponseCode_1 = require("./ResponseCode");
const dbError = (error, res) => {
    switch (true) {
        case error.code === 11000: {
            const keyPattern = /index: .*?\.(.*?)_.*? dup key:/;
            const matches = error.message.match(keyPattern);
            const duplicateField = matches && matches[1] ? matches[1] : "unknown";
            res.status(ResponseCode_1.ResponseCode.DUPLICATE_KEY_ERROR).json({
                status: false,
                message: `Duplicate key error on field: ${duplicateField}`,
                error: error
            });
            break;
        }
        case error instanceof mongoose_1.default.Error.ValidationError: {
            const errors = [];
            for (const field in error.errors) {
                if (Object.prototype.hasOwnProperty.call(error.errors, field)) {
                    errors.push(error.errors[field].message);
                }
            }
            res.status(ResponseCode_1.ResponseCode.VALIDATION_ERROR).json({
                status: false,
                error: errors,
                message: errors[0]
            });
            break;
        }
        case error instanceof mongoose_1.default.Error.CastError: {
            res.status(ResponseCode_1.ResponseCode.BAD_REQUEST).json({
                status: false,
                message: `Invalid ${error.kind}: ${error.value}`,
                error: error
            });
            break;
        }
        default: {
            res.status(ResponseCode_1.ResponseCode.SERVER_ERROR).json({
                status: false,
                message: "Internal Server Error",
                error: error
            });
            break;
        }
    }
};
exports.dbError = dbError;
const InputValidator = (input, rules) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const v = new node_input_validator_1.Validator(input, rules);
        v.check()
            .then((match) => {
            if (!match) {
                const error = Object.values(v.errors)[0].message;
                reject(error);
            }
            else {
                resolve();
            }
        })
            .catch((error) => {
            reject(error);
        });
    });
});
exports.InputValidator = InputValidator;
