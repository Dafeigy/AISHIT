export type VoiceInteractionCommand =
  | {
      name: "check_windturbine"
      arguments: {
        turbineNo: number
      }
    }
  | {
      name: "close_dialog"
      arguments: Record<string, never>
    }

export type VoiceCommandExecution = {
  command: VoiceInteractionCommand
  status: "executed" | "rejected" | "noop"
  message: string
}

export const MIN_VOICE_TURBINE_NUMBER = 1
export const MAX_VOICE_TURBINE_NUMBER = 55

const CHINESE_DIGITS: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
}

function parseChineseInteger(value: string) {
  if (/^\d+$/.test(value)) return Number(value)

  if (!/^[零〇一二两三四五六七八九十百]+$/.test(value)) return null

  let total = 0
  let currentDigit = 0

  for (const character of value) {
    if (character in CHINESE_DIGITS) {
      currentDigit = CHINESE_DIGITS[character]
      continue
    }

    const unit = character === "百" ? 100 : 10
    total += (currentDigit || 1) * unit
    currentDigit = 0
  }

  return total + currentDigit
}

function normalizeTranscript(text: string) {
  return text
    .trim()
    .replace(/[，。！？、,.!?]/g, "")
    .replace(/\s+/g, "")
}

export function parseVoiceInteractionCommand(text: string): VoiceInteractionCommand | null {
  const normalized = normalizeTranscript(text)
  if (!normalized) return null

  const hasCloseAction = /(关闭|关掉|收起)/.test(normalized)
  const hasDialogTarget = /(窗口|概览|弹窗|对话框|详情)/.test(normalized)
  const isStandaloneClose = /^(请)?(关闭|关掉|收起)(一下|吧)?$/.test(normalized)

  if (hasCloseAction && (hasDialogTarget || isStandaloneClose)) {
    return {
      name: "close_dialog",
      arguments: {},
    }
  }

  if (!/(查看|打开|显示|看看|看一下)/.test(normalized)) return null

  const turbineMatch = normalized.match(
    /(?:第)?([0-9零〇一二两三四五六七八九十百]+)(?:号)?风机(?:的信息|信息|的概览|概览|的详情|详情)?/,
  )
  if (!turbineMatch) return null

  const turbineNo = parseChineseInteger(turbineMatch[1])
  if (turbineNo === null || !Number.isSafeInteger(turbineNo)) return null

  return {
    name: "check_windturbine",
    arguments: { turbineNo },
  }
}
