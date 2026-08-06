export type WindFarmAsset = {
  name: string
  x: number
  y: number
  latitude: number
  longtitude: number
}

export type TurbineStatus = "运行正常" | "限功率运行" | "维护关注" | "停机检修"

export type TurbineMockData = {
  id: string
  name: string
  model: string
  location: string
  coordinates: string
  capacity: string
  commissionedAt: string
  status: TurbineStatus
  activePower: string
  rotorSpeed: string
  availability: string
  nacelleTemperature: string
  windSpeed: string
  windDirection: string
  windDirectionDegrees: number
  gustSpeed: string
  updatedAt: string
}

const WIND_DIRECTIONS = [
  "北",
  "东北偏北",
  "东北",
  "东北偏东",
  "东",
  "东南偏东",
  "东南",
  "东南偏南",
  "南",
  "西南偏南",
  "西南",
  "西南偏西",
  "西",
  "西北偏西",
  "西北",
  "西北偏北",
] as const

function seededValue(turbineNumber: number, salt: number) {
  const value = Math.sin(turbineNumber * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function getTurbineNumber(name: string) {
  const parsed = Number.parseInt(name, 10)
  return Number.isFinite(parsed) ? parsed : 1
}

function getStatus(turbineNumber: number): TurbineStatus {
  if (turbineNumber % 17 === 0) return "停机检修"
  if (turbineNumber % 11 === 0) return "维护关注"
  if (turbineNumber % 7 === 0) return "限功率运行"
  return "运行正常"
}

export function createTurbineMockData(asset: WindFarmAsset): TurbineMockData {
  const turbineNumber = getTurbineNumber(asset.name)
  const status = getStatus(turbineNumber)
  const windSpeed = 8.4 + seededValue(turbineNumber, 1) * 6.8
  const gustSpeed = windSpeed + 1.2 + seededValue(turbineNumber, 2) * 2.4
  const potentialPower = Math.min(8, 1.25 + Math.pow(windSpeed / 12.6, 3) * 5.9)
  const statusPowerFactor = status === "停机检修" ? 0 : status === "限功率运行" ? 0.68 : 1
  const activePower = potentialPower * statusPowerFactor
  const rotorSpeed = status === "停机检修" ? 0 : 7.2 + seededValue(turbineNumber, 3) * 4.6
  const availabilityBase = status === "停机检修" ? 91.8 : status === "维护关注" ? 96.4 : 98.2
  const availability = availabilityBase + seededValue(turbineNumber, 4) * 1.6
  const nacelleTemperature = 38 + seededValue(turbineNumber, 5) * 10.5
  const windDirectionDegrees = Math.round(seededValue(turbineNumber, 6) * 359)
  const directionIndex = Math.round(windDirectionDegrees / 22.5) % WIND_DIRECTIONS.length
  const commissionedMonth = ((turbineNumber * 5) % 12) + 1
  const commissionedDay = ((turbineNumber * 7) % 27) + 1

  return {
    id: `HF-${String(turbineNumber).padStart(2, "0")}`,
    name: asset.name,
    model: turbineNumber % 3 === 0 ? "WT-8.5-190" : "WT-8.0-180",
    location: `海风示范风场 · ${String(turbineNumber).padStart(2, "0")} 号机位`,
    coordinates: `${asset.latitude.toFixed(6)}°N, ${asset.longtitude.toFixed(6)}°E`,
    capacity: turbineNumber % 3 === 0 ? "8.5 MW" : "8.0 MW",
    commissionedAt: `2024-${String(commissionedMonth).padStart(2, "0")}-${String(commissionedDay).padStart(2, "0")}`,
    status,
    activePower: `${activePower.toFixed(2)} MW`,
    rotorSpeed: `${rotorSpeed.toFixed(1)} rpm`,
    availability: `${availability.toFixed(1)}%`,
    nacelleTemperature: `${nacelleTemperature.toFixed(1)} °C`,
    windSpeed: `${windSpeed.toFixed(1)} m/s`,
    windDirection: WIND_DIRECTIONS[directionIndex],
    windDirectionDegrees,
    gustSpeed: `${gustSpeed.toFixed(1)} m/s`,
    updatedAt: `${1 + (turbineNumber % 4)} 分钟前更新`,
  }
}
