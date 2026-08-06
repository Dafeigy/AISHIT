import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

import windTurbineUrl from "@/assets/models/wind_turbine.glb?url"

const TURBINE_HEIGHT = 7.5
const OCEAN_WIDTH = 360
const OCEAN_DEPTH = 276
const TURBINE_REFERENCE_POSITION = new THREE.Vector3(8, -1.05, -27)
// This GLB and the Three.js scene are Y-up. Keep the world-space Z placement
// beside the vertical sink offset so future turbine variants can reuse both.
const TURBINE_WORLD_Z_OFFSET = -27
const TURBINE_VERTICAL_SINK_OFFSET_Y = -0.65
const TURBINE_POSITION = new THREE.Vector3(
  TURBINE_REFERENCE_POSITION.x,
  TURBINE_REFERENCE_POSITION.y + TURBINE_VERTICAL_SINK_OFFSET_Y,
  TURBINE_WORLD_Z_OFFSET,
)
const ROTOR_SPEED = 0.58

function disposeObject(root: THREE.Object3D) {
  const disposedMaterials = new Set<THREE.Material>()
  const disposedTextures = new Set<THREE.Texture>()

  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.dispose()

    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((meshMaterial) => {
      if (disposedMaterials.has(meshMaterial)) return

      Object.values(meshMaterial).forEach((value) => {
        if (value instanceof THREE.Texture && !disposedTextures.has(value)) {
          value.dispose()
          disposedTextures.add(value)
        }
      })
      meshMaterial.dispose()
      disposedMaterials.add(meshMaterial)
    })
  })
}

