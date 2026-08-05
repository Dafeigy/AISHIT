import { useEffect, useRef } from "react"
import * as THREE from "three"

const PERMUTATION = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
  140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247,
  120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57,
  177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
  74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229,
  122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102,
  143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89,
  18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173,
  186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255,
  82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223,
  183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155,
  167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
  178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144,
  12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192,
  214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127,
  4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141,
  128, 195, 78, 66, 215, 61, 156, 180,
]
const GRADIENTS = PERMUTATION.concat(PERMUTATION)

function fade(value: number) {
  return value * value * value * (value * (value * 6 - 15) + 10)
}

function lerp(a: number, b: number, amount: number) {
  return a + amount * (b - a)
}

function gradient(hash: number, x: number, y: number) {
  switch (hash & 3) {
    case 0:
      return x + y
    case 1:
      return -x + y
    case 2:
      return x - y
    default:
      return -x - y
  }
}

function perlinNoise(x: number, y: number) {
  const cellX = Math.floor(x) & 255
  const cellY = Math.floor(y) & 255
  const localX = x - Math.floor(x)
  const localY = y - Math.floor(y)
  const fadeX = fade(localX)
  const fadeY = fade(localY)
  const top = cellY + GRADIENTS[cellX]
  const bottom = cellY + 1 + GRADIENTS[cellX]
  const topRight = cellY + GRADIENTS[cellX + 1]
  const bottomRight = cellY + 1 + GRADIENTS[cellX + 1]

  return lerp(
    lerp(
      gradient(GRADIENTS[top], localX, localY),
      gradient(GRADIENTS[topRight], localX - 1, localY),
      fadeX,
    ),
    lerp(
      gradient(GRADIENTS[bottom], localX, localY - 1),
      gradient(
        GRADIENTS[bottomRight],
        localX - 1,
        localY - 1,
      ),
      fadeX,
    ),
    fadeY,
  )
}

export function OceanCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#dceff1")
    scene.fog = new THREE.Fog("#dceff1", 18, 62)

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    const baseCameraPosition = new THREE.Vector3(0, 7.1, 13.5)
    const baseCameraTarget = new THREE.Vector3(0, -1.15, -3.5)
    const cameraOffset = new THREE.Vector2()
    const targetCameraOffset = new THREE.Vector2()
    camera.position.copy(baseCameraPosition)
    camera.lookAt(baseCameraTarget)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    // Keep the background simulation lightweight on high-DPI displays.
    renderer.setPixelRatio(1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.cursor = "grab"
    renderer.domElement.style.touchAction = "none"

    // Roughly four times the original low-detail vertex count, while retaining
    // the 30 FPS wave-update cap below.
    const geometry = new THREE.PlaneGeometry(78, 58, 128, 84)
    geometry.rotateX(-Math.PI / 2)
    const material = new THREE.MeshStandardMaterial({
      color: "#0b344d",
      emissive: "#020a10",
      emissiveIntensity: 0.02,
      roughness: 0.24,
      metalness: 0.04,
      flatShading: false,
    })
    const ocean = new THREE.Mesh(geometry, material)
    ocean.position.y = -1.25
    scene.add(ocean)

    scene.add(new THREE.HemisphereLight("#f5fbfa", "#0b3a43", 2))
    scene.add(new THREE.AmbientLight("#d7f2f2", 0.35))
    // Fixed in world space above the initial camera target. The highlight now
    // stays on one physical patch of water while the camera pans around it.
    const keyLight = new THREE.PointLight("#fff2cf", 420, 46, 2)
    keyLight.position.set(0, 9, -3.5)
    scene.add(keyLight)

    const clock = new THREE.Clock()
    const basePositions = geometry.attributes.position.array.slice()
    let frame = 0
    let lastWaveUpdate = 0
    let lastFrameTime = 0
    let activePointer: number | null = null
    let pointerX = 0
    let pointerY = 0
    const pressedKeys = new Set<string>()

    const clampCameraOffset = () => {
      targetCameraOffset.x = THREE.MathUtils.clamp(targetCameraOffset.x, -5.5, 5.5)
      targetCameraOffset.y = THREE.MathUtils.clamp(targetCameraOffset.y, -3.2, 3.2)
    }

    const handlePointerDown = (event: PointerEvent) => {
      activePointer = event.pointerId
      pointerX = event.clientX
      pointerY = event.clientY
      renderer.domElement.setPointerCapture(event.pointerId)
      renderer.domElement.style.cursor = "grabbing"
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return
      const deltaX = event.clientX - pointerX
      const deltaY = event.clientY - pointerY
      pointerX = event.clientX
      pointerY = event.clientY
      targetCameraOffset.x -= deltaX * 0.018
      targetCameraOffset.y -= deltaY * 0.018
      clampCameraOffset()
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return
      activePointer = null
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId)
      }
      renderer.domElement.style.cursor = "grab"
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const key = event.key.toLowerCase()
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        pressedKeys.add(key)
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.key.toLowerCase())
    }

    const resize = () => {
      const width = mount.clientWidth || window.innerWidth
      const height = mount.clientHeight || window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const animate = (timestamp: number) => {
      const elapsed = clock.getElapsedTime()
      const deltaSeconds = Math.min((timestamp - lastFrameTime) / 1000, 0.05)
      lastFrameTime = timestamp
      const positions = geometry.attributes.position
      // Update the wave at ~30 FPS; the renderer can continue presenting the
      // last mesh between updates without burning a CPU core.
      if (timestamp - lastWaveUpdate >= 33) {
        for (let index = 0; index < positions.count; index += 1) {
          const offset = index * 3
          const x = basePositions[offset]
          const z = basePositions[offset + 2]
          const wave = perlinNoise(x * 0.2 + elapsed * 0.02, z * 0.2 - elapsed * 0.78)
          positions.array[offset + 1] = basePositions[offset + 1] + wave * 1.25
        }
        positions.needsUpdate = true
        geometry.computeVertexNormals()
        lastWaveUpdate = timestamp
      }

      const moveSpeed = 3.2 * deltaSeconds
      if (pressedKeys.has("a") || pressedKeys.has("arrowleft")) targetCameraOffset.x -= moveSpeed
      if (pressedKeys.has("d") || pressedKeys.has("arrowright")) targetCameraOffset.x += moveSpeed
      if (pressedKeys.has("w") || pressedKeys.has("arrowup")) targetCameraOffset.y -= moveSpeed
      if (pressedKeys.has("s") || pressedKeys.has("arrowdown")) targetCameraOffset.y += moveSpeed
      clampCameraOffset()

      cameraOffset.lerp(targetCameraOffset, 0.09)
      camera.position.set(
        baseCameraPosition.x + cameraOffset.x,
        baseCameraPosition.y,
        baseCameraPosition.z + cameraOffset.y,
      )
      camera.lookAt(
        baseCameraTarget.x + cameraOffset.x,
        baseCameraTarget.y,
        baseCameraTarget.z + cameraOffset.y,
      )
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    renderer.domElement.addEventListener("pointerdown", handlePointerDown)
    renderer.domElement.addEventListener("pointermove", handlePointerMove)
    renderer.domElement.addEventListener("pointerup", handlePointerUp)
    renderer.domElement.addEventListener("pointercancel", handlePointerUp)
    animate(0)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown)
      renderer.domElement.removeEventListener("pointermove", handlePointerMove)
      renderer.domElement.removeEventListener("pointerup", handlePointerUp)
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0" aria-label="实时柏林噪声海浪场景" />
}
