import { useEffect, useRef } from "react"
import { LoaderCircleIcon, MicIcon } from "lucide-react"
import { toast } from "sonner"

import { useRecorder } from "@/hooks/use-recorder"

const HOLD_DELAY_MS = 500
const TOAST_ID = "push-to-talk-asr"

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

export function VoicePushToTalk() {
  const { status, recognizing, transcript, start, stop } = useRecorder({
    toastId: TOAST_ID,
    successMessage: null,
  })
  const holdTimer = useRef<number | null>(null)
  const keyHeld = useRef(false)
  const shortcutActive = useRef(false)
  const isRecording = status === "recording"
  const isRequesting = status === "requesting"

  useEffect(() => {
    const clearHoldTimer = () => {
      if (holdTimer.current === null) return
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }

    const release = () => {
      const wasActive = shortcutActive.current
      keyHeld.current = false
      shortcutActive.current = false
      clearHoldTimer()
      if (wasActive) void stop()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== "KeyV" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isEditableTarget(event.target)
      ) {
        return
      }

      event.preventDefault()
      if (event.repeat || keyHeld.current) return
      keyHeld.current = true
      holdTimer.current = window.setTimeout(() => {
        holdTimer.current = null
        shortcutActive.current = true
        void start().then((started) => {
          if (started && !keyHeld.current) void stop()
        })
      }, HOLD_DELAY_MS)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        event.code !== "KeyV" ||
        (!keyHeld.current && holdTimer.current === null && !shortcutActive.current)
      ) {
        return
      }
      event.preventDefault()
      release()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", release)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", release)
      release()
    }
  }, [start, stop])

  useEffect(() => {
    if (transcript === null) return
    toast.success("语音识别结果", {
      id: TOAST_ID,
      description: transcript,
      duration: 10_000,
    })
  }, [transcript])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`absolute right-4 bottom-4 z-[99] flex items-center gap-2 rounded-full border px-3 py-2 text-xs shadow-lg backdrop-blur-xl transition-[opacity,transform,background-color] duration-200 motion-reduce:transition-none sm:right-6 sm:bottom-6 ${
        isRecording
          ? "border-destructive/40 bg-destructive text-white"
          : "border-border/80 bg-background/80 text-muted-foreground"
      }`}
    >
      {recognizing || isRequesting ? (
        <LoaderCircleIcon
          className="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        <MicIcon className="size-4" aria-hidden="true" />
      )}
      <span>
        {isRecording
          ? "正在录音，松开 V 识别"
          : isRequesting
            ? "正在请求麦克风权限…"
            : recognizing
              ? "正在识别语音…"
              : "按住 V 说话"}
      </span>
    </div>
  )
}