const vertexShader = /* glsl */ `
  uniform float uTime;

  varying vec3 vWorldPosition;
  varying float vWaveHeight;

  const float SEA_HEIGHT = 0.62;
  const float SEA_CHOPPY = 3.8;
  const float SEA_FREQ = 0.17;
  const float SEA_SPEED = 0.62;
  const mat2 OCTAVE_MATRIX = mat2(1.6, 1.2, -1.2, 1.6);

  float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return -1.0 + 2.0 * mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), u.x),
      u.y
    );
  }

  float seaOctave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wave = 1.0 - abs(sin(uv));
    vec2 swell = abs(cos(uv));
    wave = mix(wave, swell, wave);
    return pow(1.0 - pow(wave.x * wave.y, 0.65), choppy);
  }

  float seaHeight(vec2 worldXZ) {
    float frequency = SEA_FREQ;
    float amplitude = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    float height = 0.0;
    vec2 uv = worldXZ;
    uv.x *= 0.75;
    float seaTime = 1.0 + uTime * SEA_SPEED;

    for (int octave = 0; octave < 4; octave++) {
      float detail = seaOctave((uv + seaTime) * frequency, choppy);
      detail += seaOctave((uv - seaTime) * frequency, choppy);
      height += detail * amplitude;
      uv = OCTAVE_MATRIX * uv;
      frequency *= 1.9;
      amplitude *= 0.22;
      choppy = mix(choppy, 1.0, 0.2);
    }

    return height - 0.82;
  }

  void main() {
    vec3 displaced = position;
    displaced.y += seaHeight(position.xz);
    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWaveHeight = displaced.y;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeepColor;
  uniform vec3 uWaterColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uSunDirection;

  varying vec3 vWorldPosition;
  varying float vWaveHeight;

  const float PI = 3.14159265359;
  const float SEA_HEIGHT = 0.62;
  const float SEA_CHOPPY = 3.8;
  const float SEA_FREQ = 0.17;
  const float SEA_SPEED = 0.62;
  const mat2 OCTAVE_MATRIX = mat2(1.6, 1.2, -1.2, 1.6);

  float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return -1.0 + 2.0 * mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), u.x),
      u.y
    );
  }

  float seaOctave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wave = 1.0 - abs(sin(uv));
    vec2 swell = abs(cos(uv));
    wave = mix(wave, swell, wave);
    return pow(1.0 - pow(wave.x * wave.y, 0.65), choppy);
  }

  float detailedSeaHeight(vec2 worldXZ) {
    float frequency = SEA_FREQ;
    float amplitude = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    float height = 0.0;
    vec2 uv = worldXZ;
    uv.x *= 0.75;
    float seaTime = 1.0 + uTime * SEA_SPEED;

    for (int octave = 0; octave < 5; octave++) {
      float detail = seaOctave((uv + seaTime) * frequency, choppy);
      detail += seaOctave((uv - seaTime) * frequency, choppy);
      height += detail * amplitude;
      uv = OCTAVE_MATRIX * uv;
      frequency *= 1.9;
      amplitude *= 0.22;
      choppy = mix(choppy, 1.0, 0.2);
    }

    return height - 0.82;
  }

  vec3 skyColor(vec3 direction) {
    float elevation = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 zenith = vec3(0.56, 0.76, 0.82);
    vec3 horizon = uHorizonColor;
    vec3 sky = mix(horizon, zenith, pow(elevation, 0.72));
    float sun = pow(max(dot(direction, uSunDirection), 0.0), 420.0);
    return sky + vec3(1.0, 0.82, 0.52) * sun * 1.6;
  }

  float specular(vec3 normal, vec3 lightDirection, vec3 eyeDirection, float shine) {
    float normalization = (shine + 8.0) / (PI * 8.0);
    return pow(max(dot(reflect(-lightDirection, normal), eyeDirection), 0.0), shine) * normalization;
  }

  void main() {
    float distanceToCamera = length(cameraPosition - vWorldPosition);
    float epsilon = mix(0.045, 0.16, smoothstep(8.0, 80.0, distanceToCamera));
    float center = detailedSeaHeight(vWorldPosition.xz);
    float right = detailedSeaHeight(vWorldPosition.xz + vec2(epsilon, 0.0));
    float forward = detailedSeaHeight(vWorldPosition.xz + vec2(0.0, epsilon));
    vec3 normal = normalize(vec3(center - right, epsilon, center - forward));

    vec3 eyeDirection = normalize(cameraPosition - vWorldPosition);
    vec3 reflectedDirection = reflect(-eyeDirection, normal);
    float fresnel = pow(1.0 - clamp(dot(normal, eyeDirection), 0.0, 1.0), 3.0) * 0.72;

    float diffuse = pow(dot(normal, uSunDirection) * 0.4 + 0.6, 55.0);
    vec3 refracted = uDeepColor + diffuse * uWaterColor * 0.16;
    vec3 reflected = skyColor(reflectedDirection);
    vec3 color = mix(refracted, reflected, fresnel);

    float distanceAttenuation = max(1.0 - distanceToCamera * distanceToCamera * 0.00009, 0.0);
    color += uWaterColor * (vWaveHeight + 0.34) * 0.12 * distanceAttenuation;
    color += vec3(1.0, 0.91, 0.72) * specular(normal, uSunDirection, eyeDirection, 90.0) * 1.9;

    float horizonFog = smoothstep(42.0, 106.0, distanceToCamera);
    color = mix(color, uHorizonColor, horizonFog * 0.68);
    color = pow(max(color, 0.0), vec3(0.82));
    gl_FragColor = vec4(color, 1.0);
  }
`

type OceanCanvasProps = {
  onTurbineSelect?: () => void
}

