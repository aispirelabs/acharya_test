import {
  createWorketFromSrc,
  registeredWorklets,
  WorkletGraph,
} from "./audioworklet-registry";

export class AudioStreamer {
  private sampleRate: number = 24000;
  private bufferSize: number = 7680;
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  private isStreamComplete: boolean = false;
  private checkInterval: number | null = null;
  private scheduledTime: number = 0;

  public gainNode: GainNode;
  private endOfQueueAudioSource: AudioBufferSourceNode | null = null;

  public onComplete: () => void = () => { };

  // Constants for timing and configuration
  private static readonly INITIAL_BUFFER_TIME_S: number = 0.1; // 100ms initial buffer
  private static readonly SCHEDULE_AHEAD_TIME_S: number = 0.2; // Schedule 200ms ahead
  private static readonly CHECK_INTERVAL_MS: number = 100; // Fallback check interval
  private static readonly SCHEDULE_TIMEOUT_ADJUST_MS: number = 50; // Wake up 50ms earlier for scheduling
  private static readonly GAIN_RAMP_DURATION_S: number = 0.1; // 100ms for gain fade out
  private static readonly GAIN_NODE_RESET_DELAY_MS: number =
    AudioStreamer.GAIN_RAMP_DURATION_S * 1000 + 100; // Delay for gain node reset

  constructor(public context: AudioContext) {
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
    this.addPCM16 = this.addPCM16.bind(this);
  }

  async addWorklet(
    workletName: string,
    workletSrc: string, // This should be the string definition of the AudioWorkletProcessor class
    handler: (this: MessagePort, ev: MessageEvent) => void
  ): Promise<this> {
    let workletsRecordMap = registeredWorklets.get(this.context);

    if (workletsRecordMap && workletsRecordMap[workletName]?.node) {
      // Worklet node already exists, add the new handler to its list
      workletsRecordMap[workletName].handlers.push(handler);
      console.warn(`Worklet ${workletName} already exists on context. Added new handler.`);
      return this;
    }

    if (!workletsRecordMap) {
      workletsRecordMap = {} as Record<string, WorkletGraph>;
      registeredWorklets.set(this.context, workletsRecordMap);
    }

    // Ensure entry for workletName exists to store handlers before attempting module addition
    if (!workletsRecordMap[workletName]) {
      workletsRecordMap[workletName] = { handlers: [] }; // Node will be added upon success
    }
    workletsRecordMap[workletName].handlers.push(handler);

    const blobUrl = createWorketFromSrc(workletName, workletSrc);
    try {
      await this.context.audioWorklet.addModule(blobUrl);
      const workletNode = new AudioWorkletNode(this.context, workletName);

      // Successfully created node, assign it to the record
      workletsRecordMap[workletName].node = workletNode;

      // Set up the message handler ONCE per worklet instance
      workletNode.port.onmessage = (ev: MessageEvent) => {
        const currentWorkletRecord = registeredWorklets.get(this.context)?.[workletName];
        if (currentWorkletRecord) {
          currentWorkletRecord.handlers.forEach((h) => {
            h.call(workletNode.port, ev); // Pass the full MessageEvent, 'this' is workletNode.port
          });
        }
      };
      // Note: Connection of workletNode to the audio graph happens during scheduleNextBuffer
    } catch (error) {
      console.error(`Failed to add or instantiate worklet ${workletName}:`, error);
      // Clean up: remove the handler that was just added, and if it's the last one,
      // remove the worklet entry, and if that's the last one, remove the context entry.
      if (workletsRecordMap && workletsRecordMap[workletName]) {
        workletsRecordMap[workletName].handlers = workletsRecordMap[workletName].handlers.filter(h => h !== handler);
        if (workletsRecordMap[workletName].handlers.length === 0) {
          delete workletsRecordMap[workletName];
          if (Object.keys(workletsRecordMap).length === 0) {
            registeredWorklets.delete(this.context);
          }
        }
      }
      throw error; // Re-throw the error so the caller is aware
    } finally {
      URL.revokeObjectURL(blobUrl); // Clean up blob URL regardless of success or failure
    }
    return this;
  }

  private _processPCM16Chunk(chunk: Uint8Array): Float32Array {
    if (chunk.length === 0) {
      return new Float32Array(0);
    }
    const float32Array = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);

