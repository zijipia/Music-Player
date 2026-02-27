let audioCtx: AudioContext | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;

export function getAudioNodes(audio: HTMLAudioElement) {
	if (!audioCtx) {
		audioCtx = new AudioContext();
	}

	if (!sourceNode) {
		sourceNode = audioCtx.createMediaElementSource(audio);

		analyserNode = audioCtx.createAnalyser();
		analyserNode.fftSize = 256;
		analyserNode.smoothingTimeConstant = 0.8;

		sourceNode.connect(analyserNode);
		analyserNode.connect(audioCtx.destination);
	}

	return { audioCtx, analyserNode };
}
