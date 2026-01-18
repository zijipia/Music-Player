import express from "express";
import { getManager } from "ziplayer";
const router = express.Router();

router.get("/", async (req, res) => {
	const { q } = req.query;

	if (!q) {
		return res.status(400).json({ error: "Query parameter required" });
	}

	try {
		const player = await getManager().create("default");
		const result = await player.search(q.toString());
		res.json({ results: result.tracks, total: result.tracks.length });
	} catch (error) {
		console.error("Search error:", error);
		res.status(500).json({ error: "Search failed" });
	}
});

export { router as searchRoutes };
