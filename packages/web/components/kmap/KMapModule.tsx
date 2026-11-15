'use client'
import KMapControls from './KMapControls'
import TruthTableEditor from './TruthTableEditor'
import KMapGrid from './KMapGrid'
import ExpressionOutput from './ExpressionOutput'
import KMapPersistenceSync from './KMapPersistenceSync'

interface KMapModuleProps {
  projectId?: string
  userId?: string | undefined
}

export default function KMapModule({ projectId, userId }: KMapModuleProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Persistence sync — only when logged in */}
      {projectId && userId && (
        <KMapPersistenceSync projectId={projectId} userId={userId} />
      )}

      {/* Controls bar */}
      <KMapControls projectId={projectId} />

      {/* Main content: truth table left, grid center */}
      <div id="kmap-export-area" className="flex flex-1 overflow-hidden bg-bg">
        {/* Truth table */}
        <TruthTableEditor />

        {/* K-Map grid + expression output */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Grid — fills remaining space, centered horizontally & vertically */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6">
            <KMapGrid />
          </div>

          {/* Expression output panel */}
          <ExpressionOutput projectId={projectId} userId={userId} />
        </div>
      </div>
    </div>
  )
}