    try {
      for (let i = 0; i < float32Array.length; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / 32768.0;
      }
    } catch (e) {
      console.error("Error processing PCM16 chunk:", e);
      return new Float32Array(0); // Return empty on error
    }
    return float32Array;
  }

  addPCM16(chunk: Uint8Array): void {
    this.isStreamComplete = false;
    const processedChunk = this._processPCM16Chunk(chunk);

    if (processedChunk.length === 0) {
      return;
    }

    let offset = 0;
    while (processedChunk.length - offset >= this.bufferSize) {
      const buffer = processedChunk.slice(offset, offset + this.bufferSize);
      this.audioQueue.push(buffer);
      offset += this.bufferSize;
    }

    if (processedChunk.length - offset > 0) {
      this.audioQueue.push(processedChunk.slice(offset));
    }

    if (!this.isPlaying && this.audioQueue.length > 0) {
      this.isPlaying = true;
      this.scheduledTime = this.context.currentTime + AudioStreamer.INITIAL_BUFFER_TIME_S;
      this.scheduleNextBuffer();
    } else if (this.isPlaying && this.audioQueue.length > 0 && this.checkInterval !== null) {
      if (this.checkInterval) clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.scheduleNextBuffer();
    }
  }

  private createAudioBuffer(audioData: Float32Array): AudioBuffer {
    const audioBuffer = this.context.createBuffer(
      1,
      audioData.length,
      this.sampleRate
    );
    audioBuffer.getChannelData(0).set(audioData);
    return audioBuffer;
  }

  private scheduleNextBuffer(): void {
    while (
      this.audioQueue.length > 0 &&
      this.scheduledTime < this.context.currentTime + AudioStreamer.SCHEDULE_AHEAD_TIME_S
    ) {
      const audioData = this.audioQueue.shift()!;
      const audioBuffer = this.createAudioBuffer(audioData);
      const sourceNode = this.context.createBufferSource();

      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.gainNode);

      const workletMap = registeredWorklets.get(this.context);
      if (workletMap) {
        Object.values(workletMap).forEach(workletRecord => {
          if (workletRecord.node) {
            sourceNode.connect(workletRecord.node);
            // Assuming worklet output is audio and should go to destination.
            // If worklet output needs different routing (e.g., through gainNode), adjust here.
            workletRecord.node.connect(this.context.destination);
          }
        });
      }

      if (this.audioQueue.length === 0) {
        if (this.endOfQueueAudioSource) {
          this.endOfQueueAudioSource.onended = null;
        }
        this.endOfQueueAudioSource = sourceNode;
        sourceNode.onended = () => {
          if (this.endOfQueueAudioSource === sourceNode && !this.audioQueue.length) {
            this.endOfQueueAudioSource = null;
            this.onComplete();
            if (this.isStreamComplete) {
              this.isPlaying = false;
            }
          }
        };
      }

      const startTime = Math.max(this.scheduledTime, this.context.currentTime);
      sourceNode.start(startTime);
      this.scheduledTime = startTime + audioBuffer.duration;
    }

    if (this.audioQueue.length === 0) {
      if (this.isStreamComplete) {
        this.isPlaying = false;
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
      } else {
        if (!this.checkInterval) {
          this.checkInterval = window.setInterval(() => {
            if (this.audioQueue.length > 0) {
              if (this.checkInterval) clearInterval(this.checkInterval);
              this.checkInterval = null;
              this.scheduleNextBuffer();
            }
          }, AudioStreamer.CHECK_INTERVAL_MS) as unknown as number;
        }
      }
    } else {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
      const timeUntilLastBufferEnds = (this.scheduledTime - this.context.currentTime) * 1000;
      const timeoutDuration = Math.max(
        0,
        timeUntilLastBufferEnds - AudioStreamer.SCHEDULE_TIMEOUT_ADJUST_MS
      );
      setTimeout(() => this.scheduleNextBuffer(), timeoutDuration);
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.isStreamComplete = true;
    this.audioQueue = [];

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.endOfQueueAudioSource) {
      this.endOfQueueAudioSource.onended = null;
      this.endOfQueueAudioSource = null;
    }

    this.gainNode.gain.cancelScheduledValues(this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.context.currentTime + AudioStreamer.GAIN_RAMP_DURATION_S
    );

    setTimeout(() => {
      if (this.context.state !== "closed") {
        this.gainNode.disconnect();
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
      }
    }, AudioStreamer.GAIN_NODE_RESET_DELAY_MS);
  }

  async resume(): Promise<void> {
    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.gainNode.gain.cancelScheduledValues(this.context.currentTime);
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);

    this.isStreamComplete = false;

    if (this.audioQueue.length > 0 && !this.isPlaying) {
      this.isPlaying = true;
      this.scheduledTime = this.context.currentTime + AudioStreamer.INITIAL_BUFFER_TIME_S;
      this.scheduleNextBuffer();
    } else if (!this.isPlaying) {
      this.scheduledTime = this.context.currentTime + AudioStreamer.INITIAL_BUFFER_TIME_S;
    }
  }

  complete(): void {
    this.isStreamComplete = true;
    if (this.audioQueue.length === 0 && !this.isPlaying) {
      this.onComplete();
    } else if (this.audioQueue.length === 0 && this.isPlaying) {
      if (!this.endOfQueueAudioSource) this.scheduleNextBuffer();
    }
  }
}