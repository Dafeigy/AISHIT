import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { recognizeSpeech } from "@/lib/asr-client"

export type RecorderStatus = "idle" | "requesting" | "recording" | "error"

interface ActiveRecording {
  audioContext: AudioContext
  source: MediaStreamAudioSourceNode
  processor: ScriptProcessorNode
  stream: MediaStream
  chunks: Int16Array[]
  pending: number[]
  output: number[]
}

const SAMPLE_RATE = 16_000
const CHUNK_SIZE = 1024
const PROCESSOR_BUFFER_SIZE = 4096
const MAX_RECORDING_MS = 60_000
const MIN_RECORDING_SECONDS = 1
const TAIL_FLUSH_MS = 800

export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle")
  const [recognizing, setRecognizing] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const activeRef = useRef<ActiveRecording | null>(null)
  const startingRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)
  const mountedRef = useRef(true)

  const recognize = useCallback(async (pcm: Int16Array) => {
    setRecognizing(true)
    toast.loading("正在识别…", { id: "voice-asr" })
    try {
      const text = await recognizeSpeech(pcm)
      if (!mountedRef.current) return
      setTranscript(text)
      toast.success("识别完成，正在发送…", { id: "voice-asr" })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!mountedRef.current) return
      setErrorMessage(message)
      toast.error(message, { id: "voice-asr", duration: 10_000 })
    } finally {
      if (mountedRef.current) setRecognizing(false)
    }
  }, [])

  const stop = useCallback(
    async (reason: "manual" | "timeout" = "manual") => {
      const active = activeRef.current
      if (!active) return
      activeRef.current = null
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Keep the audio graph alive briefly so queued tail samples are not cut off.
      await new Promise((resolve) => window.setTimeout(resolve, TAIL_FLUSH_MS))
      active.processor.onaudioprocess = null
      active.source.disconnect()
      active.processor.disconnect()
      active.stream.getTracks().forEach((track) => track.stop())
      await active.audioContext.close()

      if (active.pending.length > 0) {
        const sum = active.pending.reduce((total, sample) => total + sample, 0)
        const sample = Math.max(-1, Math.min(1, sum / active.pending.length))
        active.output.push(Math.round(sample * 32_767))
      }

      const chunks = active.chunks.slice()
      if (active.output.length > 0) chunks.push(new Int16Array(active.output))
      const length = chunks.reduce((total, chunk) => total + chunk.length, 0)
      const pcm = new Int16Array(length)
      let offset = 0
      chunks.forEach((chunk) => {
        pcm.set(chunk, offset)
        offset += chunk.length
      })

      const tailSamples = Math.round(SAMPLE_RATE * (TAIL_FLUSH_MS / 1000))
      const duration = Math.max(0, pcm.length - tailSamples) / SAMPLE_RATE
      if (mountedRef.current) setStatus("idle")

      if (duration < MIN_RECORDING_SECONDS) {
        toast.warning(`录音过短（${duration.toFixed(2)} 秒），请说完后再停止。`)
        return
      }

      toast(
        reason === "timeout"
          ? "录音已达到 60 秒上限，正在自动识别。"
          : `录音完成（${duration.toFixed(2)} 秒），正在识别。`,
      )
      void recognize(pcm)
    },
    [recognize],
  )

  const start = useCallback(async (): Promise<boolean> => {
    if (startingRef.current || activeRef.current || recognizing) return false
    startingRef.current = true
    setStatus("requesting")
    setErrorMessage(null)
    setTranscript(null)

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("当前环境不支持麦克风录音。")
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(PROCESSOR_BUFFER_SIZE, 1, 1)
      const chunks: Int16Array[] = []
      const pending: number[] = []
      const output: number[] = []
      const ratio = Math.max(1, Math.round(audioContext.sampleRate / SAMPLE_RATE))

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0)
        for (const inputSample of input) {
          pending.push(inputSample)
          if (pending.length < ratio) continue
          let sum = 0
          for (let index = 0; index < ratio; index += 1) sum += pending[index]
          pending.splice(0, ratio)
          const sample = Math.max(-1, Math.min(1, sum / ratio))
          output.push(Math.round(sample * 32_767))
        }
        if (output.length >= CHUNK_SIZE) {
          chunks.push(new Int16Array(output.splice(0, CHUNK_SIZE)))
        }
      }

      source.connect(processor)
      processor.connect(audioContext.destination)
      await audioContext.resume()
      activeRef.current = { audioContext, source, processor, stream, chunks, pending, output }
      setStatus("recording")
      timeoutRef.current = window.setTimeout(() => void stop("timeout"), MAX_RECORDING_MS)
      return true
    } catch (error) {
      let message = error instanceof Error ? error.message : "录音失败：未知错误。"
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          message = "麦克风权限被拒绝，请允许麦克风访问后重试。"
        } else if (error.name === "NotFoundError") {
          message = "未检测到麦克风设备。"
        } else if (error.name === "NotReadableError") {
          message = "麦克风正被其他应用占用或不可用。"
        }
      }
      setErrorMessage(message)
      setStatus("error")
      toast.error(message)
      return false
    } finally {
      startingRef.current = false
    }
  }, [recognizing, stop])

  const toggle = useCallback(() => {
    if (status === "recording") void stop()
    else if (status !== "requesting" && !recognizing) void start()
  }, [recognizing, start, status, stop])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      const active = activeRef.current
      if (!active) return
      active.processor.onaudioprocess = null
      active.stream.getTracks().forEach((track) => track.stop())
      void active.audioContext.close()
      activeRef.current = null
    }
  }, [])

  return { status, recognizing, transcript, errorMessage, start, stop, toggle }
}
