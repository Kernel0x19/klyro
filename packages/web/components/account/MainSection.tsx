'use client'

import { useState } from 'react'
import {
  Calendar,
  Camera,
  MapPin,
  Building,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import Image from 'next/image'
import NProgress from 'nprogress'
import { CircuitHistory } from './CircuitHistory'
import AvatarUploadModal from './AvatarUploadModal'
import SecurityCard from './SecurityCard'
import DeleteAccountModal from './DeleteAccountModal'
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
  const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User'
  const email = user.email ?? ''
  const avatarUrl = user.user_metadata?.avatar_url ?? null

  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(avatarUrl)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  // Profile Form state
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [form, setForm] = useState({
    designation: profile?.designation ?? '',
    institution: profile?.institution ?? '',
    city: profile?.city ?? '',
  })

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

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    NProgress.start()
    setProfileSuccess(null)
    setProfileError(null)

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      designation: form.designation.trim() || null,
      institution: form.institution.trim() || null,
      city: form.city.trim() || null,
      updated_at: new Date().toISOString(),
    })

    setSavingProfile(false)
    NProgress.done()

    if (error) {
      setProfileError(error.message)
    } else {
      setProfileSuccess('Profile details updated successfully.')
      setTimeout(() => setProfileSuccess(null), 3500)
    }
  }

  return (
    <section className="relative flex flex-col items-center min-h-[calc(100vh-6rem)] w-full px-4 sm:px-8 lg:px-12 py-10 select-none dark:bg-transparent">
      {/* Background workbench grid */}
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

      <div className="flex flex-col gap-8 w-full max-w-4xl">
        
        {/* Page Title & Header */}
        <div className="flex flex-col gap-1.5 pb-2">
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Account Settings
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage your personal profile, credentials, active sessions, and logic simulation workspace.
          </p>
        </div>

        {/* 1. Profile Details Card (Supabase style) */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
          <form onSubmit={handleSaveProfile}>
            <div className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Profile Details
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    Your avatar and public details across your Klyro lab bench.
                  </p>
                </div>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {joinedDate}
                </span>
              </div>

              {/* Avatar + Main Details */}
              <div className="mt-6 flex flex-col sm:flex-row items-start gap-6">
                
                {/* Avatar with hover upload trigger */}
                <div className="relative group shrink-0">
                  {currentAvatarUrl ? (
                    <Image
                      width={100}
                      height={100}
                      src={currentAvatarUrl}
                      alt="Profile picture"
                      unoptimized
                      className="rounded-full w-24 h-24 object-cover ring-2 ring-neutral-200 dark:ring-neutral-800"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-neutral-200 dark:bg-[#262626] flex items-center justify-center ring-2 ring-neutral-200 dark:ring-neutral-800">
                      <span className="text-3xl font-bold text-neutral-500 dark:text-neutral-400">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setAvatarModalOpen(true)}
                    title="Change Profile Picture"
                    className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-2xs"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      disabled
                      className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-[#1A1A1A] text-neutral-500 dark:text-neutral-400 text-sm cursor-not-allowed"
                    />
                    <span className="text-[11px] text-neutral-400">
                      Synced from your initial sign-up credentials.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                      Designation / Role
                    </label>
                    <input
                      type="text"
                      value={form.designation}
                      onChange={(e) =>
                        setForm({ ...form, designation: e.target.value })
                      }
                      placeholder="e.g. Student, Hardware Engineer"
                      className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1E1E1E] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-neutral-400" />
                      Institution / Organization
                    </label>
                    <input
                      type="text"
                      value={form.institution}
                      onChange={(e) =>
                        setForm({ ...form, institution: e.target.value })
                      }
                      placeholder="e.g. MIT, Google, Self"
                      className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1E1E1E] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. San Francisco, Berlin, Tokyo"
                      className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#1E1E1E] text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#4F6EF7] text-sm"
                    />
                  </div>
                </div>

              </div>

              {profileError && (
                <div className="mt-4 text-xs text-red-500 font-medium">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-500 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  {profileSuccess}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-neutral-50 dark:bg-[#181818] border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span>Your profile information is visible across your digital circuit projects.</span>
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#4F6EF7] hover:bg-[#3D5CE8] disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* 2. Security & Credentials (Change Email, Change Password, Sessions) */}
        <SecurityCard user={user} />

        {/* 3. Circuit History Card */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
          <div className="p-6">
            <CircuitHistory
              circuits={formattedCircuits}
              onOpen={(projectId) => {
                NProgress.start()
                router.push(`/editor/${projectId}`)
              }}
            />
          </div>
        </div>

        {/* 4. Danger Zone Card (Supabase / GitHub style) */}
        <div className="rounded-xl border border-red-500/30 dark:border-red-500/20 bg-white dark:bg-[#141414] shadow-xs overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                Danger Zone
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mt-3">
              Delete Account
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              Permanently delete your Klyro user account, profile settings, and all saved digital logic circuits. This action is instantaneous and cannot be reversed.
            </p>
          </div>

          <div className="px-6 py-4 bg-red-500/5 dark:bg-red-500/10 border-t border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-600 dark:text-red-400">
            <span>Make sure you have exported any circuit designs you wish to keep before proceeding.</span>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>

      </div>

      {/* Modals */}
      <AvatarUploadModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        currentAvatarUrl={currentAvatarUrl}
        userName={name}
        onAvatarUpdated={(newUrl) => setCurrentAvatarUrl(newUrl)}
      />

      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        userEmail={email}
      />
    </section>
  )
}
