import windFarmCoordinatesRaw from "@/assets/coordinates/turbines_xy.json — 风机 XY + 经纬度.json — 风机 XY + 经纬度.json — 风机 XY + 经纬度?raw"
import type { WindFarmAsset } from "@/src/data/turbine-mock-data"

export const windFarmAssets = JSON.parse(windFarmCoordinatesRaw) as WindFarmAsset[]

export const turbineCoordinates = windFarmAssets.filter(({ name }) => name.includes("风机"))

export const substationCoordinates = windFarmAssets.find(({ name }) => name.includes("升压站"))

const turbinesByNumber = new Map<number, WindFarmAsset>()

turbineCoordinates.forEach((turbine) => {
  const turbineNumber = Number.parseInt(turbine.name, 10)
  if (Number.isFinite(turbineNumber)) turbinesByNumber.set(turbineNumber, turbine)
})

export function getTurbineByNumber(turbineNumber: number) {
  return turbinesByNumber.get(turbineNumber) ?? null
}

export const turbineNumberRange = turbineCoordinates.reduce(
  (range, turbine) => {
    const turbineNumber = Number.parseInt(turbine.name, 10)
    if (!Number.isFinite(turbineNumber)) return range
    return {
      min: Math.min(range.min, turbineNumber),
      max: Math.max(range.max, turbineNumber),
    }
  },
  { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
)
