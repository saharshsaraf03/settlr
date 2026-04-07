import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const AVATARS = [
  { id: 'avatar_01', emoji: '😊' },
  { id: 'avatar_02', emoji: '😎' },
  { id: 'avatar_03', emoji: '🤓' },
  { id: 'avatar_04', emoji: '😄' },
  { id: 'avatar_05', emoji: '🥳' },
  { id: 'avatar_06', emoji: '😇' },
  { id: 'avatar_07', emoji: '🤩' },
  { id: 'avatar_08', emoji: '😋' },
  { id: 'avatar_09', emoji: '🧐' },
  { id: 'avatar_10', emoji: '😏' },
  { id: 'avatar_11', emoji: '🤗' },
  { id: 'avatar_12', emoji: '😴' },
]

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(30, 'Display name must be 30 characters or fewer'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function SetupProfilePage() {
  const navigate = useNavigate()
  const { user, profile, refetchProfile } = useAuth()
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_01')
  const [apiError, setApiError] = useState('')

  // Redirect if profile already exists
  useEffect(() => {
    if (profile) {
      navigate('/dashboard', { replace: true })
    }
  }, [profile, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '' },
  })

  async function onSubmit(values: ProfileFormValues) {
    if (!user) return
    setApiError('')

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: values.displayName,
      avatar_id: selectedAvatar,
    })

    if (error) {
      setApiError(error.message)
      return
    }

    await refetchProfile()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
            <circle cx="18" cy="18" r="16" stroke="#00D4AA" strokeWidth="2.5" />
            <path d="M18 2 A16 16 0 0 1 18 34 Z" fill="#00D4AA" />
          </svg>
          <span className="text-2xl font-bold tracking-tight text-white">Settlr</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white">Set up your profile</h1>
            <p className="text-sm text-slate-400 mt-1">Choose how you appear to your group members</p>
          </div>

          {apiError && (
            <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-sm text-[#FF6B6B]">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-slate-300">
                Display name
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="How should we call you?"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-[#00D4AA]/50 focus-visible:border-[#00D4AA]"
                {...register('displayName')}
              />
              {errors.displayName && (
                <p className="text-xs text-[#FF6B6B]">{errors.displayName.message}</p>
              )}
            </div>

            {/* Avatar Picker */}
            <div className="space-y-3">
              <Label className="text-slate-300">Choose your avatar</Label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map(({ id, emoji }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedAvatar(id)}
                    className={cn(
                      'flex items-center justify-center w-full aspect-square rounded-xl text-2xl transition-all duration-150',
                      'bg-slate-800 hover:bg-slate-700 border-2',
                      selectedAvatar === id
                        ? 'border-[#00D4AA] ring-2 ring-[#00D4AA]/30 scale-110'
                        : 'border-transparent'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#00D4AA] hover:bg-[#00BF99] text-slate-900 font-semibold disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Continue to dashboard'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
