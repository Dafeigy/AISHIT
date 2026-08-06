import { useState } from "react"

import type { WindFarmAsset } from "@/src/data/turbine-mock-data"
import { MessageComposer } from "@/src/pages/message-composer"
import { OceanCanvas } from "@/src/pages/ocean-canvas"
import { TurbineInfoDialog } from "@/src/pages/turbine-info-dialog"

export function OceanHome() {
  return (
    <main className="pointer-events-none relative flex h-full min-h-0 w-full flex-1 overflow-hidden text-white">
      <MessageComposer />
    </main>
  )
}

export function OceanBackground() {
  const [turbineDialogOpen, setTurbineDialogOpen] = useState(false)
  const [selectedTurbine, setSelectedTurbine] = useState<WindFarmAsset | null>(null)

  const handleTurbineSelect = (turbine: WindFarmAsset) => {
    setSelectedTurbine(turbine)
    setTurbineDialogOpen(true)
  }

  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#b8d9de]">
        <OceanCanvas onTurbineSelect={handleTurbineSelect} />
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
