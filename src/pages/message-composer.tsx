import { useEffect, useRef, useState } from "react"
import {
  ChevronDownIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react"

const iconButtonClass =
  "flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"

export function MessageComposer() {
  const [expanded, setExpanded] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const pressTimer = useRef<number | null>(null)
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
      setVoiceActive(true)
    }, 520)
  }

  const handlePointerUp = () => clearPressTimer()

  const handleTriggerClick = () => {
    if (longPress.current) {
      longPress.current = false
      return
    }
    setExpanded(true)
    setVoiceActive(false)
  }

  useEffect(() => clearPressTimer, [])

  useEffect(() => {
    if (!expanded) return
    const frame = window.requestAnimationFrame(() => textareaRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [expanded])

  return (
    <>
      <button
        type="button"
        aria-label="展开消息输入框"
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
          rows={3}
          disabled={!expanded}
          aria-label="消息内容"
          placeholder="请求批准"
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
            className="ml-1 flex min-h-9 items-center gap-1 rounded-md px-2 text-xs text-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
          >
            5.6 Luna
            <ChevronDownIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              disabled={!expanded}
              aria-label="语音输入（暂未启用）"
              className={`${iconButtonClass} ${voiceActive ? "bg-primary/10 text-primary" : ""}`}
              onClick={() => setVoiceActive((active) => !active)}
            >
              <MicIcon className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={!expanded}
              aria-label="发送消息"
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
            >
              <SendIcon className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={!expanded}
              aria-label="收起消息输入框"
              className={`${iconButtonClass} ml-1`}
              onClick={() => {
                setExpanded(false)
                setVoiceActive(false)
              }}
            >
              <ChevronDownIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        {voiceActive && (
          <p className="mt-2 text-xs text-primary/80">
            长按语音按钮即可开始语音输入（功能即将上线）
          </p>
        )}
      </section>
    </>
  )
}
