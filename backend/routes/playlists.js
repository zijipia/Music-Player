import express from "express"

const router = express.Router()

const playlists = []

router.get("/", (req, res) => {
  res.json({ playlists })
})

router.post("/", (req, res) => {
  const { name } = req.body
  const playlist = {
    id: Date.now(),
    name,
    tracks: [],
    createdAt: new Date(),
  }
  playlists.push(playlist)
  res.json(playlist)
})

router.post("/:id/tracks", (req, res) => {
  const { id } = req.params
  const { track } = req.body
  const playlist = playlists.find((p) => p.id === Number.parseInt(id))

  if (!playlist) {
    return res.status(404).json({ error: "Playlist not found" })
  }

  playlist.tracks.push(track)
  res.json(playlist)
})

export { router as playlistRoutes }
