'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from 'js-cookie'

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { BrainCircuit, Fingerprint, Loader2, Lock, ShieldCheck, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { useLogin } from "@/api/endpoints/auth-controller/auth-controller"
import type { ApiResponseAuthResponse } from "@/api/models"

export default function LoginPage() {
  const router = useRouter()

  // 1. Form state
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loginError, setLoginError] = useState("")

   // 2. TanStack Query Mutation
  const loginMutation = useLogin()

  // 3. Submit Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    // Assuming LoginRequest model expects { username, password }
    // Change 'username' to whatever your Spring DTO expects (e.g., email, engineeringId)
    loginMutation.mutate(
      { data: { username, password } },
      {
        onSuccess: (response) => {
          // Note: Depending on how your custom axios instance is setup, 
          // you might need to access response.data.token instead of response.token
          const token = response.token 
          const user = response.user

          if (token) {
            // 4. Store details in cookies
            // If remember me is checked, cookie lasts 1 day. Otherwise, session cookie.
            const cookieOptions = rememberMe ? { expires: 1 } : {}
            
            Cookies.set("auth_token", token, cookieOptions)
            
            if (user) {
              Cookies.set("user_details", JSON.stringify(user), cookieOptions)
            }

            // 5. Redirect to Dashboard
            router.push("/dashboard")
          } else {
            setLoginError("Invalid response from server. No token received.")
          }
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: ApiResponseAuthResponse } }
          setLoginError(
            err?.response?.data?.message || "Authentication failed. Verify credentials."
          )
        },
      }
    )
  }

  return (
    <div className="relative flex min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Left Area - F1 Hero Image Showcase */}
      <div className="relative hidden bg-background lg:block overflow-hidden">
        
        {/* Adjusted to center-left focus to reduce awkward zooming */}
        <Image
          src="/lewis-ham-1.jpg"
          alt="CASPER AI F1 Vehicle Integration"
          fill
          sizes="(max-width: 1024px) 0vw, 100vw"
          className="object-cover object-[20%_center] opacity-85"
          priority
        />
        
        {/* 1. Global blend to the right form area */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-background"></div>
        
        {/* 2. Strong Text Anchor Gradient: Darkens specifically the bottom left corner for text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/20 to-transparent"></div>
        <div className="absolute inset-0 bg-linear-to-r from-background/90 via-transparent to-transparent"></div>

        {/* Floating overlay data/decorations on the image */}
        <div className="absolute bottom-16 left-10 flex max-w-lg flex-col items-start text-white">
          
          {/* Subtle red accent line groups the text together visually */}
          <div className="border-l-4 border-primary pl-6 py-1">
            <Badge
              variant="outline"
              className="font-quicksand mb-4 border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-white/90 uppercase shadow-sm backdrop-blur-md"
            >
              <ShieldCheck className="mr-2 inline-block h-3.5 w-3.5 text-green-400" />
              Level 4 Clearance Required
            </Badge>
            
            <h2 className="font-heading text-4xl leading-[1.15] font-extrabold tracking-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
              Live Telemetry Engine<br/>
              <span className="mt-1 block text-primary">Standby Mode.</span>
            </h2>
            
            <p className="font-google-flex mt-4 max-w-sm text-sm font-medium leading-relaxed text-zinc-300 drop-shadow-md">
              Secure connection protocols engaged. Waiting for active Race
              Engineer authentication to initiate dynamic strategy matrix.
            </p>
          </div>

        </div>
      </div>

      {/* Right Area - Authentication Panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        {/* Back to Home Link */}
        <Link
          href="/"
          className="font-quicksand absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground transition-colors hover:text-foreground lg:right-8 lg:left-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          RETURN
        </Link>

        <div className="mx-auto flex w-full max-w-100 flex-col justify-center space-y-8">
          {/* Header Branding */}
          <div className="flex flex-col space-y-3 text-center sm:text-left">
            <div className="mb-4 flex items-center justify-center gap-2 sm:justify-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-[0_0_20px_-5px_rgba(var(--color-primary-rgb),0.4)]">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bitcount text-2xl font-bold tracking-[0.18em] text-foreground">
                CASPER<span className="text-primary">.AI</span>
              </span>
            </div>

            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Engineer Access
            </h1>
            <p className="font-google-flex text-sm leading-relaxed text-muted-foreground">
              Authenticate via standard protocol or insert your physical
              pit-wall security token to connect.
            </p>
          </div>

          {/* Form */}
          <div className="grid gap-6">
            <form onSubmit={handleLogin}>
              <div className="grid gap-5">
                {/* ID Field */}
                <div className="grid gap-2">
                  <Label
                    htmlFor="id"
                    className="font-quicksand text-xs tracking-wider text-muted-foreground uppercase"
                  >
                    Engineering ID
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ENG-XXXX-XXXX"
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      required
                      className="h-11 border-border/50 bg-muted/40 pl-10 font-mono tracking-widest text-foreground uppercase focus-visible:border-primary/50"
                    />
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  </div>
                </div>

                {/* Password Field */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="font-quicksand text-xs tracking-wider text-muted-foreground uppercase"
                    >
                      Access Code
                    </Label>
                    <Link
                      href="#"
                      className="font-google-flex text-xs font-medium text-primary hover:underline hover:underline-offset-4"
                    >
                      Reset code?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      type="password"
                      autoComplete="current-password"
                      className="h-11 border-border/50 bg-muted/40 pl-10 font-mono tracking-widest text-foreground focus-visible:border-primary/50"
                    />
                    <ShieldCheck className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="my-2 flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked == true)}
                    className="border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <label
                    htmlFor="remember"
                    className="font-google-flex text-xs leading-none font-medium text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Maintain secure session (24h)
                  </label>
                </div>

                {/* Error Message Display */}
                {loginError && (
                  <p className="text-xs font-medium text-destructive">{loginError}</p>
                )}

                {/* <Link 
                  href="/dashboard" 
                  className={buttonVariants({ 
                    className: "mt-2 h-12 w-full font-heading text-base font-semibold tracking-wide shadow-[0_0_20px_-5px_rgba(var(--color-primary-rgb),0.5)] transition-transform duration-300 hover:scale-[1.02]" 
                  })}
                >
                  Initiate Handshake <Zap className="ml-2 h-4 w-4" />
                </Link> */}
                {/* Submit Button (Changed from Link to Button) */}
                <Button 
                  type="submit" 
                  disabled={loginMutation.isPending}
                  className="mt-2 h-12 w-full font-heading text-base font-semibold tracking-wide shadow-[0_0_20px_-5px_rgba(var(--color-primary-rgb),0.5)] transition-transform duration-300 hover:scale-[1.02]"
                >
                  {loginMutation.isPending ? (
                    <>
                      Authenticating... <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      Initiate Handshake <Zap className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="font-quicksand relative flex justify-center text-xs tracking-wider uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Alternative Auth
                </span>
              </div>
            </div>

            {/* Token Hardware Auth Mock */}
            <Button
              variant="outline"
              type="button"
              className="font-google-flex h-12 border-border/70 bg-muted/20 text-sm transition-colors hover:bg-muted/40"
            >
              <Fingerprint className="mr-2 h-5 w-5 text-muted-foreground" />
              Use Biometric Scanner
            </Button>
          </div>

          {/* Form Footer */}
          <div className="mt-8 flex items-center gap-2 text-center font-mono text-xs text-muted-foreground/60 sm:text-left">
            <span>Server Status:</span>
            <span className="flex items-center gap-1 font-semibold text-green-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              ONLINE
            </span>
            <span className="ml-2">v{new Date().getFullYear()}.4.2 (LKA Region)</span>
          </div>
        </div>
      </div>
    </div>
  )
}