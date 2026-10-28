import express from "express";
import { chat, clearHistory, history, recommend } from "../controllers/aiController.js";
import { optionalProtect } from "../middleware/auth.js";

const aiRouter = express.Router();

aiRouter.post("/recommend", optionalProtect, recommend);
aiRouter.post("/chat", optionalProtect, chat);
aiRouter.get("/history", optionalProtect, history);
aiRouter.delete("/history", optionalProtect, clearHistory);

export default aiRouter;
