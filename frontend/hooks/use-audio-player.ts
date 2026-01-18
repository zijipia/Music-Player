"use client";

import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/lib/audio-player";
import type { Track } from "@/components/music-player";

export function useAudioPlayer() {
	const playerRef = useRef<AudioPlayer | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		playerRef.current = new AudioPlayer();
		const player = playerRef.current;

		player.on("play", () => setIsPlaying(true));
		player.on("pause", () => setIsPlaying(false));
		player.on("timeupdate", (time: number) => setCurrentTime(time));
		player.on("duration", (dur: number) => setDuration(dur));
		player.on("loading", () => setIsLoading(true));
		player.on("canplay", () => setIsLoading(false));
		player.on("error", (err: any) => {
			console.error("[v0] Player error:", err);
			setError("Playback error occurred");
		});

		return () => {
			player.destroy();
		};
	}, []);

	const playTrack = (track: Track) => {
		if (playerRef.current) {
			setError(null);
			playerRef.current.playStreamHybrid(track);
		}
	};

	const togglePlayPause = () => {
		if (playerRef.current) {
			if (isPlaying) {
				playerRef.current.pause();
			} else {
				playerRef.current.play();
			}
		}
	};

	const setVolume = (volume: number) => {
		if (playerRef.current) {
			playerRef.current.setVolume(volume);
		}
	};

	const seek = (time: number) => {
		if (playerRef.current) {
			playerRef.current.seek(time);
		}
	};

	return {
		playTrack,
		togglePlayPause,
		setVolume,
		seek,
		isPlaying,
		currentTime,
		duration,
		isLoading,
		error,
	};
}
