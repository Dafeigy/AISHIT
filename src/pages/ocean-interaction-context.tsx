import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import type { WindFarmAsset } from "@/src/data/turbine-mock-data"
import { getTurbineByNumber, turbineNumberRange } from "@/src/data/wind-farm-assets"
import {
  parseVoiceInteractionCommand,
  type VoiceCommandExecution,
} from "@/src/interactions/voice-command"

type OceanInteractionContextValue = {
  selectedTurbine: WindFarmAsset | null
  turbineDialogOpen: boolean
  selectTurbine: (turbine: WindFarmAsset) => void
  setTurbineDialogOpen: (open: boolean) => void
  handleVoiceTranscript: (text: string) => VoiceCommandExecution | null
}

const OceanInteractionContext = createContext<OceanInteractionContextValue | null>(null)

export function OceanInteractionProvider({ children }: { children: ReactNode }) {
  const [turbineDialogOpen, setTurbineDialogOpen] = useState(false)
  const [selectedTurbine, setSelectedTurbine] = useState<WindFarmAsset | null>(null)
  const turbineDialogOpenRef = useRef(false)

  const changeTurbineDialogOpen = useCallback((open: boolean) => {
    turbineDialogOpenRef.current = open
    setTurbineDialogOpen(open)
  }, [])

  const selectTurbine = useCallback((turbine: WindFarmAsset) => {
    setSelectedTurbine(turbine)
    changeTurbineDialogOpen(true)
  }, [changeTurbineDialogOpen])

  const handleVoiceTranscript = useCallback(
    (text: string): VoiceCommandExecution | null => {
      const command = parseVoiceInteractionCommand(text)
      if (!command) return null

      if (command.name === "check_windturbine") {
        const turbine = getTurbineByNumber(command.arguments.turbineNo)
        if (!turbine) {
          return {
            command,
            status: "rejected",
            message: `未找到 ${command.arguments.turbineNo} 号风机，请输入 ${turbineNumberRange.min}–${turbineNumberRange.max} 之间的编号。`,
          }
        }

        selectTurbine(turbine)
        return {
          command,
          status: "executed",
          message: `已打开${turbine.name}概览。`,
        }
      }

      if (!turbineDialogOpenRef.current) {
        return {
          command,
          status: "noop",
          message: "当前没有打开的风机概览。",
        }
      }

      changeTurbineDialogOpen(false)
      return {
        command,
        status: "executed",
        message: "已关闭风机概览。",
      }
    },
    [changeTurbineDialogOpen, selectTurbine],
  )

  const value = useMemo(
    () => ({
      selectedTurbine,
      turbineDialogOpen,
      selectTurbine,
      setTurbineDialogOpen: changeTurbineDialogOpen,
      handleVoiceTranscript,
    }),
    [changeTurbineDialogOpen, handleVoiceTranscript, selectTurbine, selectedTurbine, turbineDialogOpen],
  )

  return <OceanInteractionContext.Provider value={value}>{children}</OceanInteractionContext.Provider>
}

export function useOceanInteraction() {
  const context = useContext(OceanInteractionContext)
  if (!context) throw new Error("useOceanInteraction must be used inside OceanInteractionProvider.")
  return context
}
