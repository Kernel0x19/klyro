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
      <KMapControls />

      {/* Main content: truth table left, grid center */}
      <div className="flex flex-1 overflow-hidden">
        {/* Truth table */}
        <TruthTableEditor />

        {/* K-Map grid + expression output */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Grid — fills remaining space, aligned top-center */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-8 pt-10">
            <KMapGrid />
          </div>

          {/* Expression output panel */}
          <ExpressionOutput projectId={projectId} userId={userId} />
        </div>
      </div>
    </div>
  )
}
