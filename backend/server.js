import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { MusicService } from "./services/musicService.js"
import { searchRoutes } from "./routes/search.js"
import { streamRoutes } from "./routes/stream.js"
import { playlistRoutes } from "./routes/playlists.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize Music Service
const musicService = new MusicService()

// Make service available to routes
app.use((req, res, next) => {
  req.musicService = musicService
  next()
})

// Routes
app.use("/api/search", searchRoutes)
app.use("/api/stream", streamRoutes)
app.use("/api/playlists", playlistRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" })
})

app.listen(PORT, () => {
  console.log(`Music Player Backend running on http://localhost:${PORT}`)
})
