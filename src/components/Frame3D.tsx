import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { canUseWebGL, prefersReducedMotion } from '../lib/webgl'
import { CAMERA_MARGIN } from '../lib/frame'

export type RenderStatus = 'loading' | 'ready' | 'context_lost' | 'unsupported'

type Props = {
  imageUrl: string
  frozen?: boolean
  restRotation?: { x: number; y: number }
  /** Fired while the canvas is hidden, right after the new painting is applied, with its aspect ratio. */
  onTextureReady?: (imageUrl: string, aspect: number) => void
  /** Called when an image could not be loaded (after one retry). */
  onTextureError?: (imageUrl: string) => void
  onRenderStatus?: (status: RenderStatus) => void
}

const BASE_HEIGHT = 1
const FADE_OUT_MS = 170
const FADE_IN_MS = 320

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
const nextFrames = (count: number) =>
  new Promise<void>((resolve) => {
    const step = (n: number) => (n <= 0 ? resolve() : requestAnimationFrame(() => step(n - 1)))
    step(count)
  })

const resizeRenderer = (
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  container: HTMLDivElement,
) => {
  const { clientWidth, clientHeight } = container
  if (!clientWidth || !clientHeight) return
  renderer.setSize(clientWidth, clientHeight, false)
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
}

const fitCameraToMesh = (
  camera: THREE.PerspectiveCamera,
  container: HTMLDivElement,
  meshWidth: number,
  meshHeight: number,
  margin = CAMERA_MARGIN,
) => {
  if (!container.clientWidth || !container.clientHeight) return
  const aspect = container.clientWidth / container.clientHeight
  camera.aspect = aspect

  const vFov = THREE.MathUtils.degToRad(camera.fov)
  const distH = meshHeight / 2 / Math.tan(vFov / 2)
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
  const distW = meshWidth / 2 / Math.tan(hFov / 2)

  camera.position.z = Math.max(distH, distW) * margin
  camera.near = Math.max(0.01, camera.position.z / 10)
  camera.far = camera.position.z * 10
  camera.updateProjectionMatrix()
}

const createWoodPlanksTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#d2c2a5'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const plankCount = 5
  const plankW = canvas.width / plankCount
  for (let i = 0; i < plankCount; i += 1) {
    const x = i * plankW
    ctx.fillStyle = i % 2 === 0 ? 'rgba(18,15,11,0.06)' : 'rgba(255,255,255,0.06)'
    ctx.fillRect(x, 0, plankW, canvas.height)

    ctx.fillStyle = 'rgba(18,15,11,0.08)'
    ctx.fillRect(x, 0, 2, canvas.height)

    ctx.strokeStyle = 'rgba(18,15,11,0.06)'
    ctx.lineWidth = 1
    for (let y = 0; y < canvas.height; y += 22) {
      const wobble = Math.sin(y / 38 + i) * 6
      ctx.beginPath()
      ctx.moveTo(x + 10 + wobble, y + 6)
      ctx.bezierCurveTo(x + plankW * 0.35 + wobble, y + 2, x + plankW * 0.65 + wobble, y + 12, x + plankW - 10 + wobble, y + 8)
      ctx.stroke()
    }
  }

  const grad = ctx.createRadialGradient(260, 220, 20, 256, 256, 360)
  grad.addColorStop(0, 'rgba(255,255,255,0.0)')
  grad.addColorStop(1, 'rgba(18,15,11,0.12)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = false
  return tex
}

