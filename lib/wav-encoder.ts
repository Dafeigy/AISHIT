/** Add trailing silence so the ASR engine can reliably detect the sentence end. */
export function padTrailingSilence(
  pcm: Int16Array,
  sampleRate: number,
  durationMs: number,
): Int16Array {
  const silenceLength = Math.round(sampleRate * (durationMs / 1000))
  const padded = new Int16Array(pcm.length + silenceLength)
  padded.set(pcm)
  return padded
}

/** Encode mono 16-bit PCM as a WAV blob. */
export function encodeWav(pcm: Int16Array, sampleRate: number): Blob {
  const bytesPerSample = 2
  const dataSize = pcm.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  writeAscii(view, 0, "RIFF")
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(view, 8, "WAVE")
  writeAscii(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true)
  view.setUint16(32, bytesPerSample, true)
  view.setUint16(34, 16, true)
  writeAscii(view, 36, "data")
  view.setUint32(40, dataSize, true)
  new Int16Array(buffer, 44).set(pcm)

  return new Blob([buffer], { type: "audio/wav" })
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index))
  }
}
