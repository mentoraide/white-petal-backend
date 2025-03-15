import mongoose, { Document, Schema, Model } from "mongoose";

interface MessageDocument extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  text?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<MessageDocument>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
    },

  },
  { timestamps: true }
);

const Message: Model<MessageDocument> = mongoose.model<MessageDocument>("Message", messageSchema);

export default Message;

