'use client'

import Image from 'next/image'
import { openOrCreateProject } from '@/lib/supabase/projects'

export default function HeroActions() {
  return (
    <div className="flex gap-4 mt-2 select-none">
      <form action={openOrCreateProject}>
        <input type="hidden" name="module" value="board" />
        <button
          type="submit"
          className="text-white flex items-center justify-center px-4 py-3 bg-get-started text-xl font-bold gap-2 transition-all duration-500 hover:bg-get-started-hover hover:rounded-xl cursor-pointer group"
        >
          Launch Editor
          <Image
            src="/diagonal-arrow.svg"
            alt="Arrow"
            width={16}
            height={16}
            className="aspect-square"
          />
        </button>
      </form>

      <button
        className="text-white flex items-center justify-center px-4 py-3 bg-black border-3 border-[#4F6EF7] text-xl font-bold gap-2 transition-all duration-500 hover:rounded-xl cursor-pointer"
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
