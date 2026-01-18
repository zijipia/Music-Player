import express from "express";
import cors from "cors";
import dotenv from "dotenv";

//player
import { PlayerManager } from "ziplayer";
import { SoundCloudPlugin, YouTubePlugin, SpotifyPlugin } from "@ziplayer/plugin";

import { searchRoutes } from "./routes/search.js";
import { streamRoutes } from "./routes/stream.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
	cors({
		origin: process.env.cors_origin || "*",
	}),
);
app.use(express.json());

// Initialize Music Service
const manager = new PlayerManager({
	plugins: [new YouTubePlugin(), new SoundCloudPlugin(), new SpotifyPlugin()],
});
manager.on("debug", console.log);
app.use((req, res, next) => {
	console.log(`Incoming request: ${req.method} ${req.url}`);
	next();
});
// Routes
app.use("/api/search", searchRoutes);
app.use("/api/stream", streamRoutes);

// Health check
app.get("/api/health", (req, res) => {
	res.json({ status: "ok" });
});

app.listen(PORT, () => {
	console.log(`Music Player Backend running on http://localhost:${PORT}`);
});
