'use client'
import { useState } from 'react'
import {
  Calendar,
  Camera,
  Mail,
  MapPin,
  Pencil,
  X,
  Loader2,
} from 'lucide-react'
import Image from 'next/image'
import { CircuitHistory } from './CircuitHistory'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface Profile {
  designation?: string | null
  institution?: string | null
  city?: string | null
}

interface Circuit {
  id: string
  name: string
  module: string
  last_edited: string
  project_id: string
}

interface Props {
  user: User
  profile?: Profile | null
  circuits: Circuit[]
}

export default function MainSection({ user, profile, circuits }: Props) {
  const supabase = createClient()

  const router = useRouter()

  const name = user.user_metadata?.full_name ?? user.email ?? 'Anonymous'
  const email = user.email ?? ''
  const avatarUrl = user.user_metadata?.avatar_url ?? null
  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localProfile, setLocalProfile] = useState<Profile>({
    designation: profile?.designation ?? '',
    institution: profile?.institution ?? '',
    city: profile?.city ?? '',
  })
  const [form, setForm] = useState<Profile>({ ...localProfile })

  const formattedCircuits = circuits.map((c) => ({
    id: c.id,
    name: c.name,
    module: c.module,
    lastEdited: new Date(c.last_edited).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    projectId: c.project_id,
  }))

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      designation: form.designation,
      institution: form.institution,
      city: form.city,
      updated_at: new Date().toISOString(),
    })
    if (!error) {
      setLocalProfile({ ...form })
      setEditOpen(false)
    }
    setSaving(false)
  }

  return (
    <section className="relative flex flex-col items-center min-h-[calc(100vh-6rem)] w-full px-15 py-16 select-none gap-10 dark:bg-transparent">
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage:
            'radial-gradient(ellipse at center, black 60%, transparent 90%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 60%, transparent 90%)',
        }}
      />

      <div className="flex flex-col gap-10 w-230">
        {/* Profile card */}
        <div className="flex w-full items-center gap-5 p-7 bg-neutral-100 dark:bg-[#171717] rounded-lg border border-neutral-200 dark:border-transparent">
          <div className="relative h-full">
            {avatarUrl ? (
              <Image
                width={130}
                height={130}
                src={avatarUrl}
                alt="profile-pic"
                className="rounded-full"
              />
            ) : (
              <div className="w-32.5 h-32.5 rounded-full bg-neutral-200 dark:bg-[#262626] flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
                <span className="text-3xl font-bold text-neutral-500 dark:text-neutral-400">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute p-2 rounded-full bg-neutral-200 dark:bg-[#262626] border border-neutral-300 dark:border-neutral-700 top-21 -right-2 hover:cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-900">
              <Camera className="w-5 h-5" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
              {name}
            </h1>

            {/* Designation + institution */}
            {(localProfile.designation || localProfile.institution) && (
              <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium">
                {[localProfile.designation, localProfile.institution]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}

            <div className="flex items-center gap-4 flex-wrap mt-1">
              <span className="text-base font-bold text-neutral-500 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {email}
              </span>
              {localProfile.city && (
                <span className="text-base font-bold text-neutral-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {localProfile.city}
                </span>
              )}
              <span className="text-base font-bold text-neutral-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Joined {joinedDate}
              </span>
            </div>
          </div>

          <div className="h-full flex items-start">
            <button
              onClick={() => {
                setForm({ ...localProfile })
                setEditOpen(true)
              }}
              className="p-2 rounded-lg bg-neutral-200 dark:bg-[#262626] border border-neutral-300 dark:border-neutral-700 hover:cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-900"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Circuit history */}
        <div className="flex w-full p-7 bg-neutral-100 dark:bg-[#171717] rounded-lg border border-neutral-200 dark:border-transparent">
          <CircuitHistory
            circuits={formattedCircuits}
            onOpen={(projectId) => router.push(`/editor/${projectId}`)}
          />
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1a1a1a] border border-neutral-700/60 rounded-2xl p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white "
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {[
                {
                  label: 'Designation',
                  key: 'designation',
                  placeholder: 'e.g. Student, Engineer',
                },
                {
                  label: 'Institution',
                  key: 'institution',
                  placeholder: 'e.g. MIT, Google',
                },
                {
                  label: 'City',
                  key: 'city',
                  placeholder: 'e.g. Pune, Mumbai',
                },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-neutral-300">
                    {label}
                  </label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={(form as Record<string, string>)[key] ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="px-4 py-2.5 bg-[#111111] text-white border border-neutral-700/60 rounded-lg outline-none transition-all duration-200 focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 placeholder:text-neutral-600"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-neutral-400 hover:text-white bg-neutral-800 rounded-lg "
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-bold bg-[#4F6EF7] hover:bg-[#3A57E8] disabled:opacity-60 text-white rounded-lg  flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
