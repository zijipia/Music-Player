import express from "express";
import { getManager } from "ziplayer";

const router = express.Router();

// GET endpoint cho direct streaming với Range support
router.get("/play", async (req, res) => {
	try {
		const trackData = JSON.parse(req.query.trackData);

		if (!trackData) {
			return res.status(400).json({ error: "Track data required" });
		}

		const cacheKey = trackData.id || trackData.url;
		console.log("[Stream] Request for:", trackData.title);

		const player = await getManager().create("default");
		const streamInfo = await player.save(trackData);

		if (!streamInfo) {
			return res.status(404).json({ error: "Stream not available" });
		}

		// Lấy range từ request
		const range = req.headers.range;

		if (!range) {
			// Không có range - stream từ đầu
			console.log("[Stream] Streaming from beginning");

			res.setHeader("Content-Type", "audio/webm");
			res.setHeader("Accept-Ranges", "bytes");
			res.setHeader("Cache-Control", "public, max-age=3600");
			res.setHeader("Connection", "keep-alive");

			streamInfo.pipe(res);

			streamInfo.on("error", (error) => {
				console.error("[Stream] Stream error:", error);
				if (!res.headersSent) {
					res.status(500).end();
				}
			});

			req.on("close", () => {
				console.log("[Stream] Client disconnected");
				streamInfo.destroy();
			});
		} else {
			// Có range request - cần xử lý seeking
			// Note: Điều này khó implement với streams không biết length
			// Giải pháp tốt nhất là buffer hoặc dùng chunked transfer
			console.log("[Stream] Range request:", range);

			// Tạm thời: ignore range và stream lại từ đầu
			// Browser sẽ tự skip đến vị trí cần
			res.setHeader("Content-Type", "audio/webm");
			res.setHeader("Accept-Ranges", "bytes");
			res.setHeader("Cache-Control", "public, max-age=3600");

			streamInfo.pipe(res);

			streamInfo.on("error", (error) => {
				console.error("[Stream] Stream error:", error);
				if (!res.headersSent) {
					res.status(500).end();
				}
			});

			req.on("close", () => {
				streamInfo.destroy();
			});
		}
	} catch (error) {
		console.error("[Stream] Error:", error);
		if (!res.headersSent) {
			res.status(500).json({ error: "Stream failed" });
		}
	}
});

// POST endpoint - Buffer toàn bộ để support seeking
router.post("/play", async (req, res) => {
	const { track } = req.body;

	if (!track) {
		return res.status(400).json({ error: "Track required" });
	}

	try {
		console.log("[Stream] POST request for:", track.title);

		const player = await getManager().create("default");
		const streamInfo = await player.save(track);

		if (!streamInfo) {
			return res.status(404).json({ error: "Stream not available" });
		}

		// Buffer toàn bộ stream vào memory
		const chunks = [];

		streamInfo.on("data", (chunk) => {
			chunks.push(chunk);
		});

		streamInfo.on("end", () => {
			const buffer = Buffer.concat(chunks);
			const totalLength = buffer.length;

			// Xử lý range request
			const range = req.headers.range;

			if (!range) {
				// Không có range - gửi toàn bộ
				res.setHeader("Content-Type", "audio/webm");
				res.setHeader("Content-Length", totalLength);
				res.setHeader("Accept-Ranges", "bytes");
				res.setHeader("Cache-Control", "public, max-age=3600");
				res.send(buffer);
			} else {
				// Parse range header
				const parts = range.replace(/bytes=/, "").split("-");
				const start = parseInt(parts[0], 10);
				const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
				const chunksize = end - start + 1;

				console.log(`[Stream] Range: ${start}-${end}/${totalLength}`);

				// Gửi partial content
				res.status(206);
				res.setHeader("Content-Type", "audio/webm");
				res.setHeader("Content-Range", `bytes ${start}-${end}/${totalLength}`);
				res.setHeader("Accept-Ranges", "bytes");
				res.setHeader("Content-Length", chunksize);
				res.setHeader("Cache-Control", "public, max-age=3600");
				res.send(buffer.slice(start, end + 1));
			}
		});

		streamInfo.on("error", (error) => {
			console.error("[Stream] Stream error:", error);
			if (!res.headersSent) {
				res.status(500).json({ error: "Stream failed" });
			}
		});
	} catch (error) {
		console.error("[Stream] Error:", error);
		res.status(500).json({ error: "Stream failed" });
	}
});

export { router as streamRoutes };
