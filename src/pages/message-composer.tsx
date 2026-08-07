import { useCallback, useEffect, useRef, useState } from "react"
import {
  ChevronDownIcon,
  LoaderCircleIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
  SquareIcon,
} from "lucide-react"
import { toast } from "sonner"

import { useRecorder } from "@/hooks/use-recorder"

const iconButtonClass =
  "flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"

const HOLD_TO_TALK_DELAY_MS = 500

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

export function MessageComposer() {
  const [expanded, setExpanded] = useState(false)
  const [value, setValue] = useState("")
  const { status, recognizing, transcript, errorMessage, start, stop, toggle } = useRecorder()
  const isRecording = status === "recording"
  const isRequesting = status === "requesting"
  const pressTimer = useRef<number | null>(null)
  const spaceTimer = useRef<number | null>(null)
  const spaceHeld = useRef(false)
  const spaceShortcutActive = useRef(false)
  const longPress = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const clearPressTimer = () => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const handlePointerDown = () => {
    longPress.current = false
    clearPressTimer()
    pressTimer.current = window.setTimeout(() => {
      longPress.current = true
      setExpanded(true)
      toggle()
    }, 520)
  }

  const handlePointerUp = () => clearPressTimer()

  const handleTriggerClick = () => {
    if (longPress.current) {
      longPress.current = false
      return
    }
    setExpanded(true)
  }

  const send = useCallback((message: string, source: "text" | "voice" = "text") => {
    const text = message.trim()
    if (!text) return
    toast.success("消息已发送", {
      id: source === "voice" ? "voice-asr" : undefined,
      description: text,
    })
    setValue("")
    if (source === "voice") {
      window.requestAnimationFrame(() => textareaRef.current?.blur())
    }
  }, [])

  useEffect(() => clearPressTimer, [])

  useEffect(() => {
    const clearSpaceTimer = () => {
      if (spaceTimer.current === null) return
      window.clearTimeout(spaceTimer.current)
      spaceTimer.current = null
    }

    const releaseShortcut = () => {
      const wasActive = spaceShortcutActive.current
      spaceHeld.current = false
      spaceShortcutActive.current = false
      clearSpaceTimer()
      if (wasActive) void stop()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableTarget(event.target) ||
        spaceHeld.current ||
        recognizing
      ) {
        return
      }

      event.preventDefault()
      spaceHeld.current = true
      spaceTimer.current = window.setTimeout(() => {
        spaceTimer.current = null
        spaceShortcutActive.current = true
        setExpanded(true)
        void start().then((started) => {
          if (started && !spaceHeld.current) void stop()
        })
      }, HOLD_TO_TALK_DELAY_MS)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        (!spaceHeld.current && spaceTimer.current === null && !spaceShortcutActive.current)
      ) {
        return
      }
      event.preventDefault()
      releaseShortcut()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", releaseShortcut)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", releaseShortcut)
      releaseShortcut()
    }
  }, [recognizing, start, stop])

  useEffect(() => {
    if (!expanded) return
    const frame = window.requestAnimationFrame(() => textareaRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [expanded])

  useEffect(() => {
    if (transcript === null) return
    setValue(transcript)
    send(transcript, "voice")
  }, [send, transcript])

  return (
    <>
      <button
        type="button"
        aria-label="展开消息输入框（长按空格键语音输入）"
        title="长按空格键开始语音输入"
        aria-expanded={expanded}
        disabled={expanded}
        className={`group absolute bottom-5 left-1/2 z-[101] flex size-14 -translate-x-1/2 items-center justify-center rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-[0_16px_44px_rgba(15,23,42,0.3)] backdrop-blur-xl transition-[opacity,transform,background-color] duration-300 ease-out hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none sm:bottom-7 ${
          expanded
            ? "pointer-events-none translate-y-3 scale-75 opacity-0"
            : "pointer-events-auto translate-y-0 scale-100 opacity-100"
        }`}
        onClick={handleTriggerClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <SparklesIcon
          className="size-5 transition-transform duration-200 group-hover:rotate-12"
          aria-hidden="true"
        />
      </button>

      <section
        aria-hidden={!expanded}
        className={`absolute inset-x-3 bottom-4 z-[100] mx-auto max-w-4xl origin-bottom rounded-2xl border border-border/80 bg-background/90 p-3 text-foreground shadow-[0_20px_70px_rgba(15,23,42,0.24)] backdrop-blur-2xl transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none sm:inset-x-6 sm:bottom-6 sm:rounded-[22px] sm:p-4 ${
          expanded
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-6 scale-[0.96] opacity-0"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={3}
          disabled={!expanded}
          aria-label="消息内容"
          placeholder="请求批准，或使用语音输入"
          className="mb-2 block min-h-20 w-full resize-none bg-transparent px-1 py-1 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-100"
        />
        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" disabled={!expanded} aria-label="添加附件" className={iconButtonClass}>
            <PlusIcon className="size-5" aria-hidden="true" />
          </button>
          <button type="button" disabled={!expanded} aria-label="选择附件" className={iconButtonClass}>
            <PaperclipIcon className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={!expanded}
            className="ml-1 flex min-h-11 items-center gap-1 rounded-md px-2 text-xs text-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
          >
            5.6 Luna
            <ChevronDownIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              disabled={!expanded || recognizing || isRequesting}
              aria-label={
                isRecording
                  ? "结束录音"
                  : recognizing || isRequesting
                    ? "正在处理语音"
                    : "开始语音输入"
              }
              aria-pressed={isRecording}
              title="点击录音，或在非编辑区域长按空格键"
              className={`${iconButtonClass} ${
                isRecording ? "bg-destructive text-white hover:bg-destructive/90" : ""
              }`}
              onClick={toggle}
            >
              {recognizing || isRequesting ? (
                <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : isRecording ? (
                <SquareIcon className="size-4 fill-current" aria-hidden="true" />
              ) : (
                <MicIcon className="size-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              disabled={!expanded || isRecording || recognizing || !value.trim()}
              aria-label="发送消息"
              className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              onClick={() => send(value)}
            >
              <SendIcon className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={!expanded || isRequesting}
              aria-label="收起消息输入框"
              className={`${iconButtonClass} ml-1`}
              onClick={() => {
                if (isRecording) toggle()
                setExpanded(false)
              }}
            >
              <ChevronDownIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <p className="mt-2 min-h-4 px-1 text-xs text-muted-foreground" aria-live="polite">
          {isRecording
            ? "正在录音，松开空格键或点击停止（最长 60 秒）"
            : isRequesting
              ? "正在请求麦克风权限…"
            : recognizing
              ? "正在识别语音…"
              : errorMessage ?? "长按空格键说话，松开后将自动识别并发送。"}
        </p>
      </section>
    </>
  )
}
