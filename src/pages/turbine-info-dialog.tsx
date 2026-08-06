import {
  ActivityIcon,
  CalendarDaysIcon,
  CompassIcon,
  GaugeIcon,
  MapPinIcon,
  NavigationIcon,
  ThermometerIcon,
  WindIcon,
  ZapIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  createTurbineMockData,
  type TurbineStatus,
  type WindFarmAsset,
} from "@/src/data/turbine-mock-data"

type TurbineInfoDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  turbine: WindFarmAsset | null
}
type MetricProps = { icon: typeof ActivityIcon; label: string; value: string; accent?: boolean }

const STATUS_STYLES: Record<TurbineStatus, string> = {
  运行正常: "border-emerald-300/25 bg-emerald-400/15 text-emerald-100",
  限功率运行: "border-amber-300/25 bg-amber-400/15 text-amber-100",
  维护关注: "border-orange-300/25 bg-orange-400/15 text-orange-100",
  停机检修: "border-rose-300/25 bg-rose-400/15 text-rose-100",
}

const STATUS_DOT_STYLES: Record<TurbineStatus, string> = {
  运行正常: "bg-emerald-300",
  限功率运行: "bg-amber-300",
  维护关注: "bg-orange-300",
  停机检修: "bg-rose-300",
}

function Metric({ icon: Icon, label, value, accent = false }: MetricProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/55 p-3">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${accent ? "bg-cyan-500/12 text-cyan-700" : "bg-background text-muted-foreground"}`}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

export function TurbineInfoDialog({ open, onOpenChange, turbine }: TurbineInfoDialogProps) {
  if (!turbine) return null

  const mockTurbine = createTurbineMockData(turbine)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="border-b bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 px-5 py-5 pr-14 text-white sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={STATUS_STYLES[mockTurbine.status]}>
              <span className={`size-1.5 rounded-full ${STATUS_DOT_STYLES[mockTurbine.status]}`} aria-hidden="true" />
              {mockTurbine.status}
            </Badge>
            <span className="text-xs text-slate-300">{mockTurbine.updatedAt}</span>
          </div>
          <DialogTitle className="mt-3 text-xl text-white sm:text-2xl">{mockTurbine.name}</DialogTitle>
          <DialogDescription className="text-slate-300">{mockTurbine.id} · {mockTurbine.model}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 p-4 sm:p-6">
          <section aria-labelledby="turbine-overview-heading">
            <h3 id="turbine-overview-heading" className="mb-3 text-sm font-semibold">基本概况</h3>
            <Card size="sm" className="gap-0 py-0 shadow-none">
              <CardContent className="grid gap-0 px-0 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-4">
                  <MapPinIcon className="mt-0.5 size-4 shrink-0 text-cyan-700" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted-foreground">安装位置</p>
                    <p className="mt-1 text-sm font-medium">{mockTurbine.location}</p>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">{mockTurbine.coordinates}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-t p-4 sm:border-t-0 sm:border-l">
                  <CalendarDaysIcon className="mt-0.5 size-4 shrink-0 text-cyan-700" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted-foreground">投运日期</p>
                    <p className="mt-1 text-sm font-medium tabular-nums">{mockTurbine.commissionedAt}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="turbine-operation-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 id="turbine-operation-heading" className="text-sm font-semibold">运行情况</h3>
              <span className="text-xs text-muted-foreground">额定容量 {mockTurbine.capacity}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric icon={ZapIcon} label="当前功率" value={mockTurbine.activePower} accent />
              <Metric icon={GaugeIcon} label="叶轮转速" value={mockTurbine.rotorSpeed} />
              <Metric icon={ActivityIcon} label="可利用率" value={mockTurbine.availability} />
              <Metric icon={ThermometerIcon} label="机舱温度" value={mockTurbine.nacelleTemperature} />
            </div>
          </section>

          <Separator />

          <section aria-labelledby="turbine-wind-heading">
            <h3 id="turbine-wind-heading" className="mb-3 text-sm font-semibold">风况信息</h3>
            <div className="grid gap-3 sm:grid-cols-[1.25fr_1fr]">
              <div className="flex items-center justify-between rounded-xl border bg-cyan-50/60 p-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-cyan-800">
                    <WindIcon className="size-4" aria-hidden="true" />实时风速
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums">{mockTurbine.windSpeed}</p>
                  <p className="mt-1 text-xs text-slate-600">阵风 {mockTurbine.gustSpeed}</p>
                </div>
                <div className="flex size-16 items-center justify-center rounded-full border border-cyan-200 bg-white shadow-sm">
                  <NavigationIcon className="size-7 text-cyan-700" style={{ transform: `rotate(${mockTurbine.windDirectionDegrees}deg)` }} aria-hidden="true" />
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <CompassIcon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">风向</p>
                  <p className="mt-1 text-sm font-semibold">{mockTurbine.windDirection}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{mockTurbine.windDirectionDegrees}°</p>
                </div>
              </div>
            </div>
          </section>

          <p className="text-center text-xs text-muted-foreground">当前为演示数据，后续可接入风机实时监测接口。</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
