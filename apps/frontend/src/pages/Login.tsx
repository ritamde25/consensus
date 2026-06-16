import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useSessionStore } from '@/stores'
import { Mail, Lock } from 'lucide-react'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [authMethod, setAuthMethod] = useState<'magic' | 'password'>('magic')

  const navigate = useNavigate()
  const { isAuthenticated } = useSessionStore()

  if (isAuthenticated) {
    navigate('/')
    return null
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Enter email')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) throw error

      toast.success('Magic link sent')
      setEmail('')
    } catch {
      toast.error('Failed to send link')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Fill all fields')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        })

        if (error) throw error

        toast.success('Check email to confirm')
        setIsSignUp(false)
        setPassword('')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        toast.success('Signed in')
        setPassword('')
      }
    } catch {
      toast.error('Auth failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header (minimal, no marketing hero) */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Consensus</h1>
          <p className="text-xs text-text-muted mt-1">
            Sign in to continue
          </p>
        </div>

        <Card className="border-border bg-surface">
          <CardContent className="p-4 space-y-4">
            {/* Auth method switch */}
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as any)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="magic" className="text-xs">
                  Magic
                </TabsTrigger>
                <TabsTrigger value="password" className="text-xs">
                  Password
                </TabsTrigger>
              </TabsList>

              {/* MAGIC LINK */}
              <TabsContent value="magic" className="space-y-4 pt-4">
                <form onSubmit={handleMagicLinkLogin} className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-text-secondary">
                      Email
                    </Label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />

                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-9 text-xs font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send magic link'}
                  </Button>

                  <p className="text-xs text-text-muted text-center">
                    No password required
                  </p>
                </form>
              </TabsContent>

              {/* PASSWORD */}
              <TabsContent value="password" className="space-y-4 pt-4">
                <form onSubmit={handlePasswordAuth} className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-text-secondary">
                      Email
                    </Label>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />

                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-text-secondary">
                      Password
                    </Label>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />

                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 h-9 text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-9 text-xs font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : isSignUp ? 'Create account' : 'Sign in'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setPassword('')
                    }}
                    className="text-xs text-accent w-full text-center"
                  >
                    {isSignUp ? 'Switch to sign in' : 'Create account'}
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}