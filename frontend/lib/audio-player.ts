export class AudioPlayer {
  private audio: HTMLAudioElement
  private listeners: Map<string, Function[]> = new Map()

  constructor() {
    this.audio = new Audio()
    this.setupListeners()
  }

  private setupListeners() {
    this.audio.addEventListener("timeupdate", () => this.emit("timeupdate", this.audio.currentTime))
    this.audio.addEventListener("durationchange", () => this.emit("duration", this.audio.duration))
    this.audio.addEventListener("ended", () => this.emit("ended"))
    this.audio.addEventListener("play", () => this.emit("play"))
    this.audio.addEventListener("pause", () => this.emit("pause"))
    this.audio.addEventListener("error", (e) => this.emit("error", e))
    this.audio.addEventListener("loadstart", () => this.emit("loading"))
    this.audio.addEventListener("canplay", () => this.emit("canplay"))
  }

  async playStream(trackData: { id: string; title: string; artist: string; source: string }) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
      const streamUrl = `${backendUrl}/api/stream/play`

      // Create a blob URL or stream directly
      this.audio.src = streamUrl + `?trackId=${trackData.id}&source=${trackData.source}`
      this.audio.play()
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
  }
}
