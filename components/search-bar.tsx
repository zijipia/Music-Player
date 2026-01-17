"use client"

import type React from "react"
import { useState } from "react"

interface SearchBarProps {
  onSearch: (query: string, source: string) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [source, setSource] = useState("all")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query, source)
    }
  }

  return (
    <div className="border-b border-border bg-card/30 p-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, playlists..."
            className="flex-1 rounded-lg bg-input px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2 text-primary-foreground font-semibold hover:bg-secondary transition-colors"
          >
            Search
          </button>
        </div>

        {/* Source Filter */}
        <div className="flex gap-2">
          {["all", "youtube", "soundcloud", "spotify"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className={`rounded-full px-4 py-1 text-sm transition-colors ${
                source === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent/20"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </form>
    </div>
  )
}
