"use client"

import type { Track } from "./music-player"

interface QueueProps {
  tracks: Track[]
  onRemove: (index: number) => void
  onClear: () => void
}

export function Queue({ tracks, onRemove, onClear }: QueueProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Queue ({tracks.length})</h2>
        {tracks.length > 0 && (
          <button onClick={onClear} className="text-sm text-muted-foreground hover:text-destructive transition-colors">
            Clear all
          </button>
        )}
      </div>
      {tracks.length === 0 ? (
        <p className="text-muted-foreground">Queue is empty</p>
      ) : (
        <div className="space-y-2">
          {tracks.map((track, idx) => (
            <div
              key={`${track.id}-${idx}`}
              className="flex items-center gap-3 rounded-lg bg-card p-3 hover:bg-muted transition-colors group"
            >
              <span className="text-sm font-semibold text-muted-foreground w-6">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{track.title}</p>
                <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
              </div>
              <button
                onClick={() => onRemove(idx)}
                className="rounded p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
