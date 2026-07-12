import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { BrainCircuit, Fingerprint, Lock, ShieldCheck, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Left Area - F1 Neon Image Showcase (Hidden on smaller screens) */}
      <div className="relative hidden bg-zinc-900 lg:block">
        <Image
          src="/f1-car-neon.jpg"
          alt="CASPER AI F1 Vehicle Integration"
          fill
          sizes="(max-width: 1024px) 0vw, 100vw"
          className="object-cover opacity-80 mix-blend-lighten"
          priority
        />
        {/* Subtle Gradients to blend the image into the edges */}
        <div className="absolute inset-0 bg-linear-to-r from-background/10 to-background dark:from-background/10 dark:to-background"></div>
        <div className="absolute inset-0 bg-linear-to-t from-background/60 via-transparent to-transparent"></div>

        {/* Floating overlay data/decorations on the image */}
        <div className="absolute bottom-12 left-12 flex flex-col items-start gap-4 text-white">
          <Badge
            variant="outline"
            className="font-quicksand border-white/20 bg-black/40 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] text-white/90 uppercase backdrop-blur-md"
          >
            <ShieldCheck className="mr-2 inline-block h-3 w-3 text-green-400" />
            Level 4 Clearance Required
          </Badge>
          <h2 className="max-w-md font-heading text-4xl leading-[1.1] font-bold text-white shadow-black drop-shadow-xl">
            Live Telemetry Engine
            <span className="mt-1 block text-primary/90">Standby Mode.</span>
          </h2>
          <p className="font-google-flex mt-2 max-w-sm text-sm leading-relaxed font-light text-white/70">
            Secure connection protocols engaged. Waiting for active Race
            Engineer authentication to initiate dynamic strategy matrix.
          </p>
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
            <form>
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
                      id="id"
                      placeholder="ENG-XXXX-XXXX"
                      type="text"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      className="h-11 border-border/50 bg-muted/40 pl-10 font-mono tracking-widest text-foreground uppercase"
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
                      placeholder="••••••••••••"
                      type="password"
                      className="h-11 border-border/50 bg-muted/40 pl-10 font-mono tracking-widest text-foreground"
                    />
                    <ShieldCheck className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  </div>
                </div>

                {/* Remember Me */}
                <div className="my-2 flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    className="border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <label
                    htmlFor="remember"
                    className="font-google-flex text-xs leading-none font-medium text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Maintain secure session (24h)
                  </label>
                </div>

                <Button className="mt-2 h-12 w-full font-heading text-base font-semibold tracking-wide shadow-lg shadow-primary/20 transition-transform duration-300 hover:scale-[1.02]">
                   <Link href="/dashboard">Initiate Handshake <Zap className="ml-2 h-4 w-4" /></Link>
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
          <div className="mt-8 text-center font-mono text-xs text-muted-foreground/60 sm:text-left">
            Server Status:{" "}
            <span className="mr-2 animate-pulse font-semibold text-green-500">
              ONLINE
            </span>
            v{new Date().getFullYear()}.4.2 (LKA Region)
          </div>
        </div>
      </div>
    </div>
  )
}
