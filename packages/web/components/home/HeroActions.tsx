'use client'

import Image from 'next/image'
import { useTransition } from 'react'
import NProgress from 'nprogress'
import { openOrCreateProject } from '@/lib/supabase/projects'

export default function HeroActions() {
  const [isPending, startTransition] = useTransition()

  function handleLaunch() {
    NProgress.start()
    const formData = new FormData()
    formData.set('module', 'board')
    startTransition(async () => {
      try {
        await openOrCreateProject(formData)
      } catch {
        NProgress.done()
      }
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-2 select-none w-full sm:w-auto justify-center items-center">
      <button
        type="button"
        onClick={handleLaunch}
        disabled={isPending}
        className="text-white flex items-center justify-center px-4 py-3 bg-get-started text-base sm:text-xl font-bold gap-2 transition-all duration-500 hover:bg-get-started-hover hover:rounded-xl cursor-pointer group w-full sm:w-auto disabled:opacity-70 disabled:cursor-wait"
      >
        {isPending ? 'Launching...' : 'Launch Editor'}
        <Image
          src="/diagonal-arrow.svg"
          alt="Arrow"
          width={16}
          height={16}
          className="aspect-square"
        />
      </button>
      <button
        className="text-white flex items-center justify-center px-4 py-3 bg-black border-3 border-[#4F6EF7] text-base sm:text-xl font-bold gap-2 transition-all duration-500 hover:rounded-xl cursor-pointer w-full sm:w-auto"
        onClick={() =>
          window.open('https://github.com/Kernel0x19/klyro', '_blank')
        }
      >
        <Image
          src="/github-logo.svg"
          alt="Github-Logo"
          width={24}
          height={24}
          className="aspect-square"
        />
        View on Github
        <Image
          src="/diagonal-arrow.svg"
          alt="Arrow"
          width={16}
          height={16}
          className="aspect-square"
        />
      </button>
    </div>
  )
}
