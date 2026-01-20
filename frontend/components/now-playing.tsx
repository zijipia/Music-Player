import type { Track } from "./music-player";
// import "./now-playing.css";
import { ArrowDownToLine, RefreshCw } from "lucide-react";

interface NowPlayingProps {
	track: Track | null;
	isPlaying: boolean;
	isLoading: boolean;
	currentTime: number;
	duration: number;
	onDownload?: () => void;
	canDownload?: boolean;
	isDownloading?: boolean;
}

export function NowPlaying({
	track,
	isPlaying,
	isLoading,
	currentTime,
	duration,
	onDownload,
	canDownload,
	isDownloading,
}: NowPlayingProps) {
	return (
		<div className='flex flex-col items-center justify-center py-12'>
			{track ?
				<div className='w-full max-w-sm text-center'>
					<div className='mb-6 h-64 w-full rounded-xl shadow-2xl overflow-hidden'>
						{track.thumbnail ?
							<img
								src={track.thumbnail || "/placeholder.svg"}
								alt={track.title}
								className='w-full h-full object-cover'
							/>
						:	<div className='w-full h-full bg-gradient-to-br from-primary via-secondary to-accent' />}
					</div>
					<h2 className='text-2xl font-bold text-foreground text-balance'>{track.title}</h2>
					<p className='text-muted-foreground mt-1'>{track.artist}</p>
					<p className='text-sm text-accent mt-2'>{track.source.toUpperCase()}</p>
					{isLoading && (
						<div className='mt-6'>
							<p className='text-sm text-muted-foreground'>Loading...</p>
						</div>
					)}
					{isPlaying && !isLoading && (
						<div className='mt-6 flex items-center justify-center gap-1'>
							<span className='inline-block w-1 h-8 bg-primary animate-bounce delay-0' />
							<span className='inline-block w-1 h-6 bg-primary animate-bounce delay-200' />
							<span className='inline-block w-1 h-8 bg-primary animate-bounce delay-400' />
						</div>
					)}
					<button
						onClick={onDownload}
						disabled={!canDownload}
						className='mt-8 rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-secondary transition-colors font-semibold'
						title='Download current track'>
						{isDownloading ?
							<RefreshCw className='animate-spin' />
						:	<ArrowDownToLine />}
					</button>
				</div>
			:	<div className='text-center'>
					<div className='mb-4 h-48 w-48 rounded-xl bg-muted' />
					<p className='text-xl text-muted-foreground'>Select a track to play</p>
				</div>
			}
		</div>
	);
}
