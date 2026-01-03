import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

type Direction = 'next' | 'prev' | null

type Props = {
  imageUrl: string
  direction: Direction
  frozen?: boolean
  restRotation?: { x: number; y: number }
  onTextureReady?: (imageUrl: string) => void
  onRenderStatus?: (status: 'loading' | 'ready' | 'context_lost') => void
}

const BASE_HEIGHT = 1

const webglSupported = () => {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

// Resize and set viewport
const resizeRenderer = (
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  container: HTMLDivElement,
) => {
  const { clientWidth, clientHeight } = container
  renderer.setSize(clientWidth, clientHeight, false)
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
}

const fitCameraToMesh = (
  camera: THREE.PerspectiveCamera,
  container: HTMLDivElement,
  meshWidth: number,
  meshHeight: number,
  margin = 1.35,
) => {
  const aspect = container.clientWidth / container.clientHeight
  camera.aspect = aspect

  const vFov = THREE.MathUtils.degToRad(camera.fov)
  const distH = (meshHeight / 2) / Math.tan(vFov / 2)
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
  const distW = (meshWidth / 2) / Math.tan(hFov / 2)

  camera.position.z = Math.max(distH, distW) * margin
  camera.near = Math.max(0.01, camera.position.z / 10)
  camera.far = camera.position.z * 10
  camera.updateProjectionMatrix()
}

function Frame3D({
  imageUrl,
  direction,
  frozen,
  restRotation,
  onTextureReady,
  onRenderStatus,
}: Props) {
  const [resetToken, setResetToken] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const frameGroupRef = useRef<THREE.Group | null>(null)
  const boxMeshRef = useRef<THREE.Mesh | null>(null)
  const paintingCurrentRef = useRef<THREE.Mesh | null>(null)
  const paintingNextRef = useRef<THREE.Mesh | null>(null)
  const currentTextureRef = useRef<THREE.Texture | null>(null)
  const nextTextureRef = useRef<THREE.Texture | null>(null)
  const rafRef = useRef<number | null>(null)
  const meshSizeRef = useRef<{ w: number; h: number; d: number }>({ w: 0.75, h: 1, d: 0.12 })
  const sceneReadyRef = useRef(false)
  const pendingUrlRef = useRef<string | null>(null)
  const currentTextureUrlRef = useRef<string | null>(null)
  const onTextureReadyRef = useRef<Props['onTextureReady']>(undefined)
  const onRenderStatusRef = useRef<Props['onRenderStatus']>(undefined)
  const loaderRef = useRef<THREE.TextureLoader | null>(null)
  const loadSeqRef = useRef(0)
  const contextLostRef = useRef(false)
  const hadContextLossRef = useRef(false)
  const latestImageUrlRef = useRef('')
  const fadeRef = useRef<{ active: boolean; start: number; duration: number }>({
    active: false,
    start: 0,
    duration: 520,
  })
  const dragState = useRef({ active: false, startX: 0, startY: 0 })
  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })
  const lastDir = useRef<Direction>(null)
  const restRotationRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    onTextureReadyRef.current = onTextureReady
  })

  useEffect(() => {
    onRenderStatusRef.current = onRenderStatus
  }, [onRenderStatus])

  useEffect(() => {
    latestImageUrlRef.current = imageUrl
  }, [imageUrl])

  const restX = restRotation?.x ?? 0
  const restY = restRotation?.y ?? 0

  useEffect(() => {
    restRotationRef.current = { x: restX, y: restY }
    targetRotation.current.x = restX
    targetRotation.current.y = restY
  }, [restX, restY])

  const getMaterials = useCallback(() => {
    const currentMesh = paintingCurrentRef.current
    const nextMesh = paintingNextRef.current
    if (!currentMesh || !nextMesh) return null
    return {
      currentMat: currentMesh.material as THREE.MeshBasicMaterial,
      nextMat: nextMesh.material as THREE.MeshBasicMaterial,
    }
  }, [])

  const resizeGeometry = useCallback((width: number, height: number, depth: number) => {
    const group = frameGroupRef.current
    const camera = cameraRef.current
    const container = containerRef.current
    const boxMesh = boxMeshRef.current
    const currentMesh = paintingCurrentRef.current
    const nextMesh = paintingNextRef.current
    if (!group || !camera || !container || !boxMesh || !currentMesh || !nextMesh) return

    const nextBoxGeometry = new THREE.BoxGeometry(width, height, depth)
    boxMesh.geometry.dispose()
    boxMesh.geometry = nextBoxGeometry

    const nextPlaneGeometry = new THREE.PlaneGeometry(width, height)
    currentMesh.geometry.dispose()
    nextMesh.geometry.dispose()
    currentMesh.geometry = nextPlaneGeometry
    nextMesh.geometry = nextPlaneGeometry.clone()

    const baseZ = depth / 2 + 0.001
    currentMesh.position.z = baseZ
    nextMesh.position.z = baseZ + 0.0025

    meshSizeRef.current = { w: width, h: height, d: depth }
    fitCameraToMesh(camera, container, width, height)
  }, [])

  const loadTexture = useCallback(async (url: string) => {
    const loader = loaderRef.current ?? new THREE.TextureLoader()
    loaderRef.current = loader
    loader.setCrossOrigin('anonymous')
    let texture: THREE.Texture
    try {
      texture = await loader.loadAsync(url)
    } catch {
      return null
    }
    texture.colorSpace = THREE.SRGBColorSpace
    texture.generateMipmaps = false
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.offset.set(0, 0)
    texture.repeat.set(1, 1)
    texture.anisotropy = Math.min(3, rendererRef.current?.capabilities.getMaxAnisotropy() ?? 2)

    return texture
  }, [])

  const safeDispose = useCallback((texture: THREE.Texture | null) => {
    if (!texture) return
    if (contextLostRef.current) return
    texture.dispose()
  }, [])

  const createWoodPlanksTexture = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Base wood tone
    ctx.fillStyle = '#d2c2a5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Planks
    const plankCount = 5
    const plankW = canvas.width / plankCount
    for (let i = 0; i < plankCount; i += 1) {
      const x = i * plankW
      const tint = i % 2 === 0 ? 'rgba(18,15,11,0.06)' : 'rgba(255,255,255,0.06)'
      ctx.fillStyle = tint
      ctx.fillRect(x, 0, plankW, canvas.height)

      // Seam line
      ctx.fillStyle = 'rgba(18,15,11,0.08)'
      ctx.fillRect(x, 0, 2, canvas.height)

      // Subtle grain
      ctx.strokeStyle = 'rgba(18,15,11,0.06)'
      ctx.lineWidth = 1
      for (let y = 0; y < canvas.height; y += 22) {
        const wobble = Math.sin((y / 38) + i) * 6
        ctx.beginPath()
        ctx.moveTo(x + 10 + wobble, y + 6)
        ctx.bezierCurveTo(
          x + plankW * 0.35 + wobble,
          y + 2,
          x + plankW * 0.65 + wobble,
          y + 12,
          x + plankW - 10 + wobble,
          y + 8,
        )
        ctx.stroke()
      }
    }

    // Soft vignette for depth
    const grad = ctx.createRadialGradient(260, 220, 20, 256, 256, 360)
    grad.addColorStop(0, 'rgba(255,255,255,0.0)')
    grad.addColorStop(1, 'rgba(18,15,11,0.12)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = false
    return tex
  }, [])

  // Load texture and crossfade onto the painting plane(s).
  const queueTexture = useCallback(async (url: string) => {
    const materials = getMaterials()
    const camera = cameraRef.current
    const container = containerRef.current
    if (!materials || !camera || !container) return
    const { currentMat, nextMat } = materials

    onRenderStatusRef.current?.('loading')

    if (fadeRef.current.active) {
      fadeRef.current.active = false
      nextMat.opacity = 0
      currentMat.opacity = 1
      nextMat.needsUpdate = true
      currentMat.needsUpdate = true
    }

    const loadSeq = (loadSeqRef.current += 1)
    const texture = await loadTexture(url)
    if (!texture) return
    if (loadSeq !== loadSeqRef.current) {
      return
    }

    const image = texture.image as { width?: number; height?: number } | undefined
    const imgAspect =
      image?.width && image?.height ? image.width / image.height : meshSizeRef.current.w / meshSizeRef.current.h

    const width = Math.max(0.25, imgAspect * BASE_HEIGHT)
    const height = BASE_HEIGHT
    const depth = Math.max(0.06, Math.min(width, height) * 0.12)
    resizeGeometry(width, height, depth)

    if (!currentTextureRef.current) {
      currentTextureRef.current = texture
      currentMat.map = texture
      currentMat.opacity = 1
      currentMat.needsUpdate = true
      nextMat.map = null
      nextMat.opacity = 0
      nextMat.needsUpdate = true

      currentTextureUrlRef.current = url
      onTextureReadyRef.current?.(url)
      onRenderStatusRef.current?.('ready')
      return
    }

    if (nextTextureRef.current && nextTextureRef.current !== currentTextureRef.current) {
      safeDispose(nextTextureRef.current)
    }

    nextTextureRef.current = texture
    nextMat.map = texture
    nextMat.opacity = 0
    nextMat.needsUpdate = true
    fadeRef.current = { ...fadeRef.current, active: true, start: performance.now() }
    currentTextureUrlRef.current = url
  }, [getMaterials, loadTexture, resizeGeometry, safeDispose])

  useEffect(() => {
    if (!webglSupported()) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const container = containerRef.current
    if (!container) return undefined
    contextLostRef.current = false
    hadContextLossRef.current = false
    fadeRef.current.active = false
    currentTextureRef.current = null
    nextTextureRef.current = null

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25))
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.borderRadius = 'inherit'

    const scene = new THREE.Scene()
    scene.background = null
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 10)
    camera.position.set(0, 0, 3.2)
    cameraRef.current = camera

    const group = new THREE.Group()
    scene.add(group)
    frameGroupRef.current = group

    // Lights (for the wood frame)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.9)
    mainLight.position.set(1.2, 1.4, 2.5)
    scene.add(mainLight)

    const rimLight = new THREE.DirectionalLight(0xfff6e0, 0.35)
    rimLight.position.set(-1.5, -0.4, -1.0)
    scene.add(rimLight)

    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(ambient)

    const { w, h, d } = meshSizeRef.current
    const boxGeometry = new THREE.BoxGeometry(w, h, d)
    const woodColor = new THREE.Color('#d8c7a6')
    const woodSide = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.72, metalness: 0.04 })
    const woodTexture = createWoodPlanksTexture()
    const frameBack = new THREE.MeshStandardMaterial({
      color: '#d2c2a5',
      roughness: 0.8,
      metalness: 0.03,
      map: woodTexture ?? undefined,
    })
    const frontHidden = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
    // Box order: +x, -x, +y, -y, +z (front), -z (back)
    const boxMaterials = [
      woodSide, // right
      woodSide, // left
      woodSide, // top
      woodSide, // bottom
      frontHidden, // front (covered by painting planes)
      frameBack, // back
    ]

    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterials)
    group.add(boxMesh)
    boxMeshRef.current = boxMesh

    const planeGeometry = new THREE.PlaneGeometry(w, h)
    const currentMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false,
    })
    const nextMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    })

    const planeZ = d / 2 + 0.001
    const currentPlane = new THREE.Mesh(planeGeometry, currentMat)
    currentPlane.position.z = planeZ
    currentPlane.renderOrder = 10
    group.add(currentPlane)
    paintingCurrentRef.current = currentPlane

    const nextPlane = new THREE.Mesh(planeGeometry.clone(), nextMat)
    nextPlane.position.z = planeZ + 0.0025
    nextPlane.renderOrder = 11
    group.add(nextPlane)
    paintingNextRef.current = nextPlane

    sceneReadyRef.current = true

    resizeRenderer(renderer, camera, container)
    fitCameraToMesh(camera, container, meshSizeRef.current.w, meshSizeRef.current.h)
    const resizeObserver = new ResizeObserver(() => {
      resizeRenderer(renderer, camera, container)
      fitCameraToMesh(camera, container, meshSizeRef.current.w, meshSizeRef.current.h)
    })
    resizeObserver.observe(container)

    if (pendingUrlRef.current) {
      void queueTexture(pendingUrlRef.current)
      pendingUrlRef.current = null
    }

    const handleContextLost = (event: Event) => {
      ;(event as WebGLContextEvent).preventDefault()
      contextLostRef.current = true
      hadContextLossRef.current = true
      onRenderStatusRef.current?.('context_lost')
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    const handleContextRestored = () => {
      onRenderStatusRef.current?.('loading')
      pendingUrlRef.current = currentTextureUrlRef.current ?? latestImageUrlRef.current
      setResetToken((n) => n + 1)
    }

    renderer.domElement.addEventListener('webglcontextlost', handleContextLost as EventListener, {
      passive: false,
    })
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored as EventListener)

    const animate = () => {
      const group = frameGroupRef.current
      const materials = getMaterials()
      if (!group || !materials) return

      if (fadeRef.current.active) {
        const now = performance.now()
        const t = Math.min(1, (now - fadeRef.current.start) / fadeRef.current.duration)
        materials.nextMat.opacity = t
        materials.currentMat.opacity = 1 - t
        materials.nextMat.needsUpdate = true
        materials.currentMat.needsUpdate = true

        if (t >= 1) {
          fadeRef.current.active = false

          const oldTex = currentTextureRef.current
          currentTextureRef.current = nextTextureRef.current
          nextTextureRef.current = null

          materials.currentMat.map = currentTextureRef.current
          materials.currentMat.opacity = 1
          materials.currentMat.needsUpdate = true

          materials.nextMat.map = null
          materials.nextMat.opacity = 0
          materials.nextMat.needsUpdate = true

          safeDispose(oldTex)
          const appliedUrl = currentTextureUrlRef.current ?? ''
          onTextureReadyRef.current?.(appliedUrl)
          onRenderStatusRef.current?.('ready')
        }
      }

      const damping = 0.12
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * damping
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * damping
      group.rotation.x = currentRotation.current.x
      group.rotation.y = currentRotation.current.y

      renderer.render(scene, camera)
      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      resizeObserver.disconnect()
      sceneReadyRef.current = false

      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost as EventListener)
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored as EventListener)

      if (!hadContextLossRef.current) {
        boxMesh.geometry.dispose()
        for (const m of boxMaterials) m.dispose()
        woodTexture?.dispose()
        currentPlane.geometry.dispose()
        nextPlane.geometry.dispose()
        currentMat.dispose()
        nextMat.dispose()
        renderer.dispose()
        safeDispose(currentTextureRef.current)
        safeDispose(nextTextureRef.current)
      }

      try {
        container.removeChild(renderer.domElement)
      } catch {
        // ignore
      }
    }
  }, [createWoodPlanksTexture, getMaterials, queueTexture, resetToken, safeDispose])

  // Handle new images
  useEffect(() => {
    if (!webglSupported()) return
    if (!imageUrl) return
    if (!sceneReadyRef.current) {
      pendingUrlRef.current = imageUrl
      return
    }
    if (imageUrl === currentTextureUrlRef.current) return
    void queueTexture(imageUrl)
  }, [imageUrl, queueTexture])

  // Handle direction for a small nudge
  useEffect(() => {
    if (!webglSupported()) return
    if (!direction) {
      lastDir.current = null
      return
    }
    if (!direction || direction === lastDir.current) return
    lastDir.current = direction
    const delta = direction === 'next' ? -0.08 : 0.08
    targetRotation.current.y = THREE.MathUtils.clamp(targetRotation.current.y + delta, -0.25, 0.25)
  }, [direction])

  // Pointer drag
  useEffect(() => {
    if (!webglSupported()) return undefined
    const container = containerRef.current
    if (!container) return undefined

    const onDown = (e: PointerEvent) => {
      dragState.current = { active: true, startX: e.clientX, startY: e.clientY }
    }
    const onMove = (e: PointerEvent) => {
      if (!dragState.current.active || frozen) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      targetRotation.current.y = THREE.MathUtils.clamp(
        restRotationRef.current.y + dx * 0.003,
        -0.38,
        0.38,
      )
      targetRotation.current.x = THREE.MathUtils.clamp(
        restRotationRef.current.x + -dy * 0.0026,
        -0.28,
        0.32,
      )
    }
    const onUp = () => {
      dragState.current = { active: false, startX: 0, startY: 0 }
      targetRotation.current.x = restRotationRef.current.x
      targetRotation.current.y = restRotationRef.current.y
    }

    container.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      container.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [frozen])

  if (!webglSupported()) return null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ borderRadius: 'inherit', overflow: 'hidden' }}
      aria-hidden
    />
  )
}

export default Frame3D
