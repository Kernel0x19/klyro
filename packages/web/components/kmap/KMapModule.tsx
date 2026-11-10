'use client'
import KMapControls from './KMapControls'
import TruthTableEditor from './TruthTableEditor'
import KMapGrid from './KMapGrid'
import ExpressionOutput from './ExpressionOutput'

export default function KMapModule() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Controls bar */}
      <KMapControls />

      {/* Main content: truth table left, grid center */}
      <div className="flex flex-1 overflow-hidden">
        {/* Truth table */}
        <TruthTableEditor />

        {/* K-Map grid + expression output */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Grid — centred in remaining space */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6">
            <KMapGrid />
          </div>

          {/* Expression output panel */}
          <ExpressionOutput />
        </div>
      </div>
    </div>
  )
}

