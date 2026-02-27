import { useRef, useEffect } from "react";
import AudioSpectrum from "./audio-spectrum";
import { useHealthCheck } from "@/hooks/use-health-check";

interface HeaderProps {
	audioElement?: HTMLAudioElement | null;
	isPlaying: boolean;
	isLoading: boolean;
}

export function Header({ audioElement, isPlaying, isLoading }: HeaderProps) {
	const audioRef = useRef<HTMLAudioElement | null>(audioElement || null);
	const { isHealthy, isChecking } = useHealthCheck();

	// Update the ref when audioElement changes
	useEffect(() => {
		if (audioElement) {
			audioRef.current = audioElement;
		}
	}, [audioElement]);

	return (
		<header className='border-b border-border bg-card/50 backdrop-blur-sm'>
			<div className='mx-auto max-w-7xl px-6 py-4 flex justify-between items-center'>
				<h1 className='text-2xl font-bold text-primary'>ZiMusic</h1>

				{isPlaying && !isLoading && (
					<div className=''>
						<div className='w-full '>
							<AudioSpectrum
								audioRef={audioRef as any}
								currentTime={0}
								duration={0}
								onSeek={() => {}}
								visualizationType='draw'
							/>
						</div>
					</div>
				)}
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
	);
}
