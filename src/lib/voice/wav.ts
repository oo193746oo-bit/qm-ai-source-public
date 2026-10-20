/**
 * 浏览器录音统一转为 16kHz / mono / PCM16 WAV。
 * 目的：消除 Chrome(WebM)、Safari(MP4) 等容器差异后再送 Coze ASR。
 * 仅在客户端调用。
 */

function downmixToMono(buffer: AudioBuffer): Float32Array {
  const length = buffer.length;
  const mono = new Float32Array(length);
  const channels = Math.max(1, buffer.numberOfChannels);
  for (let ch = 0; ch < channels; ch += 1) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i += 1) mono[i] += data[i] / channels;
  }
  return mono;
}

function resampleLinear(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i += 1) {
    const sourceIndex = i * ratio;
    const left = Math.floor(sourceIndex);
    const right = Math.min(left + 1, input.length - 1);
    const weight = sourceIndex - left;
    output[i] = input[left] * (1 - weight) + input[right] * weight;
  }
  return output;
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}

function encodePcm16Wav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const pcm = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, Math.round(pcm), true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export async function convertRecordingToWav(blob: Blob, targetRate = 16000, signal?: AbortSignal): Promise<Blob> {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") {
    throw new Error("当前浏览器不支持音频转换");
  }
  const context = new AudioContext();
  const closeOnAbort = () => { void context.close().catch(() => undefined); };
  signal?.addEventListener("abort", closeOnAbort, { once: true });
  try {
    if (signal?.aborted) throw new DOMException("音频转换已取消", "AbortError");
    const source = await blob.arrayBuffer();
    if (signal?.aborted) throw new DOMException("音频转换已取消", "AbortError");
    const decoded = await context.decodeAudioData(source.slice(0));
    if (signal?.aborted) throw new DOMException("音频转换已取消", "AbortError");
    const mono = downmixToMono(decoded);
    const resampled = resampleLinear(mono, decoded.sampleRate, targetRate);
    return encodePcm16Wav(resampled, targetRate);
  } finally {
    signal?.removeEventListener("abort", closeOnAbort);
    await context.close().catch(() => undefined);
  }
}
