export class AudioPlayer {
	private audio: HTMLAudioElement;
	private listeners: Map<string, Function[]> = new Map();
	private currentTrack: any = null;
	private streamUrl: string | null = null;
	private progressiveUrl: string | null = null;
	private isBuffering: boolean = false;
	private bufferedBlob: Blob | null = null;

	constructor() {
		this.audio = new Audio();
		this.audio.crossOrigin = "anonymous";
		this.audio.preload = "metadata";
		this.setupListeners();
	}

	private setupListeners() {
		this.audio.addEventListener("timeupdate", () => this.emit("timeupdate", this.audio.currentTime));
		this.audio.addEventListener("durationchange", () => this.emit("duration", this.audio.duration));
		this.audio.addEventListener("ended", () => this.emit("ended"));
		this.audio.addEventListener("play", () => this.emit("play"));
		this.audio.addEventListener("pause", () => this.emit("pause"));
		this.audio.addEventListener("waiting", () => {
			console.log("[AudioPlayer] Buffering...");
			this.emit("buffering");
		});
		this.audio.addEventListener("playing", () => {
			console.log("[AudioPlayer] Playing");
			this.emit("playing");
		});
		this.audio.addEventListener("error", (e) => {
			console.error("[AudioPlayer] Error:", e);
			this.emit("error", e);
		});
		this.audio.addEventListener("loadstart", () => this.emit("loading"));
		this.audio.addEventListener("loadedmetadata", () => {
			console.log("[AudioPlayer] Metadata loaded");
			this.emit("metadata");
		});
		this.audio.addEventListener("canplay", () => {
			console.log("[AudioPlayer] Can play");
			this.emit("canplay");
		});
		this.audio.addEventListener("canplaythrough", () => {
			console.log("[AudioPlayer] Can play through");
			this.emit("canplaythrough");
		});
		this.audio.addEventListener("progress", () => {
			if (this.audio.buffered.length > 0) {
				const bufferedEnd = this.audio.buffered.end(this.audio.buffered.length - 1);
				const duration = this.audio.duration;
				if (duration > 0) {
					const percent = (bufferedEnd / duration) * 100;
					this.emit("bufferprogress", { percent, bufferedEnd, duration });
				}
			}
		});
		this.audio.addEventListener("seeking", () => {
			console.log("[AudioPlayer] Seeking to:", this.audio.currentTime);
			this.emit("seeking", this.audio.currentTime);
		});
		this.audio.addEventListener("seeked", () => {
			console.log("[AudioPlayer] Seeked to:", this.audio.currentTime);
			this.emit("seeked", this.audio.currentTime);
		});
	}

