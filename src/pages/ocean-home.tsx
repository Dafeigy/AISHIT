import { MessageComposer } from "@/src/pages/message-composer"
import { OceanCanvas } from "@/src/pages/ocean-canvas"

export function OceanHome() {
  return (
    <main className="pointer-events-none relative flex h-full min-h-0 w-full flex-1 overflow-hidden text-white">
      <MessageComposer />
    </main>
  )
}

export function OceanBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#dceff1]">
      <OceanCanvas />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_4%,rgba(255,255,244,0.42),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(34,113,130,0.12))]" />
    </div>
  )
}
