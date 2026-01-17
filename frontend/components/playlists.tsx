"use client"

import { useState, useEffect } from "react"
import type { Track } from "./music-player"

interface Playlist {
  id: number
  name: string
  tracks: Track[]
  createdAt: string
}

export function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("http://localhost:3001/api/playlists")
      const data = await response.json()
      setPlaylists(data.playlists || [])
    } catch (error) {
      console.error("[v0] Error fetching playlists:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return

    try {
      const response = await fetch("http://localhost:3001/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlaylistName }),
      })
      const data = await response.json()
      setPlaylists([...playlists, data])
      setNewPlaylistName("")
    } catch (error) {
      console.error("[v0] Error creating playlist:", error)
    }
  }

  const deletePlaylist = async (id: number) => {
    try {
      await fetch(`http://localhost:3001/api/playlists/${id}`, { method: "DELETE" })
      setPlaylists(playlists.filter((p) => p.id !== id))
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(null)
      }
    } catch (error) {
      console.error("[v0] Error deleting playlist:", error)
    }
  }

  const removeTrackFromPlaylist = async (playlistId: number, trackIndex: number) => {
    const playlist = playlists.find((p) => p.id === playlistId)
    if (!playlist) return

    try {
      const newTracks = playlist.tracks.filter((_, i) => i !== trackIndex)
      // Update playlist
      const updated = { ...playlist, tracks: newTracks }
      setPlaylists(playlists.map((p) => (p.id === playlistId ? updated : p)))
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(updated)
      }
    } catch (error) {
      console.error("[v0] Error removing track:", error)
    }
  }

  return (
    <div className="grid gap-6 grid-cols-3">
      {/* Create Playlist Section */}
      <div className="col-span-3">
        <h2 className="text-xl font-bold text-foreground mb-4">My Playlists</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && createPlaylist()}
            placeholder="New playlist name..."
            className="flex-1 rounded-lg bg-input px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={createPlaylist}
            className="rounded-lg bg-primary px-6 py-2 text-primary-foreground font-semibold hover:bg-secondary transition-colors"
          >
            Create
          </button>
        </div>
      </div>

      {/* Playlists List */}
      {isLoading ? (
        <p className="col-span-3 text-muted-foreground">Loading playlists...</p>
      ) : playlists.length === 0 ? (
        <p className="col-span-3 text-muted-foreground">No playlists yet. Create one to get started!</p>
      ) : (
        <>
          <div className="col-span-1 space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">PLAYLISTS</h3>
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => setSelectedPlaylist(playlist)}
                className={`rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedPlaylist?.id === playlist.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover:bg-muted text-foreground"
                }`}
              >
                <p className="font-semibold truncate">{playlist.name}</p>
                <p className="text-xs mt-1 opacity-75">{playlist.tracks.length} tracks</p>
              </div>
            ))}
          </div>

          {/* Selected Playlist Details */}
          {selectedPlaylist && (
            <div className="col-span-2">
              <div className="rounded-lg bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{selectedPlaylist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlaylist.tracks.length} tracks • Created{" "}
                      {new Date(selectedPlaylist.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deletePlaylist(selectedPlaylist.id)}
                    className="rounded-lg bg-destructive px-4 py-2 text-destructive-foreground text-sm hover:opacity-90 transition-opacity"
                  >
                    Delete
                  </button>
                </div>

                {/* Tracks in Playlist */}
                {selectedPlaylist.tracks.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center">No tracks in this playlist yet</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedPlaylist.tracks.map((track, idx) => (
                      <div
                        key={`${track.id}-${idx}`}
                        className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors group"
                      >
                        <span className="text-xs font-semibold text-muted-foreground w-6">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                        </div>
                        <button
                          onClick={() => removeTrackFromPlaylist(selectedPlaylist.id, idx)}
                          className="rounded p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
