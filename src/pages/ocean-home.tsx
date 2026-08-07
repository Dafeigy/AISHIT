import { MessageComposer } from "@/src/pages/message-composer"
import { OceanCanvas } from "@/src/pages/ocean-canvas"
import { useOceanInteraction } from "@/src/pages/ocean-interaction-context"
import { TurbineInfoDialog } from "@/src/pages/turbine-info-dialog"

export function OceanHome() {
  const { handleVoiceTranscript } = useOceanInteraction()

  return (
    <main className="pointer-events-none relative flex h-full min-h-0 w-full flex-1 overflow-hidden text-white">
      <MessageComposer onVoiceTranscript={handleVoiceTranscript} />
    </main>
  )
}

export function OceanBackground() {
  const { selectedTurbine, selectTurbine, setTurbineDialogOpen, turbineDialogOpen } =
    useOceanInteraction()

  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#b8d9de]">
        <OceanCanvas onTurbineSelect={selectTurbine} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_3%,rgba(255,248,219,0.24),transparent_32%),linear-gradient(180deg,rgba(226,246,246,0.12),transparent_42%,rgba(2,21,31,0.08))]" />
      </div>
      <TurbineInfoDialog
        open={turbineDialogOpen}
        onOpenChange={setTurbineDialogOpen}
        turbine={selectedTurbine}
      />
    </>
  )
}
