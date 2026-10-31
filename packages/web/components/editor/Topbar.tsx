import Image from 'next/image'
import ProjectTitle from './topbar/ProjectTitle'
import ModuleSelection from './topbar/ModuleSelection'
import EditorActions from './topbar/EditorOptions'
import Link from 'next/link'
import { Suspense } from 'react'

interface TopbarProps {
  avatarUrl: string | null
  name: string
  projectName?: string
  projectId?: string
}


export default function Topbar({ avatarUrl, name, projectName, projectId }: TopbarProps) {
  return (
    <nav className="w-full h-25 flex items-center justify-between pl-5 pr-12 shrink-0">
      <div className="h-full flex items-center justify-center gap-4 py-4">
        <Link
          href={'/'}
          className="flex items-center justify-center gap-2.5 p-3 cursor-pointer select-none mb-3"
        >
          <Image
            src="/favicon.svg"
            alt="Klyro-Logo"
            width={60}
            height={60}
            className="aspect-square"
          />
          <div className="flex gap-1.5 items-baseline">
            <h1 className="text-4xl font-extrabold">Klyro</h1>
            <h1 className="text-sm font-extrabold">v0.1.0</h1>
          </div>
        </Link>
        <div className="w-0.5 h-full bg-neutral-600" />
        <ProjectTitle initialTitle={projectName} />
      </div>
      <Suspense fallback={null}>
        <ModuleSelection />
      </Suspense>
      <EditorActions avatarUrl={avatarUrl} name={name} />
    </nav>
  )
}
