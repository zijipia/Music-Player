import type { Track } from "./music-player"

interface NowPlayingProps {
  track: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
}

export function NowPlaying({ track, isPlaying, currentTime, duration }: NowPlayingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {track ? (
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 h-64 w-full rounded-xl bg-gradient-to-br from-primary via-secondary to-accent shadow-2xl animate-pulse" />
          <h2 className="text-2xl font-bold text-foreground text-balance">{track.title}</h2>
          <p className="text-muted-foreground mt-1">{track.artist}</p>
          <p className="text-sm text-accent mt-2">{track.source.toUpperCase()}</p>
          {isPlaying && (
            <div className="mt-6 flex items-center justify-center gap-1">
              <span className="inline-block w-1 h-8 bg-primary animate-bounce" style={{ animationDelay: "0s" }} />
              <span className="inline-block w-1 h-6 bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
              <span className="inline-block w-1 h-8 bg-primary animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-4 h-48 w-48 rounded-xl bg-muted" />
          <p className="text-xl text-muted-foreground">Select a track to play</p>
        </div>
      )}
    </div>
  )
}