export function OceanCanvas({ onTurbineSelect }: OceanCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const onTurbineSelectRef = useRef(onTurbineSelect)

  useEffect(() => {
    onTurbineSelectRef.current = onTurbineSelect
  }, [onTurbineSelect])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#b8d9de")
    scene.fog = new THREE.Fog("#b8d9de", 54, 128)

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 180)
    const baseCameraPosition = new THREE.Vector3(0, 6.8, 14.5)
    const baseCameraTarget = new THREE.Vector3(0, 0.3, -10)
    const baseViewDirection = baseCameraTarget.clone().sub(baseCameraPosition)
    const viewDistance = baseViewDirection.length()
    const basePitch = Math.asin(baseViewDirection.y / viewDistance)
    const baseYaw = Math.atan2(baseViewDirection.x, -baseViewDirection.z)
    const cameraOffset = new THREE.Vector2()
    const targetCameraOffset = new THREE.Vector2()
    const cameraRotation = new THREE.Vector2()
    const targetCameraRotation = new THREE.Vector2()
    const cameraLookTarget = new THREE.Vector3()
    camera.position.copy(baseCameraPosition)
    camera.lookAt(baseCameraTarget)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.02
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.cursor = "grab"
    renderer.domElement.style.touchAction = "none"

    const uniforms = {
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color("#061e2b") },
      uWaterColor: { value: new THREE.Color("#74b9ae") },
      uHorizonColor: { value: new THREE.Color("#c8e2e3") },
      uSunDirection: { value: new THREE.Vector3(-0.22, 0.78, 0.58).normalize() },
    }

    const geometry = new THREE.PlaneGeometry(OCEAN_WIDTH, OCEAN_DEPTH, 180, 138)
    geometry.rotateX(-Math.PI / 2)
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      fog: false,
    })
    const ocean = new THREE.Mesh(geometry, material)
    ocean.position.set(0, -1.15, -30)
    ocean.name = "procedural-ocean"
    scene.add(ocean)

    // Future turbine GLTF models should be added to this group so they share
    // the ocean's world coordinates, camera, depth buffer and lighting setup.
    const offshoreAssets = new THREE.Group()
    offshoreAssets.name = "offshore-assets"
    scene.add(offshoreAssets)

    const hemisphereLight = new THREE.HemisphereLight("#eefbff", "#123b47", 2.2)
    const sunLight = new THREE.DirectionalLight("#fff1cf", 3.4)
    sunLight.position.set(-12, 18, 9)
    scene.add(hemisphereLight, sunLight)

    let turbineRoot: THREE.Group | null = null
    let turbineRotor: THREE.Object3D | null = null
    let isDisposed = false

    const turbineLoader = new GLTFLoader()
    turbineLoader.load(
      windTurbineUrl,
      ({ scene: turbine }) => {
        if (isDisposed) {
          disposeObject(turbine)
          return
        }

        turbine.name = "wind-turbine"
        turbine.updateMatrixWorld(true)

        const sourceBounds = new THREE.Box3().setFromObject(turbine)
        const sourceHeight = sourceBounds.getSize(new THREE.Vector3()).y
        const turbineScale = sourceHeight > 0 ? TURBINE_HEIGHT / sourceHeight : 1
        turbine.scale.setScalar(turbineScale)
        turbine.updateMatrixWorld(true)

        const scaledBounds = new THREE.Box3().setFromObject(turbine)
        const scaledCenter = scaledBounds.getCenter(new THREE.Vector3())
        turbine.position.set(
          TURBINE_POSITION.x - scaledCenter.x,
          TURBINE_POSITION.y - scaledBounds.min.y,
          TURBINE_POSITION.z - scaledCenter.z,
        )

        turbine.traverse((object) => {
          if (object.name.toLowerCase().includes("blades")) turbineRotor = object
          if (object instanceof THREE.Mesh) {
            object.castShadow = true
            object.frustumCulled = true
          }
        })

        turbineRoot = turbine
        offshoreAssets.add(turbine)
      },
      undefined,
      (error) => console.error("Unable to load the wind turbine model.", error),
    )

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    let elapsedTime = 0
    let activePointer: number | null = null
    let dragMode: "move" | "rotate" = "move"
    let pointerX = 0
    let pointerY = 0
    let pointerDownX = 0
    let pointerDownY = 0
    let pointerDragged = false
    let lastFrameTime = performance.now()
    let targetFieldOfView = camera.fov
    const pressedKeys = new Set<string>()

    const MAX_YAW = THREE.MathUtils.degToRad(14)
    const MAX_PITCH = THREE.MathUtils.degToRad(8)
    const MIN_FIELD_OF_VIEW = 41
    const MAX_FIELD_OF_VIEW = 51
    const raycaster = new THREE.Raycaster()
    const pointerPosition = new THREE.Vector2()

    const isTurbineHit = (event: PointerEvent) => {
      if (!turbineRoot) return false
      const bounds = renderer.domElement.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) return false
      pointerPosition.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointerPosition, camera)
      return raycaster.intersectObject(turbineRoot, true).length > 0
    }

    const clampCameraOffset = () => {
      targetCameraOffset.x = THREE.MathUtils.clamp(targetCameraOffset.x, -7, 7)
      targetCameraOffset.y = THREE.MathUtils.clamp(targetCameraOffset.y, -5, 5)
    }

    const clampCameraRotation = () => {
      targetCameraRotation.x = THREE.MathUtils.clamp(targetCameraRotation.x, -MAX_YAW, MAX_YAW)
      targetCameraRotation.y = THREE.MathUtils.clamp(targetCameraRotation.y, -MAX_PITCH, MAX_PITCH)
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0 && event.button !== 1) return
      activePointer = event.pointerId
      dragMode = event.button === 1 || event.shiftKey ? "rotate" : "move"
      pointerX = event.clientX
      pointerY = event.clientY
      pointerDownX = event.clientX
      pointerDownY = event.clientY
      pointerDragged = false
      renderer.domElement.setPointerCapture(event.pointerId)
      renderer.domElement.style.cursor = "grabbing"
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return
      const deltaX = event.clientX - pointerX
      const deltaY = event.clientY - pointerY
      if (Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY) > 5) {
        pointerDragged = true
      }
      pointerX = event.clientX
      pointerY = event.clientY
      if (dragMode === "rotate") {
        targetCameraRotation.x += deltaX * 0.0035
        targetCameraRotation.y -= deltaY * 0.003
        clampCameraRotation()
      } else {
        targetCameraOffset.x -= deltaX * 0.02
        targetCameraOffset.y -= deltaY * 0.02
        clampCameraOffset()
      }
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return
      const shouldSelectTurbine = !pointerDragged && isTurbineHit(event)
      activePointer = null
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId)
      }
      renderer.domElement.style.cursor = shouldSelectTurbine ? "pointer" : "grab"
      if (shouldSelectTurbine) onTurbineSelectRef.current?.()
    }

    const handlePointerHover = (event: PointerEvent) => {
      if (activePointer !== null || event.pointerType === "touch") return
      renderer.domElement.style.cursor = isTurbineHit(event) ? "pointer" : "grab"
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      targetFieldOfView = THREE.MathUtils.clamp(
        targetFieldOfView + event.deltaY * 0.008,
        MIN_FIELD_OF_VIEW,
        MAX_FIELD_OF_VIEW,
      )
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) return
      const key = event.key.toLowerCase()
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift", "+", "=", "-", "_"].includes(key)) {
        pressedKeys.add(key)
        if (key.startsWith("arrow") || ["+", "=", "-", "_"].includes(key)) event.preventDefault()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => pressedKeys.delete(event.key.toLowerCase())

    const resize = () => {
      const width = mount.clientWidth || window.innerWidth
      const height = mount.clientHeight || window.innerHeight
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const animate = (timestamp: number) => {
      const deltaSeconds = Math.min((timestamp - lastFrameTime) / 1000, 0.05)
      lastFrameTime = timestamp
      if (!reducedMotion.matches) elapsedTime += deltaSeconds
      uniforms.uTime.value = reducedMotion.matches ? 1.5 : elapsedTime
      if (turbineRotor && !reducedMotion.matches) turbineRotor.rotation.z -= ROTOR_SPEED * deltaSeconds

      const moveSpeed = 3.5 * deltaSeconds
      const rotateSpeed = THREE.MathUtils.degToRad(24) * deltaSeconds
      const zoomSpeed = 18 * deltaSeconds
      const rotateWithArrows = pressedKeys.has("shift")
      if (pressedKeys.has("a") || (!rotateWithArrows && pressedKeys.has("arrowleft"))) targetCameraOffset.x -= moveSpeed
      if (pressedKeys.has("d") || (!rotateWithArrows && pressedKeys.has("arrowright"))) targetCameraOffset.x += moveSpeed
      if (pressedKeys.has("w") || (!rotateWithArrows && pressedKeys.has("arrowup"))) targetCameraOffset.y -= moveSpeed
      if (pressedKeys.has("s") || (!rotateWithArrows && pressedKeys.has("arrowdown"))) targetCameraOffset.y += moveSpeed
      if (rotateWithArrows) {
        if (pressedKeys.has("arrowleft")) targetCameraRotation.x -= rotateSpeed
        if (pressedKeys.has("arrowright")) targetCameraRotation.x += rotateSpeed
        if (pressedKeys.has("arrowup")) targetCameraRotation.y += rotateSpeed
        if (pressedKeys.has("arrowdown")) targetCameraRotation.y -= rotateSpeed
      }
      if (pressedKeys.has("+") || pressedKeys.has("=")) targetFieldOfView -= zoomSpeed
      if (pressedKeys.has("-") || pressedKeys.has("_")) targetFieldOfView += zoomSpeed
      clampCameraOffset()
      clampCameraRotation()
      targetFieldOfView = THREE.MathUtils.clamp(targetFieldOfView, MIN_FIELD_OF_VIEW, MAX_FIELD_OF_VIEW)

      cameraOffset.lerp(targetCameraOffset, 0.085)
      cameraRotation.lerp(targetCameraRotation, 0.085)
      camera.position.set(
        baseCameraPosition.x + cameraOffset.x,
        baseCameraPosition.y,
        baseCameraPosition.z + cameraOffset.y,
      )
      const yaw = baseYaw + cameraRotation.x
      const pitch = basePitch + cameraRotation.y
      const horizontalDistance = Math.cos(pitch) * viewDistance
      cameraLookTarget.set(
        camera.position.x + Math.sin(yaw) * horizontalDistance,
        camera.position.y + Math.sin(pitch) * viewDistance,
        camera.position.z - Math.cos(yaw) * horizontalDistance,
      )
      camera.lookAt(cameraLookTarget)
      const nextFieldOfView = THREE.MathUtils.lerp(camera.fov, targetFieldOfView, 0.1)
      if (Math.abs(nextFieldOfView - camera.fov) > 0.001) {
        camera.fov = nextFieldOfView
        camera.updateProjectionMatrix()
      }

      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    renderer.domElement.addEventListener("pointerdown", handlePointerDown)
    renderer.domElement.addEventListener("pointermove", handlePointerMove)
    renderer.domElement.addEventListener("pointermove", handlePointerHover)
    renderer.domElement.addEventListener("pointerup", handlePointerUp)
    renderer.domElement.addEventListener("pointercancel", handlePointerUp)
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false })
    frame = requestAnimationFrame(animate)

    return () => {
      isDisposed = true
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown)
      renderer.domElement.removeEventListener("pointermove", handlePointerMove)
      renderer.domElement.removeEventListener("pointermove", handlePointerHover)
      renderer.domElement.removeEventListener("pointerup", handlePointerUp)
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp)
      renderer.domElement.removeEventListener("wheel", handleWheel)
      if (turbineRoot) {
        offshoreAssets.remove(turbineRoot)
        disposeObject(turbineRoot)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-cyan-500"
      role="button"
      tabIndex={0}
      aria-label="海上风机三维监控场景。点击风机或按回车键查看详情；拖拽或使用方向键移动视角。"
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        onTurbineSelectRef.current?.()
      }}
    />
  )
}
