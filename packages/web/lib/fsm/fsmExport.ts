/**
 * Klyro — ReactFlow Canvas Export Utility
 *
 * Captures the interactive ReactFlow canvas (FSM state diagrams, ASM charts, or breadboard circuits)
 * as a high-resolution PNG image:
 * - Computes the collective bounding box of all active nodes
 * - Automatically fits and centers the entire diagram into a fixed 1600x900 viewport
 * - Ensures all elements are cleanly visible without clipping, regardless of current user zoom/pan
 * - Filters out controls, minimaps, and temporary UI panels
 */

import { toPng } from 'html-to-image'

/** Minimum rectangular node representation required for bounding box calculations */
export interface BoundingBoxNode {
  position: { x: number; y: number }
  width?: number
  height?: number
}

// ── Export Dimensions & Margins ──────────────────────────────────────────────
const EXPORT_WIDTH = 1600
const EXPORT_HEIGHT = 900
const VIEWPORT_PADDING = 120
const MIN_SCALE = 0.2
const MAX_SCALE = 2.0
const RETINA_PIXEL_RATIO = 2

/**
 * Exports a ReactFlow canvas container to a high-resolution PNG (1600x900)
 * framing all nodes perfectly in the center regardless of current canvas pan/zoom.
 *
 * @param container The DOM element enclosing the ReactFlow wrapper
 * @param nodes Array of nodes with position and dimensions
 * @param filename Download file name (e.g., "fsm-diagram.png")
 * @param isDark Whether dark theme background (#080c14) should be applied
 * @param defaultNodeSize Fallback node dimensions when node.width/height is unset
 */
export async function exportReactFlowToPng(
  container: HTMLElement,
  nodes: BoundingBoxNode[],
  filename: string,
  isDark: boolean,
  defaultNodeSize = { width: 96, height: 96 }
): Promise<void> {
  const viewportEl = container.querySelector('.react-flow__viewport') as HTMLElement | null
  if (!viewportEl) {
    // Fallback to container capture if viewport element is not found
    const dataUrl = await toPng(container, {
      backgroundColor: isDark ? '#080c14' : '#ffffff',
      pixelRatio: RETINA_PIXEL_RATIO,
    })
    downloadDataUrl(dataUrl, filename)
    return
  }

  // 1. Calculate the aggregate bounding box of all nodes
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const n of nodes) {
    const w = n.width ?? defaultNodeSize.width
    const h = n.height ?? defaultNodeSize.height
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
    maxX = Math.max(maxX, n.position.x + w)
    maxY = Math.max(maxY, n.position.y + h)
  }

  // If no nodes exist, center on default empty space
  if (!isFinite(minX)) {
    minX = 0
    minY = 0
    maxX = 400
    maxY = 300
  }

  // 2. Compute zoom scale so all nodes fit inside target dimensions minus padding
  const contentW = maxX - minX
  const contentH = maxY - minY
  const zoomX = (EXPORT_WIDTH - VIEWPORT_PADDING * 2) / Math.max(contentW, 10)
  const zoomY = (EXPORT_HEIGHT - VIEWPORT_PADDING * 2) / Math.max(contentH, 10)
  const zoom = Math.min(Math.max(Math.min(zoomX, zoomY), MIN_SCALE), MAX_SCALE)

  // 3. Center the bounding box within the export canvas
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const x = EXPORT_WIDTH / 2 - centerX * zoom
  const y = EXPORT_HEIGHT / 2 - centerY * zoom

  // 4. Render viewport element with temporary transform
  const dataUrl = await toPng(viewportEl, {
    backgroundColor: isDark ? '#080c14' : '#ffffff',
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    pixelRatio: RETINA_PIXEL_RATIO,
    style: {
      width: `${EXPORT_WIDTH}px`,
      height: `${EXPORT_HEIGHT}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
    },
    filter: (node) => {
      // Exclude controls, minimap, or helper panels from export
      const cl = node?.classList
      if (cl?.contains('react-flow__controls')) return false
      if (cl?.contains('react-flow__minimap')) return false
      if (cl?.contains('react-flow__panel')) return false
      return true
    },
  })

  downloadDataUrl(dataUrl, filename)
}

/**
 * Triggers a client-side file download of a Base64 data URL.
 *
 * @param dataUrl Image data URL
 * @param filename File name for the download
 */
function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

