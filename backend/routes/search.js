import express from "express"

const router = express.Router()

router.get("/", async (req, res) => {
  const { q, source = "all" } = req.query

  if (!q) {
    return res.status(400).json({ error: "Query parameter required" })
  }

  try {
    const results = await req.musicService.searchTracks(q, source)
    res.json({ results, total: results.length })
  } catch (error) {
    console.error("Search error:", error)
    res.status(500).json({ error: "Search failed" })
  }
})

export { router as searchRoutes }
