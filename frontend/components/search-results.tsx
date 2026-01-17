"use client";

import type { Track } from "./music-player";

interface SearchResultsProps {
	results: Track[];
	onAddToQueue: (track: Track) => void;
	onPlay: (track: Track) => void;
	disabled?: boolean;
}

export function SearchResults({ results, onAddToQueue, onPlay, disabled }: SearchResultsProps) {
	return (
		<div>
			<h2 className='text-xl font-bold text-foreground mb-4'>Search Results</h2>
			{results.length === 0 || disabled ? (
				<p className='text-muted-foreground'>No results found</p>
			) : (
				<div className='grid gap-3'>
					{results.map((track) => (
						<div
							key={track.id}
							className='flex items-center gap-4 rounded-lg bg-card p-4 hover:bg-muted transition-colors'>
							{/* <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex-shrink-0" /> */}
							<img
								src={track.thumbnail}
								alt={track.title ?? "Track thumbnail"}
								className='h-12 w-12 rounded-lg object-cover flex-shrink-0'
							/>
							<div className='flex-1 min-w-0'>
								<p className='font-semibold text-foreground truncate'>{track.title}</p>
								<p className='text-sm text-muted-foreground truncate'>{track.artist}</p>
								<p className='text-xs text-muted-foreground mt-1'>
									{track.source.toUpperCase()} • {formatDuration(track.duration)}
								</p>
							</div>
							<div className='flex gap-2'>
								<button
									onClick={() => onPlay(track)}
									className='rounded-lg bg-primary p-2 text-primary-foreground hover:bg-secondary transition-colors'
									title='Play'>
									▶
								</button>
								<button
									onClick={() => onAddToQueue(track)}
									className='rounded-lg bg-muted p-2 hover:bg-primary transition-colors text-foreground'
									title='Add to queue'>
									+
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}