function Frame3D({ imageUrl, frozen, restRotation, onTextureReady, onTextureError, onRenderStatus }: Props) {
  const [resetToken, setResetToken] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const boxMeshRef = useRef<THREE.Mesh | null>(null)
  const paintingRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null>(null)
  const currentTextureRef = useRef<THREE.Texture | null>(null)
  const currentUrlRef = useRef<string | null>(null)
  const meshSizeRef = useRef({ w: 0.75, h: 1, d: 0.12 })
  const sceneReadyRef = useRef(false)
  const pendingUrlRef = useRef<string | null>(null)
  const latestUrlRef = useRef('')
  const loadSeqRef = useRef(0)
  const visibleRef = useRef(false)
  const contextLostRef = useRef(false)
  const hadContextLossRef = useRef(false)
  const loaderRef = useRef<THREE.TextureLoader | null>(null)
  const onTextureReadyRef = useRef<Props['onTextureReady']>(undefined)
  const onTextureErrorRef = useRef<Props['onTextureError']>(undefined)
  const onRenderStatusRef = useRef<Props['onRenderStatus']>(undefined)
  const dragState = useRef({ active: false, startX: 0, startY: 0 })
  const targetRotation = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0, y: 0 })
  const restRotationRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    onTextureReadyRef.current = onTextureReady
    onTextureErrorRef.current = onTextureError
    onRenderStatusRef.current = onRenderStatus
  })

  useEffect(() => {
    latestUrlRef.current = imageUrl
  }, [imageUrl])

  const restX = restRotation?.x ?? 0
  const restY = restRotation?.y ?? 0
  useEffect(() => {
    restRotationRef.current = { x: restX, y: restY }
    targetRotation.current = { x: restX, y: restY }
  }, [restX, restY])

  // Fade/scale the canvas itself (compositor-only, so it stays smooth).
  const setVisible = useCallback((visible: boolean) => {
    const canvas = rendererRef.current?.domElement
    visibleRef.current = visible
    if (!canvas) return
    canvas.style.transitionDuration = `${visible ? FADE_IN_MS : FADE_OUT_MS}ms`
    canvas.style.opacity = visible ? '1' : '0'
    canvas.style.transform = visible ? 'scale(1)' : 'scale(0.985)'
  }, [])

  const resizeGeometry = useCallback((width: number, height: number, depth: number) => {
    const camera = cameraRef.current
    const container = containerRef.current
    const boxMesh = boxMeshRef.current
    const painting = paintingRef.current
    if (!camera || !container || !boxMesh || !painting) return

    boxMesh.geometry.dispose()
    boxMesh.geometry = new THREE.BoxGeometry(width, height, depth)
    painting.geometry.dispose()
    painting.geometry = new THREE.PlaneGeometry(width, height)
    painting.position.z = depth / 2 + 0.001

    meshSizeRef.current = { w: width, h: height, d: depth }
    fitCameraToMesh(camera, container, width, height)
  }, [])

  const loadTexture = useCallback(async (url: string) => {
    const loader = loaderRef.current ?? new THREE.TextureLoader()
    loaderRef.current = loader
    loader.setCrossOrigin('anonymous')
    let texture: THREE.Texture | null = null
    for (let attempt = 0; attempt < 2 && !texture; attempt += 1) {
      try {
        texture = await loader.loadAsync(url)
      } catch {
        if (attempt === 0) await wait(600)
      }
    }
    if (!texture) return null
    texture.colorSpace = THREE.SRGBColorSpace
    texture.generateMipmaps = false
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.anisotropy = Math.min(4, rendererRef.current?.capabilities.getMaxAnisotropy() ?? 1)
    return texture
  }, [])

  const disposeTexture = useCallback((texture: THREE.Texture | null) => {
    if (texture && !contextLostRef.current) texture.dispose()
  }, [])

  // Load → fade out → swap image + size while hidden → fade in.
  const showPainting = useCallback(
    async (url: string) => {
      const seq = (loadSeqRef.current += 1)
      onRenderStatusRef.current?.('loading')

      const texture = await loadTexture(url)
      const isStale = () => seq !== loadSeqRef.current || !sceneReadyRef.current

      if (isStale()) {
        disposeTexture(texture)
        return
      }
      if (!texture) {
        onTextureErrorRef.current?.(url)
        if (currentTextureRef.current) {
          setVisible(true)
          onRenderStatusRef.current?.('ready')
        }
        return
      }

      if (visibleRef.current) {
        setVisible(false)
        await wait(FADE_OUT_MS)
        if (isStale()) {
          disposeTexture(texture)
          // A newer painting is still loading; keep showing the current one meanwhile.
          if (sceneReadyRef.current && currentTextureRef.current) setVisible(true)
          return
        }
      }

      const image = texture.image as { width?: number; height?: number } | undefined
      const aspect = image?.width && image?.height ? image.width / image.height : 0.75
      const width = Math.max(0.25, aspect * BASE_HEIGHT)
      const depth = Math.max(0.06, Math.min(width, BASE_HEIGHT) * 0.12)
      resizeGeometry(width, BASE_HEIGHT, depth)

      const painting = paintingRef.current!
      const previous = currentTextureRef.current
      painting.material.map = texture
      painting.material.needsUpdate = true
      rendererRef.current?.initTexture(texture) // upload now, not on the first visible frame
      disposeTexture(previous)
      currentTextureRef.current = texture
      currentUrlRef.current = url

      // Let the page resize the card to the new aspect before revealing it.
      onTextureReadyRef.current?.(url, aspect)
      onRenderStatusRef.current?.('ready')
      await nextFrames(2)
      if (sceneReadyRef.current) setVisible(true)
    },
    [disposeTexture, loadTexture, resizeGeometry, setVisible],
  )

  // Renderer / scene lifecycle (rebuilt after a WebGL context restore).
  useEffect(() => {
    if (!canUseWebGL() || prefersReducedMotion()) return undefined
    const container = containerRef.current
    if (!container) return undefined

    contextLostRef.current = false
    hadContextLossRef.current = false
    currentTextureRef.current = null
    currentUrlRef.current = null
    visibleRef.current = false

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
    } catch {
      onRenderStatusRef.current?.('unsupported')
      return undefined
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer

    const canvas = renderer.domElement
    Object.assign(canvas.style, {
      width: '100%',
      height: '100%',
      display: 'block',
      opacity: '0',
      transform: 'scale(0.985)',
      transitionProperty: 'opacity, transform',
      transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      willChange: 'opacity, transform',
    })
    container.appendChild(canvas)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 10)
    camera.position.set(0, 0, 3.2)
    cameraRef.current = camera

    const group = new THREE.Group()
    scene.add(group)

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.9)
    mainLight.position.set(1.2, 1.4, 2.5)
    const rimLight = new THREE.DirectionalLight(0xfff6e0, 0.35)
    rimLight.position.set(-1.5, -0.4, -1.0)
    scene.add(mainLight, rimLight, new THREE.AmbientLight(0xffffff, 0.35))

    const { w, h, d } = meshSizeRef.current
    const woodSide = new THREE.MeshStandardMaterial({ color: '#d8c7a6', roughness: 0.72, metalness: 0.04 })
    const woodTexture = createWoodPlanksTexture()
    const frameBack = new THREE.MeshStandardMaterial({
      color: '#d2c2a5',
      roughness: 0.8,
      metalness: 0.03,
      map: woodTexture ?? undefined,
    })
    const frontHidden = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
    // Box face order: +x, -x, +y, -y, +z (front, covered by the painting), -z (back)
    const boxMaterials = [woodSide, woodSide, woodSide, woodSide, frontHidden, frameBack]
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxMaterials)
    group.add(boxMesh)
    boxMeshRef.current = boxMesh

    const paintingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false, depthWrite: false })
    const painting = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paintingMat)
    painting.position.z = d / 2 + 0.001
    painting.renderOrder = 10
    group.add(painting)
    paintingRef.current = painting

    sceneReadyRef.current = true

    resizeRenderer(renderer, camera, container)
    fitCameraToMesh(camera, container, meshSizeRef.current.w, meshSizeRef.current.h)
    const resizeObserver = new ResizeObserver(() => {
      resizeRenderer(renderer, camera, container)
      fitCameraToMesh(camera, container, meshSizeRef.current.w, meshSizeRef.current.h)
    })
    resizeObserver.observe(container)

    const firstUrl = pendingUrlRef.current ?? latestUrlRef.current
    pendingUrlRef.current = null
    if (firstUrl) void showPainting(firstUrl)

    let raf: number | null = null
    const animate = () => {
      const damping = 0.12
      currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * damping
      currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * damping
      group.rotation.x = currentRotation.current.x
      group.rotation.y = currentRotation.current.y
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    const handleContextLost = (event: Event) => {
      event.preventDefault()
      contextLostRef.current = true
      hadContextLossRef.current = true
      onRenderStatusRef.current?.('context_lost')
      if (raf) cancelAnimationFrame(raf)
      raf = null
    }
    const handleContextRestored = () => {
      onRenderStatusRef.current?.('loading')
      pendingUrlRef.current = latestUrlRef.current || currentUrlRef.current
      setResetToken((n) => n + 1)
    }
    canvas.addEventListener('webglcontextlost', handleContextLost, { passive: false })
    canvas.addEventListener('webglcontextrestored', handleContextRestored)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      sceneReadyRef.current = false
      loadSeqRef.current += 1 // cancel any in-flight swap
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)

      if (!hadContextLossRef.current) {
        boxMesh.geometry.dispose()
        for (const m of boxMaterials) m.dispose()
        woodTexture?.dispose()
        painting.geometry.dispose()
        paintingMat.dispose()
        disposeTexture(currentTextureRef.current)
        renderer.dispose()
      }
      currentTextureRef.current = null
      canvas.remove()
    }
  }, [disposeTexture, resetToken, showPainting])

  // New painting requested.
  useEffect(() => {
    if (!canUseWebGL() || !imageUrl) return
    if (!sceneReadyRef.current) {
      pendingUrlRef.current = imageUrl
      return
    }
    if (imageUrl === currentUrlRef.current && loadSeqRef.current > 0) {
      // Back to the painting already shown: cancel any in-flight swap.
      loadSeqRef.current += 1
      setVisible(true)
      onRenderStatusRef.current?.('ready')
      onTextureReadyRef.current?.(imageUrl, meshSizeRef.current.w / meshSizeRef.current.h)
      return
    }
    void showPainting(imageUrl)
  }, [imageUrl, setVisible, showPainting])

  // Drag to tilt.
  useEffect(() => {
    if (!canUseWebGL()) return undefined
    const container = containerRef.current
    if (!container) return undefined

    const onDown = (e: PointerEvent) => {
      dragState.current = { active: true, startX: e.clientX, startY: e.clientY }
    }
    const onMove = (e: PointerEvent) => {
      if (!dragState.current.active || frozen) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      targetRotation.current.y = THREE.MathUtils.clamp(restRotationRef.current.y + dx * 0.003, -0.38, 0.38)
      targetRotation.current.x = THREE.MathUtils.clamp(restRotationRef.current.x - dy * 0.0026, -0.28, 0.32)
    }
    const onUp = () => {
      dragState.current.active = false
      targetRotation.current = { ...restRotationRef.current }
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

  if (!canUseWebGL()) return null

  return <div ref={containerRef} className="absolute inset-0" style={{ borderRadius: 'inherit' }} aria-hidden />
}

export default Frame3D
