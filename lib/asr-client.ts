import { encodeWav, padTrailingSilence } from "@/lib/wav-encoder"

const ASR_ENDPOINT = "/asr"
const SAMPLE_RATE = 16_000
const TRAILING_SILENCE_MS = 400
const MOCK_TEXT = "（模拟识别）这是一段测试语音。"

const appKey = import.meta.env.VITE_ALIYUN_APPKEY ?? ""
const token = import.meta.env.VITE_ALIYUN_TOKEN ?? ""
const useMock = import.meta.env.VITE_ASR_MOCK === "true"

export async function recognizeSpeech(pcm: Int16Array): Promise<string> {
  if (useMock) {
    await new Promise((resolve) => window.setTimeout(resolve, 600))
    return MOCK_TEXT
  }

  if (!appKey || !token) {
    throw new Error(
      "未配置阿里云凭据，请检查 VITE_ALIYUN_APPKEY 和 VITE_ALIYUN_TOKEN。",
    )
  }

  const audio = encodeWav(
    padTrailingSilence(pcm, SAMPLE_RATE, TRAILING_SILENCE_MS),
    SAMPLE_RATE,
  )
  const query = new URLSearchParams({
    appkey: appKey,
    format: "wav",
    sample_rate: String(SAMPLE_RATE),
    enable_punctuation_prediction: "true",
  })

  let response: Response
  try {
    response = await fetch(`${ASR_ENDPOINT}?${query}`, {
      method: "POST",
      headers: {
        "Content-Type": "audio/wav",
        "X-NLS-Token": token,
      },
      body: audio,
    })
  } catch {
    throw new Error("网络异常，无法连接语音识别服务，请检查网络后重试。")
  }

  if (!response.ok) {
    throw new Error(`语音识别服务返回 HTTP ${response.status}。`)
  }

  const result = (await response.json()) as {
    status?: number
    message?: string
    result?: unknown
  }

  if (result.status === 40_000_000) {
    throw new Error("语音识别免费试用已过期（40000000），请检查服务状态。")
  }
  if (result.status !== 20_000_000 || result.message !== "SUCCESS") {
    throw new Error(
      `语音识别失败（status=${result.status ?? "未知"}，message=${result.message ?? "未知"}）。`,
    )
  }

  const text = String(result.result ?? "").trim()
  if (!text) {
    throw new Error("语音识别未返回文字，录音可能过短或没有有效语音。")
  }
  return text
}
