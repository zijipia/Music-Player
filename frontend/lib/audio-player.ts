export class AudioPlayer {
  private audio: HTMLAudioElement
  private listeners: Map<string, Function[]> = new Map()
  private currentBlobUrl: string | null = null

  constructor() {
    this.audio = new Audio()
    this.audio.crossOrigin = "anonymous"
    this.setupListeners()
  }

  private setupListeners() {
    this.audio.addEventListener("timeupdate", () => this.emit("timeupdate", this.audio.currentTime))
    this.audio.addEventListener("durationchange", () => this.emit("duration", this.audio.duration))
    this.audio.addEventListener("ended", () => this.emit("ended"))
    this.audio.addEventListener("play", () => this.emit("play"))
    this.audio.addEventListener("pause", () => this.emit("pause"))
    this.audio.addEventListener("error", (e) => {
      console.error("[v0] Audio error:", e)
      this.emit("error", e)
    })
    this.audio.addEventListener("loadstart", () => this.emit("loading"))
    this.audio.addEventListener("canplay", () => this.emit("canplay"))
  }

  async playStream(trackData: { id: string; title: string; artist: string; source: string }) {
    try {
      console.log("[v0] Starting stream for track:", trackData)

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"

      const response = await fetch(`${backendUrl}/api/stream/play`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ track: trackData }),
      })

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.statusText}`)
      }

      console.log("[v0] Stream response received, creating blob URL")

      const blob = await response.blob()
      console.log("[v0] Blob created with type:", blob.type, "size:", blob.size)

      // Clean up previous blob URL
      if (this.currentBlobUrl) {
        URL.revokeObjectURL(this.currentBlobUrl)
      }

      this.currentBlobUrl = URL.createObjectURL(blob)
      this.audio.src = this.currentBlobUrl

      console.log("[v0] Audio source set, attempting to play")
      await this.audio.play()
      this.emit("playback", { status: "playing", track: trackData })
    } catch (error) {
      console.error("[v0] Streaming error:", error)
      this.emit("error", error)
    }
  }

  play() {
    this.audio.play()
  }

  pause() {
    this.audio.pause()
  }

  setVolume(volume: number) {
    this.audio.volume = volume / 100
  }

  seek(time: number) {
    this.audio.currentTime = time
  }

  getCurrentTime() {
    return this.audio.currentTime
  }

  getDuration() {
    return this.audio.duration
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      this.listeners.set(
        event,
        callbacks.filter((cb) => cb !== callback),
      )
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach((cb) => cb(data))
  }

  stop() {
    this.audio.pause()
    this.audio.currentTime = 0
  }

  destroy() {
    this.audio.pause()
    this.audio.src = ""
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl)
      this.currentBlobUrl = null
    }
  }
}