	/**
	 * HYBRID APPROACH: Phát ngay với progressive, đồng thời tải full blob ở background
	 * - Instant playback với progressive stream
	 * - Tự động chuyển sang seekable blob khi tải xong
	 */
	async playStreamHybrid(trackData: { id: string; title: string; artist?: string; source: string; url?: string }) {
		try {
			console.log("[AudioPlayer] 🎵 Starting hybrid stream:", trackData.title);

			this.currentTrack = trackData;
			const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
			const currentTime = this.audio.currentTime || 0;
try{
			// BƯỚC 1: Phát ngay với progressive stream
			const params = new URLSearchParams({
				trackData: JSON.stringify(trackData),
			});

			this.progressiveUrl = `${backendUrl}/api/stream/play?${params.toString()}`;
			this.audio.src = this.progressiveUrl;

			console.log("[AudioPlayer] ⚡ Progressive stream started - playing now!");

			await this.audio.play();
			this.emit("playback", { status: "playing", track: trackData, mode: "progressive" });
}catch(e){console.log(e)};
			// BƯỚC 2: Tải full blob ở background (không block playback)
			console.log("[AudioPlayer] 📥 Downloading full stream in background...");
			this.isBuffering = true;
			this.emit("startDownload", null);
			fetch(`${backendUrl}/api/stream/play`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ track: trackData }),
			})
				.then((response) => response.blob())
				.then((blob) => {
					console.log("[AudioPlayer] ✅ Full stream downloaded, switching to seekable mode");

					this.bufferedBlob = blob;
					this.isBuffering = false;
					this.emit("endDownload", null);
					// Lưu vị trí hiện tại
					const wasPlaying = !this.audio.paused;
					const currentPosition = this.audio.currentTime;

					// Chuyển sang blob URL (seekable)
					if (this.streamUrl) {
						URL.revokeObjectURL(this.streamUrl);
					}

					this.streamUrl = URL.createObjectURL(blob);
					this.audio.src = this.streamUrl;

					// Khôi phục vị trí và trạng thái
					this.audio.currentTime = currentPosition;

					if (wasPlaying) {
						this.audio.play().catch((err) => {
							console.error("[AudioPlayer] Resume error:", err);
						});
					}

					this.emit("upgraded", { mode: "seekable" });
					console.log("[AudioPlayer] 🎯 Now fully seekable!");
				})
				.catch((error) => {
					console.warn("[AudioPlayer] Background buffering failed:", error);
					this.isBuffering = false;
					// Không sao, tiếp tục với progressive stream
				});
		} catch (error: any) {
			console.error("[AudioPlayer] Stream error:", error);
			this.emit("error", error);
		}
	}

	/**
	 * FAST PLAYBACK: Chỉ progressive, không buffer
	 */
	async playStreamFast(trackData: { id: string; title: string; artist?: string; source: string; url?: string }) {
		try {
			console.log("[AudioPlayer] ⚡ Fast stream:", trackData.title);

			this.currentTrack = trackData;
			const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

			const params = new URLSearchParams({
				trackData: JSON.stringify(trackData),
			});

			if (this.streamUrl) {
				URL.revokeObjectURL(this.streamUrl);
				this.streamUrl = null;
			}

			this.audio.src = `${backendUrl}/api/stream/play?${params.toString()}`;

			await this.audio.play();
			this.emit("playback", { status: "playing", track: trackData, mode: "progressive" });
		} catch (error: any) {
			console.error("[AudioPlayer] Stream error:", error);
			this.emit("error", error);
		}
	}

	/**
	 * FULL QUALITY: Tải toàn bộ trước khi phát
	 */
	async playStreamFull(trackData: { id: string; title: string; artist?: string; source: string; url?: string }) {
		try {
			console.log("[AudioPlayer] 📥 Full buffering:", trackData.title);

			this.currentTrack = trackData;
			const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

			const response = await fetch(`${backendUrl}/api/stream/play`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ track: trackData }),
			});

			if (!response.ok) {
				throw new Error(`Stream failed: ${response.statusText}`);
			}

			const blob = await response.blob();
			this.bufferedBlob = blob;

			if (this.streamUrl) {
				URL.revokeObjectURL(this.streamUrl);
			}

			this.streamUrl = URL.createObjectURL(blob);
			this.audio.src = this.streamUrl;

			await this.audio.play();
			this.emit("playback", { status: "playing", track: trackData, mode: "seekable" });
		} catch (error: any) {
			console.error("[AudioPlayer] Stream error:", error);
			this.emit("error", error);
		}
	}

	play() {
		return this.audio.play();
	}

	pause() {
		this.audio.pause();
	}

	setVolume(volume: number) {
		this.audio.volume = Math.max(0, Math.min(1, volume / 100));
	}

	seek(time: number) {
		console.log(`[AudioPlayer] Seeking from ${this.audio.currentTime} to ${time}`);

		// Nếu đang trong progressive mode và chưa có blob, cảnh báo
		if (!this.bufferedBlob && this.isBuffering) {
			console.warn("[AudioPlayer] ⚠️ Still buffering full stream, seeking may restart from beginning");
			this.emit("seekwarning", {
				message: "Stream is still loading, seeking may not work smoothly",
			});
		}

		if (this.audio.seekable.length > 0) {
			const seekableEnd = this.audio.seekable.end(0);
			const seekableStart = this.audio.seekable.start(0);

			console.log(`[AudioPlayer] Seekable range: ${seekableStart} - ${seekableEnd}`);

			if (time >= seekableStart && time <= seekableEnd) {
				this.audio.currentTime = time;
			} else {
				console.warn(`[AudioPlayer] Time ${time} is outside seekable range`);
				this.audio.currentTime = Math.max(seekableStart, Math.min(time, seekableEnd));
			}
		} else {
			console.warn("[AudioPlayer] Media is not seekable yet");
			this.audio.currentTime = time;
		}
	}

	getCurrentTime() {
		return this.audio.currentTime;
	}

	getDuration() {
		return this.audio.duration;
	}

	isSeekable() {
		return this.audio.seekable.length > 0 && this.bufferedBlob !== null;
	}

	isFullyBuffered() {
		return this.bufferedBlob !== null;
	}

	getSeekable() {
		const seekable = [];
		for (let i = 0; i < this.audio.seekable.length; i++) {
			seekable.push({
				start: this.audio.seekable.start(i),
				end: this.audio.seekable.end(i),
			});
		}
		return seekable;
	}

	getBuffered() {
		const buffered = [];
		for (let i = 0; i < this.audio.buffered.length; i++) {
			buffered.push({
				start: this.audio.buffered.start(i),
				end: this.audio.buffered.end(i),
			});
		}
		return buffered;
	}

	getBufferedPercent() {
		if (this.audio.buffered.length > 0 && this.audio.duration > 0) {
			const bufferedEnd = this.audio.buffered.end(this.audio.buffered.length - 1);
			return (bufferedEnd / this.audio.duration) * 100;
		}
		return 0;
	}

	on(event: string, callback: Function) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event)!.push(callback);
	}

	off(event: string, callback: Function) {
		const callbacks = this.listeners.get(event);
		if (callbacks) {
			this.listeners.set(
				event,
				callbacks.filter((cb) => cb !== callback),
			);
		}
	}

	private emit(event: string, data?: any) {
		const callbacks = this.listeners.get(event) || [];
		callbacks.forEach((cb) => cb(data));
	}

	stop() {
		this.audio.pause();
		this.audio.currentTime = 0;
	}

	destroy() {
		this.audio.pause();
		this.audio.src = "";
		if (this.streamUrl) {
			URL.revokeObjectURL(this.streamUrl);
			this.streamUrl = null;
		}
		if (this.progressiveUrl) {
			this.progressiveUrl = null;
		}
		this.bufferedBlob = null;
		this.currentTrack = null;
	}
}
