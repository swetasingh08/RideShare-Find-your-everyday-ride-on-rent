import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 2000 },
}, { _id: false, timestamps: true });

const conversationSchema = new mongoose.Schema({
    user: { type: ObjectId, ref: "User", index: true },
    sessionId: { type: String, required: true, index: true },
    messages: { type: [messageSchema], default: [] },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

conversationSchema.index({ user: 1, sessionId: 1 });

const AIConversation = mongoose.model("AIConversation", conversationSchema);

export default AIConversation;
