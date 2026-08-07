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

export function MessageComposer() {
  const [expanded, setExpanded] = useState(false)
  const [value, setValue] = useState("")
  const { status, recognizing, transcript, errorMessage, start, stop, toggle } = useRecorder({
    toastId: "composer-asr",
    successMessage: "识别完成，文字已填入输入框。",
  })
  const isRecording = status === "recording"
  const isRequesting = status === "requesting"
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const valueRef = useRef("")
  const voiceKeyHeldRef = useRef(false)
  const voiceShortcutActiveRef = useRef(false)
  const voiceHoldTimerRef = useRef<number | null>(null)

  const handleTriggerClick = () => {
    setExpanded(true)
  }

  const send = useCallback((message: string) => {
    const text = message.trim()
    if (!text) return
    toast.success("消息已发送", {
      description: text,
    })
    valueRef.current = ""
    setValue("")
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== "KeyM" ||
        !event.ctrlKey ||
        event.repeat ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey ||
        isRequesting
      ) {
        return
      }

      event.preventDefault()
      setExpanded((current) => {
        if (current && isRecording) void stop()
        return !current
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isRecording, isRequesting, stop])

  useEffect(() => {
    const clearVoiceHoldTimer = () => {
      if (voiceHoldTimerRef.current === null) return
      window.clearTimeout(voiceHoldTimerRef.current)
      voiceHoldTimerRef.current = null
    }

    const releaseVoiceShortcut = () => {
      const wasActive = voiceShortcutActiveRef.current
      voiceKeyHeldRef.current = false
      voiceShortcutActiveRef.current = false
      clearVoiceHoldTimer()
      if (wasActive) void stop()
    }

    const handleVoiceKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement)

      if (
        event.code !== "KeyV" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isEditable
      ) {
        return
      }

      event.preventDefault()
      if (event.repeat || voiceKeyHeldRef.current) return
      voiceKeyHeldRef.current = true
      voiceHoldTimerRef.current = window.setTimeout(() => {
        voiceHoldTimerRef.current = null
        voiceShortcutActiveRef.current = true
        void start().then((started) => {
          if (started && !voiceKeyHeldRef.current) void stop()
        })
      }, 500)
    }

    const handleVoiceKeyUp = (event: KeyboardEvent) => {
      if (
        event.code !== "KeyV" ||
        (!voiceKeyHeldRef.current &&
          voiceHoldTimerRef.current === null &&
          !voiceShortcutActiveRef.current)
      ) {
        return
      }
      event.preventDefault()
      releaseVoiceShortcut()
    }

    window.addEventListener("keydown", handleVoiceKeyDown)
    window.addEventListener("keyup", handleVoiceKeyUp)
    window.addEventListener("blur", releaseVoiceShortcut)
    return () => {
      window.removeEventListener("keydown", handleVoiceKeyDown)
      window.removeEventListener("keyup", handleVoiceKeyUp)
      window.removeEventListener("blur", releaseVoiceShortcut)
      releaseVoiceShortcut()
    }
  }, [start, stop])

  useEffect(() => {
    if (!expanded) return
    const frame = window.requestAnimationFrame(() => textareaRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [expanded])

  useEffect(() => {
    if (transcript === null) return
    setExpanded(true)
    const textarea = textareaRef.current
    const current = valueRef.current
    const selectionStart = Math.min(textarea?.selectionStart ?? current.length, current.length)
    const selectionEnd = Math.min(textarea?.selectionEnd ?? selectionStart, current.length)
    const nextValue = `${current.slice(0, selectionStart)}${transcript}${current.slice(selectionEnd)}`
    const nextCaretPosition = selectionStart + transcript.length
    valueRef.current = nextValue
    setValue(nextValue)
    const frame = window.requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(nextCaretPosition, nextCaretPosition)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [transcript])

  return (
    <>
      <button
        type="button"
        aria-label="展开消息输入框（Ctrl+M）"
        title="展开消息输入框（Ctrl+M）"
        aria-expanded={expanded}
        disabled={expanded}
        className={`group absolute bottom-5 left-1/2 z-[101] flex h-11 -translate-x-1/2 items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary px-4 text-primary-foreground shadow-[0_12px_32px_rgba(15,23,42,0.26)] backdrop-blur-xl transition-[opacity,transform,background-color] duration-300 ease-out hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none sm:bottom-7 ${
          expanded
            ? "pointer-events-none translate-y-2 scale-90 opacity-0"
            : "pointer-events-auto translate-y-0 scale-100 opacity-100"
        }`}
        onClick={handleTriggerClick}
      >
        <SparklesIcon
          className="size-4 shrink-0 transition-transform duration-200 group-hover:rotate-12"
          aria-hidden="true"
        />
        <span className="whitespace-nowrap text-xs font-medium" aria-live="polite">
          {isRecording
            ? "正在录音，松开 V 识别"
            : isRequesting
              ? "正在请求麦克风权限…"
              : recognizing
                ? "正在识别语音…"
                : "输入消息 · 按住 V 说话"}
        </span>
      </button>

      <section
        aria-hidden={!expanded}
        data-expanded={expanded}
        className={`composer-panel absolute inset-x-3 bottom-4 z-[100] mx-auto max-w-4xl origin-bottom rounded-2xl border border-border/80 bg-background/90 p-3 text-foreground shadow-[0_20px_70px_rgba(15,23,42,0.24)] backdrop-blur-2xl motion-reduce:transition-none sm:inset-x-6 sm:bottom-6 sm:rounded-[22px] sm:p-4 ${
          expanded
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            valueRef.current = event.target.value
            setValue(event.target.value)
          }}
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
              title="点击开始或停止语音输入"
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
            ? "正在录音，点击麦克风停止（最长 60 秒）"
            : isRequesting
              ? "正在请求麦克风权限…"
            : recognizing
              ? "正在识别语音…"
              : errorMessage ?? "点击麦克风转写到输入框；Ctrl+M 展开或收起。"}
        </p>
      </section>
    </>
  )
}
