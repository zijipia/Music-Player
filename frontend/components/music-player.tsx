"use client";

import { useState, useCallback, useEffect } from "react";
import { SearchBar } from "./search-bar";
import { NowPlaying } from "./now-playing";
import { Queue } from "./queue";
import { SearchResults } from "./search-results";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { useHealthCheck } from "@/hooks/use-health-check";
import { Music, Search, List, Play, Pause, SkipForward, SkipBack, Volume2, ArrowDownToLine, RefreshCw } from "lucide-react";

export interface Track {
	id: string;
	title: string;
	artist: string;
	source: "youtube" | "soundcloud" | "spotify";
	thumbnail: string;
	duration: number;
	url?: string;
}

export function MusicPlayer() {
	const [currentTab, setCurrentTab] = useState<"now-playing" | "queue" | "search" | "suggestions">("now-playing");
	const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
	const [queue, setQueue] = useState<Track[]>([]);
	const [searchResults, setSearchResults] = useState<Track[]>([]);
	const [suggestions, setSuggestions] = useState<Track[]>([]);
	const [volume, setVolume] = useState(70);

	const { isHealthy, isChecking, error: healthError, checkHealth } = useHealthCheck();

	const {
		playTrack,
		togglePlayPause,
		isPlaying,
		currentTime,
		duration,
		isLoading,
		isDownloading,
		error,
		seek,
		setVolume: setPlayerVolume,
		downloadTrack,
		canDownloadTrack,
	} = useAudioPlayer();

	useEffect(() => {
		setPlayerVolume(volume);
	}, [volume, setPlayerVolume]);

	const handleSearch = useCallback(async (query: string, source: string) => {
		try {
			const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
			const sourceParam = source === "all" ? "" : `&source=${source}`;
			const response = await fetch(`${backendUrl}/api/search?q=${encodeURIComponent(query)}${sourceParam}`);
			const data = await response.json();
			console.log("[v0] Search results:", data);
			setSearchResults(data.results || []);
			setCurrentTab("search");
		} catch (error) {
			console.error("[v0] Search error:", error);
		}
	}, []);

	const handleSearchSuggestions = useCallback(async () => {
		try {
			const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
			const response = await fetch(`${backendUrl}/api/suggestions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ track: currentTrack }),
			});

			const data = await response.json();
			console.log("[v0] Suggestions results:", data);
			setSuggestions(data.results || []);
			setCurrentTab("suggestions");
		} catch (error) {
			console.error("[v0] Suggestions error:", error);
		}
	}, []);

	const handleAddToQueue = useCallback((track: Track) => {
		setQueue((prev) => [...prev, track]);
	}, []);

	const handlePlayTrack = useCallback(
		(track: Track) => {
			setCurrentTrack(track);
			playTrack(track);
			try {
				if ("mediaSession" in navigator && track) {
					navigator.mediaSession.metadata = new MediaMetadata({
						title: track.title,
						artist: track.artist,
						artwork: [
							{
								src: track.thumbnail || "/placeholder.svg",
								sizes: "512x512",
							},
						],
					});

					navigator.mediaSession.setActionHandler("previoustrack", handlePlayPrevious);
					navigator.mediaSession.setActionHandler("nexttrack", handlePlayNext);
				}
			} catch (e) {}
		},
		[playTrack],
	);

	const handlePlayNext = useCallback(() => {
		if (queue.length === 0) return;
		const nextTrack = queue[0];
		setCurrentTrack(nextTrack);
		playTrack(nextTrack);
		setQueue((prev) => prev.slice(1));
	}, [queue, playTrack]);

	const handlePlayPrevious = useCallback(() => {
		if (currentTrack) {
			seek(0);
		}
	}, [currentTrack, seek]);

	const handleRemoveFromQueue = useCallback((index: number) => {
		setQueue((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const handleClearQueue = useCallback(() => {
		setQueue([]);
	}, []);

	// Auto-play next track when current ends
	useEffect(() => {
		if (duration > 0 && currentTime >= duration - 0.5 && currentTrack && queue.length > 0) {
			handlePlayNext();
		}
	}, [currentTime, duration, currentTrack, queue, handlePlayNext]);

	return (
		<div className='flex h-screen flex-col bg-background'>
			{/* Header */}
			<header className='border-b border-border bg-card/50 backdrop-blur-sm'>
				<div className='mx-auto max-w-7xl px-6 py-4 flex justify-between items-center'>
					<h1 className='text-2xl font-bold text-primary'>ZiMusic</h1>
					<div className='flex items-center gap-2'>
						{isChecking ?
							<span className='text-xs text-muted-foreground'>Checking backend...</span>
						: isHealthy ?
							<span className='flex items-center gap-1 text-xs text-green-500'>
								<span className='inline-block w-2 h-2 bg-green-500 rounded-full'></span>
								Connected
							</span>
						:	<span className='flex items-center gap-1 text-xs text-red-500'>
								<span className='inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse'></span>
								Disconnected
							</span>
						}
					</div>
				</div>
			</header>

			{!isHealthy && !isChecking && (
				<div className='bg-destructive/10 border-b border-destructive/20 px-6 py-4'>
					<div className='max-w-7xl mx-auto'>
						<h3 className='font-semibold text-destructive text-sm mb-1'>Backend Connection Error</h3>
						<p className='text-sm text-destructive/90 mb-2'>{healthError}</p>
						<button
							onClick={() => checkHealth()}
							className='rounded-lg bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/80 transition-colors text-sm'>
							Retry Connection
						</button>
					</div>
				</div>
			)}

			{/* Main Content */}
			<div className='flex flex-1 overflow-hidden'>
				{/* Sidebar Navigation (Desktop) */}
				<nav className='hidden md:block w-48 border-r border-border bg-card/30 p-4'>
					<div className='space-y-2'>
						{["now-playing", "queue", "search", "suggestions"].map((tab) => (
							<button
								key={tab}
								onClick={() => setCurrentTab(tab as typeof currentTab)}
								disabled={!isHealthy && tab === "search"}
								className={`w-full rounded-lg px-4 py-2 text-left transition-colors capitalize ${
									currentTab === tab ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
								} ${!isHealthy && tab === "search" ? "opacity-50 cursor-not-allowed" : ""}`}>
								{tab === "now-playing" ? "Now Playing" : tab.charAt(0).toUpperCase() + tab.slice(1)}
							</button>
						))}
					</div>

					<div className='mt-8 border-t border-border pt-4'>
						<p className='text-xs font-semibold text-muted-foreground mb-3'>QUEUE</p>
						<p className='text-sm text-foreground'>{queue.length} tracks</p>
					</div>
				</nav>

				{/* Main Panel */}
				<div className='flex-1 flex flex-col overflow-hidden'>
					<SearchBar
						onSearch={handleSearch}
						disabled={!isHealthy}
					/>

					{/* Error Display */}
					{error && (
						<div className='bg-destructive/10 border-b border-destructive/20 px-6 py-3'>
							<p className='text-sm text-destructive'>{error}</p>
						</div>
					)}

					{/* Content Area */}
					{/* <div className='flex-1 overflow-y-auto p-6'> */}
					<div className='flex-1 overflow-y-auto p-6 pb-20 md:pb-6'>
						{currentTab === "now-playing" && (
							<NowPlaying
								track={currentTrack}
								isPlaying={isPlaying}
								isLoading={isLoading}
								currentTime={currentTime}
								duration={duration}
								onDownload={downloadTrack}
								canDownload={canDownloadTrack()}
								isDownloading={isDownloading}
							/>
						)}
						{currentTab === "queue" && (
							<Queue
								tracks={queue}
								onRemove={handleRemoveFromQueue}
								onClear={handleClearQueue}
							/>
						)}
						{currentTab === "search" && (
							<SearchResults
								type='search'
								results={searchResults}
								onAddToQueue={handleAddToQueue}
								onPlay={handlePlayTrack}
								disabled={!isHealthy}
							/>
						)}
						{currentTab === "suggestions" && suggestions.length > 0 && (
							<SearchResults
								type='Suggestions'
								results={suggestions}
								onAddToQueue={handleAddToQueue}
								onPlay={handlePlayTrack}
								disabled={!isHealthy}
								Refresh={handleSearchSuggestions}
							/>
						)}
						{currentTab === "suggestions" && suggestions.length === 0 && (
							<div>
								<h2 className='text-xl font-bold text-foreground mb-4'>Suggestions</h2>
								<p className='text-muted-foreground'>No suggestions available. Play a track to get suggestions.</p>
								<button
									onClick={handleSearchSuggestions}
									// disabled={!currentTrack}
									className='mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-secondary transition-colors disabled:opacity-50'>
									Get Suggestions
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Bottom Player Controls */}
			<footer className='border-t border-border bg-card/50 backdrop-blur-sm p-4'>
				<div className='mx-auto max-w-7xl pb-15 md:pb-0'>
					{/* Progress Bar */}
					{currentTrack && (
						<div className='mb-4'>
							<input
								type='range'
								min='0'
								max={duration || 100}
								value={currentTime}
								aria-label='Playback position'
								onChange={(e) => seek(Number(e.target.value))}
								className='w-full h-1 accent-primary cursor-pointer'
							/>
							<div className='flex justify-between text-xs text-muted-foreground mt-1'>
								<span>{formatTime(currentTime)}</span>
								<span>{formatTime(duration)}</span>
							</div>
						</div>
					)}

					<div className='flex items-center justify-between gap-4'>
						<div className='flex-1 min-w-0'>
							{currentTrack ?
								<div className='truncate'>
									<p className='font-semibold text-foreground truncate'>{currentTrack.title}</p>
									<p className='text-sm text-muted-foreground truncate'>{currentTrack.artist}</p>
								</div>
							:	<p className='text-muted-foreground'>No track playing</p>}
						</div>

						{/* Playback Controls */}
						<div className='flex gap-2'>
							<button
								onClick={handlePlayPrevious}
								className='rounded-lg bg-muted p-2 hover:bg-primary transition-colors'
								title='Previous'>
								<SkipBack className='transform' />
							</button>
							<button
								onClick={togglePlayPause}
								disabled={isLoading || !currentTrack || !isHealthy}
								className='rounded-lg bg-primary p-2 text-primary-foreground hover:bg-secondary transition-colors disabled:opacity-50'
								title={isPlaying ? "Pause" : "Play"}>
								{isLoading ?
									<RefreshCw className='animate-spin' />
								: isPlaying ?
									<Pause />
								:	<Play />}
							</button>
							<button
								onClick={handlePlayNext}
								className='rounded-lg bg-muted p-2 hover:bg-primary transition-colors'
								title='Next'>
								<SkipForward className='transform' />
							</button>
						</div>

						{/* Volume Control */}
						<div className='flex items-center gap-2'>
							{/* <span className='text-xs text-muted-foreground'></span>
							 */}
							<Volume2 className='w-4 h-4 text-muted-foreground' />
							<input
								type='range'
								min='0'
								max='100'
								value={volume}
								onChange={(e) => setVolume(Number(e.target.value))}
								aria-label='Volume control'
								className='w-20 h-2 accent-primary cursor-pointer'
							/>
							<span className='text-xs text-muted-foreground w-8 text-right'>{volume}%</span>
						</div>
					</div>
				</div>
			</footer>
			{/* Bottom Navigation (Mobile) */}
			<nav className='fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/80 backdrop-blur md:hidden'>
				<div className='flex justify-around py-2'>
					<button
						onClick={() => setCurrentTab("now-playing")}
						className={`flex flex-col items-center gap-1 text-xs ${
							currentTab === "now-playing" ? "text-primary" : "text-muted-foreground"
						}`}>
						<Music className='w-5 h-5' />
						Now
					</button>

					<button
						onClick={() => setCurrentTab("queue")}
						className={`flex flex-col items-center gap-1 text-xs ${
							currentTab === "queue" ? "text-primary" : "text-muted-foreground"
						}`}>
						<List className='w-5 h-5' />
						Queue
					</button>

					<button
						onClick={() => setCurrentTab("search")}
						disabled={!isHealthy}
						className={`flex flex-col items-center gap-1 text-xs ${
							currentTab === "search" ? "text-primary" : "text-muted-foreground"
						} ${!isHealthy ? "opacity-50" : ""}`}>
						<Search className='w-5 h-5' />
						Search
					</button>
					<button
						onClick={() => setCurrentTab("suggestions")}
						className={`flex flex-col items-center gap-1 text-xs ${
							currentTab === "suggestions" ? "text-primary" : "text-muted-foreground"
						}`}>
						<RefreshCw className='w-5 h-5' />
						Suggestions
					</button>
				</div>
			</nav>
		</div>
	);
}

function formatTime(seconds: number): string {
	if (!seconds || isNaN(seconds)) return "0:00";
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}
