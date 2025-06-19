import React, { useRef, useEffect, useCallback } from 'react';

export type AudioResponseSphereProps = {
  /** Current audio volume (0 to 1) */
  volume: number;
  /** Whether the audio input is active */
  active: boolean;
  /** Diameter of the sphere container in pixels */
  size?: number;
  /** Base RGB color string for the sphere (e.g., "20, 180, 190" for teal) */
  rgbColor?: string;
};

const AudioResponseSphere: React.FC<AudioResponseSphereProps> = ({
  volume,
  active,
  size = 128, // Default size
  rgbColor = "20, 180, 190", // Default teal-like color
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Refs to store the latest prop values for use in the animation loop
  // This avoids restarting the animation loop effect when these props change frequently
  const currentVolumeRef = useRef<number>(volume);
  const isActiveRef = useRef<boolean>(active);

  useEffect(() => {
    currentVolumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isActiveRef.current = active;
  }, [active]);

  const animationLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (canvas && ctx) {
      // Increment time for the animation effect
      // Adjust speed based on active state for a more dynamic feel or calmer idle
      timeRef.current += isActiveRef.current ? 0.02 : 0.008;

      drawSphere(
        ctx,
        canvas.width,
        canvas.height,
        currentVolumeRef.current,
        timeRef.current,
        rgbColor
      );
    }
    animationFrameIdRef.current = requestAnimationFrame(animationLoop);
  }, [rgbColor]); // rgbColor is a dependency because drawSphere uses it directly

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set canvas dimensions based on size prop
      // This is important for crisp rendering
      canvas.width = size;
      canvas.height = size;
    }

    // Start the animation loop
    animationFrameIdRef.current = requestAnimationFrame(animationLoop);

    return () => {
      // Cleanup: cancel the animation frame when the component unmounts or dependencies change
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [size, animationLoop]); // Rerun effect if size or the animationLoop itself changes (due to rgbColor)

  return (
    <div
      className="flex items-center justify-center pointer-events-none"
      style={{ width: size, height: size }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};


const drawSphere = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  currentVolume: number,
  time: number,
  rgbColorString: string
) => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  // Overall opacity and intensity based on active state and volume
  const baseOpacity = 0.8 + currentVolume * 0.3
  const intensityFactor = 1 + currentVolume * 0.5

  // --- Layer 1: Inner Core ---
  const coreBaseRadius = canvasWidth * 0.08
  const corePulseAmplitude = currentVolume * canvasWidth * 0.05
  const finalCoreRadius = coreBaseRadius + corePulseAmplitude;

  if (finalCoreRadius > 0) {
    const coreGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      finalCoreRadius
    );
    coreGradient.addColorStop(0, `rgba(${rgbColorString}, ${baseOpacity * 0.8 * intensityFactor})`);
    coreGradient.addColorStop(0.6, `rgba(${rgbColorString}, ${baseOpacity * 0.6 * intensityFactor})`);
    coreGradient.addColorStop(1, `rgba(${rgbColorString}, ${baseOpacity * 0.3 * intensityFactor})`);

    ctx.beginPath();
    ctx.arc(centerX, centerY, finalCoreRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();
  }

  // --- Layer 2: Outer Deforming Blob ---
  const blobBaseRadius = canvasWidth * 0.22 // Start further out
  const blobPulseAmplitude = currentVolume * canvasWidth * 0.30
  const effectiveBlobBaseRadius = blobBaseRadius + blobPulseAmplitude;

  // Deformation parameters
  const numDeformationPoints = 70; // More points for smoother deformation
  // Magnitude of deformation - more pronounced with volume and activity
  const deformationMagnitude = (canvasWidth * 0.015) + currentVolume * (canvasWidth * 0.15)

  // Frequency of "lobes" or waves - changes with volume for more dynamism
  const deformationFrequency1 = 4 + Math.floor(currentVolume * 4)
  const deformationFrequency2 = 2.5 + currentVolume * 2

  // Speed of the wave animation
  const timeFactor1 = time * 1.5
  const timeFactor2 = time * 1.0


  if (effectiveBlobBaseRadius > 0 && deformationMagnitude > 0) {
    ctx.beginPath();
    for (let i = 0; i <= numDeformationPoints; i++) {
      const angle = (i / numDeformationPoints) * Math.PI * 2;

      // Create a more organic, less regular noise pattern
      const noise =
        Math.sin(angle * deformationFrequency1 + timeFactor1) *
        Math.cos(angle * deformationFrequency2 - timeFactor2 * 0.7) *
        (0.8 + 0.2 * Math.sin(angle * (deformationFrequency1 / 3) + timeFactor1 * 1.2)); // Tertiary modulation

      const radius = effectiveBlobBaseRadius + noise * deformationMagnitude;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    const blobGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      effectiveBlobBaseRadius * 0.1, // Gradient starts from near the center of the blob
      centerX,
      centerY,
      effectiveBlobBaseRadius + deformationMagnitude // Gradient extends to the max reach of deformation
    );

    const outerLayerOpacity = 0.4 + currentVolume * 0.4;
    blobGradient.addColorStop(0, `rgba(${rgbColorString}, ${outerLayerOpacity * 0.7 * intensityFactor})`);
    blobGradient.addColorStop(0.7, `rgba(${rgbColorString}, ${outerLayerOpacity * 0.5 * intensityFactor})`);
    blobGradient.addColorStop(1, `rgba(${rgbColorString}, 0)`); // Fade to transparent

    ctx.fillStyle = blobGradient;
    ctx.fill();
  }
};
export default AudioResponseSphere;