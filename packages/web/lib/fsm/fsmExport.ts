import { toPng } from 'html-to-image'

export interface BoundingBoxNode {
  position: { x: number; y: number }
  width?: number
  height?: number
}

/**
 * Exports a ReactFlow canvas to a high-resolution PNG (1600x900)
 * framing all nodes perfectly in the center regardless of current pan/zoom.
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
    // Fallback to container capture if viewport not found
    const dataUrl = await toPng(container, {
      backgroundColor: isDark ? '#080c14' : '#ffffff',
      pixelRatio: 2,
    })
    downloadDataUrl(dataUrl, filename)
    return
  }

  const targetW = 1600
  const targetH = 900
  const padding = 120

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

  // If no nodes, default to centered origin
  if (!isFinite(minX)) {
    minX = 0
    minY = 0
    maxX = 400
    maxY = 300
  }

  const contentW = maxX - minX
  const contentH = maxY - minY
  const zoomX = (targetW - padding * 2) / Math.max(contentW, 10)
  const zoomY = (targetH - padding * 2) / Math.max(contentH, 10)
  const zoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.2), 2.0)

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const x = targetW / 2 - centerX * zoom
  const y = targetH / 2 - centerY * zoom

  const dataUrl = await toPng(viewportEl, {
    backgroundColor: isDark ? '#080c14' : '#ffffff',
    width: targetW,
    height: targetH,
    pixelRatio: 2,
    style: {
      width: `${targetW}px`,
      height: `${targetH}px`,
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

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
