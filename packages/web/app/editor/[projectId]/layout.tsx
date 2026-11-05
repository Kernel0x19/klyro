import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface EditorLayoutProps {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>
}): Promise<Metadata> {
  const { projectId } = await params
  let projectName = 'Circuit Editor'

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: circuit } = await supabase
        .from('circuits')
        .select('name')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      if (circuit?.name) {
        projectName = circuit.name
      }
    }
  } catch {
    // Fall back to default title if DB query fails or user is guest
  }

  return {
    title: projectName,
    description: `Interactive digital logic circuit editor for ${projectName}. Wire gates, 7400-series ICs, clocks, switches, and probes in real time on Klyro.`,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    openGraph: {
      title: `${projectName} — Digital Logic Simulator | Klyro`,
      description: `Simulate and test ${projectName} in Klyro's browser-based digital logic lab bench.`,
      url: `/editor/${projectId}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${projectName} — Digital Logic Simulator | Klyro`,
      description: `Simulate and test ${projectName} in Klyro's browser-based digital logic lab bench.`,
    },
  }
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  return <>{children}</>
}

