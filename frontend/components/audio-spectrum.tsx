'use client';

import { useEffect, useRef, useState } from 'react';

type VisualizationType = 'draw' | 'bars' | 'comment';

interface AudioSpectrumProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  visualizationType?: VisualizationType;
}

export default function AudioSpectrum({
  audioRef,
  currentTime,
  duration,
  onSeek,
  visualizationType = 'draw',
}: AudioSpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();
  const dataArrayRef = useRef<Uint8Array>();
  const audioCtxRef = useRef<AudioContext>();

  useEffect(() => {
    if (!audioRef.current) return;

    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;

    const source = audioCtx.createMediaElementSource(audioRef.current);
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

    return () => {
      audioCtx.close();
    };
  }, [audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current || !dataArrayRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function drawSmoothWave(
      ctx: CanvasRenderingContext2D,
      data: Uint8Array,
      centerY: number,
      sliceWidth: number,
      scale: number
    ) {
      ctx.beginPath();

      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = centerY + (v - 1) * centerY * scale;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.quadraticCurveTo(x, y, x + sliceWidth, y);

        x += sliceWidth;
      }

      ctx.stroke();
    }

    const drawVisualization = () => {
      const analyser = analyserRef.current!;
      const dataArray = dataArrayRef.current!;
      const ctx = canvas.getContext('2d')!;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      if (visualizationType === 'draw') {
        // Smooth waveform draw visualization
        analyser.getByteTimeDomainData(dataArray);

        const sliceWidth = width / dataArray.length;

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
        gradient.addColorStop(0.35, 'rgba(255,220,170,0.95)');
        gradient.addColorStop(0.6, 'rgba(255,185,120,0.95)');
        gradient.addColorStop(1, 'rgba(255,255,255,0.9)');

        ctx.strokeStyle = gradient;

        // Glow layer
        ctx.lineWidth = 4;
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(255,210,150,0.9)';
        ctx.globalAlpha = 0.18;

        drawSmoothWave(ctx, dataArray, centerY, sliceWidth, 0.95);

        // Sharp layer
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = 1;

        drawSmoothWave(ctx, dataArray, centerY, sliceWidth, 0.85);
      } else if (visualizationType === 'bars') {
        // Frequency bars visualization
        analyser.getByteFrequencyData(dataArray);

        const barCount = 64;
        const step = Math.floor(dataArray.length / barCount);
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] / 255;
          const barHeight = value * (height * 0.85);

          const x = i * barWidth;

          const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
          gradient.addColorStop(0, 'rgba(255, 200, 120, 0.15)');
          gradient.addColorStop(0.5, 'rgba(255, 215, 150, 0.9)');
          gradient.addColorStop(1, 'rgba(255, 120, 100, 0.15)');

          ctx.fillStyle = gradient;

          const hue = (performance.now() / 40 + i * 3) % 360;
          ctx.shadowColor = `hsla(${hue},100%,70%,0.9)`;
          ctx.shadowBlur = 5;

          // Upper bar
          ctx.fillRect(x + 1, centerY - barHeight, barWidth - 2, barHeight);

          // Lower mirror bar
          ctx.fillRect(x + 1, centerY, barWidth - 2, barHeight);
        }
      } else if (visualizationType === 'comment') {
        // Minimal comment mode - just a thin line with circles
        analyser.getByteTimeDomainData(dataArray);

        const sliceWidth = width / dataArray.length;

        ctx.strokeStyle = 'rgba(255,215,150,0.7)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(255,210,150,0.5)';

        ctx.beginPath();
        let x = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0;
          const y = centerY + (v - 1) * centerY * 0.5;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          x += sliceWidth;
        }
        ctx.stroke();

        // Add subtle dots every 32 pixels
        ctx.fillStyle = 'rgba(255,215,150,0.4)';
        x = 0;
        for (let i = 0; i < dataArray.length; i += 8) {
          const v = dataArray[i] / 128.0;
          const y = centerY + (v - 1) * centerY * 0.5;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
          x += sliceWidth * 8;
        }
      }

      // Progress indicator
      if (duration > 0) {
        const px = (currentTime / duration) * width;
        ctx.strokeStyle = 'rgba(255,220,160,0.85)';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(drawVisualization);
    };

    drawVisualization();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentTime, duration, visualizationType]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || duration === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    onSeek((x / rect.width) * duration);
  };

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={60}
      onClick={handleClick}
      className="w-full h-full bg-transparent rounded-lg cursor-pointer"
    />
  );
}
