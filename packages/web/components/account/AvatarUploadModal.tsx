'use client'

import React, { useState, useRef } from 'react'
import { X, Upload, Link as LinkIcon, Loader2, Camera, AlertCircle, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentAvatarUrl: string | null
  userName: string
  onAvatarUpdated: (newAvatarUrl: string) => void
}

export default function AvatarUploadModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  userName,
  onAvatarUpdated,
}: Props) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [directUrl, setDirectUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (file: File) => {
    setError(null)
    setSuccess(false)
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.')
      return
    }
    setSelectedFile(file)
    const objUrl = URL.createObjectURL(file)
    setPreviewUrl(objUrl)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  const handleSave = async () => {
    setError(null)
    setUploading(true)

    try {
      if (tab === 'upload') {
        if (!selectedFile) {
          setError('Please select an image file first.')
          setUploading(false)
          return
        }

        const formData = new FormData()
        formData.append('file', selectedFile)

        const res = await fetch('/api/avatar/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to upload avatar.')
        }

        setSuccess(true)
        onAvatarUpdated(data.publicUrl)
        setTimeout(() => {
          onClose()
        }, 600)
      } else {
        // Direct URL mode
        if (!directUrl.trim()) {
          setError('Please enter a valid image URL.')
          setUploading(false)
          return
        }

        const supabase = createClient()
        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: directUrl.trim() },
        })

        if (updateError) {
          throw new Error(updateError.message)
        }

        setSuccess(true)
        onAvatarUpdated(directUrl.trim())
        setTimeout(() => {
          onClose()
        }, 600)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving avatar.')
    } finally {
      setUploading(false)
    }
  }

  const activePreview =
    tab === 'upload' ? previewUrl || currentAvatarUrl : directUrl || currentAvatarUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-md bg-neutral-100 dark:bg-[#171717] border border-neutral-300 dark:border-neutral-700/60 rounded-2xl p-6 sm:p-7 flex flex-col gap-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-200 dark:bg-[#262626] text-[#4F6EF7]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight">
                Change Profile Picture
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Upload a new photo or provide an image link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-neutral-200 dark:bg-[#111111] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setTab('upload')
              setError(null)
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'upload'
                ? 'bg-white dark:bg-[#262626] text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('url')
              setError(null)
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'url'
                ? 'bg-white dark:bg-[#262626] text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Image Link
          </button>
        </div>

        {/* Preview & Upload Zone */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#4F6EF7] bg-neutral-200 dark:bg-[#262626] flex items-center justify-center shadow-md">
              {activePreview ? (
                <Image
                  src={activePreview}
                  alt="Avatar Preview"
                  width={96}
                  height={96}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-neutral-500 dark:text-neutral-400">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {tab === 'upload' && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Browse</span>
              </button>
            )}
          </div>

          {tab === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full p-5 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? 'border-[#4F6EF7] bg-[#4F6EF7]/10'
                  : 'border-neutral-300 dark:border-neutral-700 hover:border-[#4F6EF7] bg-neutral-50 dark:bg-[#111111]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0])
                  }
                }}
              />
              <Upload className="w-6 h-6 text-[#4F6EF7] mb-1" />
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {selectedFile ? selectedFile.name : 'Click to upload or drag & drop'}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'PNG, JPG, WEBP or GIF (Max 5MB)'}
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Public Image URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/avatar.png"
                value={directUrl}
                onChange={(e) => {
                  setDirectUrl(e.target.value)
                  setError(null)
                }}
                className="w-full px-3.5 py-2 text-xs bg-neutral-200 dark:bg-[#111111] dark:text-white border border-neutral-300 dark:border-neutral-700/60 rounded-lg outline-none transition-all focus:border-[#4F6EF7] focus:ring-2 focus:ring-[#4F6EF7]/20 placeholder:text-neutral-500"
              />
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Direct link to an image hosted on GitHub, Imgur, or cloud storage
              </p>
            </div>
          )}
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-500">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Avatar updated successfully!</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-2.5 justify-end mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-200 dark:bg-[#262626] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={uploading}
            className="px-4 py-2 text-xs font-bold bg-[#4F6EF7] hover:bg-[#3A57E8] disabled:opacity-60 text-white rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#4F6EF7]/20"
          >
            {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {uploading ? 'Saving...' : 'Save Avatar'}
          </button>
        </div>
      </div>
    </div>
  )
}
