import express from "express";

import { getManager } from "ziplayer";

const router = express.Router();

router.post("/play", async (req, res) => {
  const { track } = req.body;

  if (!track) {
    return res.status(400).json({ error: "Track required" });
  }

  try {
    const player = await getManager().create("default");

    const streamInfo = await player.save(track); //return ReadableStream
    console.log("Stream Info:", streamInfo);
    if (!streamInfo) {
      return res.status(404).json({ error: "Stream not available" });
    }

    res.setHeader("Content-Type", "audio/webm");
    streamInfo.pipe(res);
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({ error: "Stream failed" });
  }
});

export { router as streamRoutes };
