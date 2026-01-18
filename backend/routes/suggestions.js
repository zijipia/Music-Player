import express from "express";
import { getManager } from "ziplayer";
const router = express.Router();

router.post("/", async (req, res) => {
	const track = req.body?.track || {
		id: "J1X6LEa1hYA",
		title: "Nightcore ~ Chỉ Bằng Cái Gật Đầu [ Remix ] | PN Nightcore",
		url: "https://www.youtube.com/watch?v=J1X6LEa1hYA",
		source: "youtube",
	};

	try {
		const player = await getManager().create("default");
		const result = await player.getRelatedTracks(track);
		res.json({ results: result, total: result.length });
	} catch (error) {
		console.error("Search error:", error);
		res.status(500).json({ error: "Search failed" });
	}
});

export { router as suggestionsRouter };
