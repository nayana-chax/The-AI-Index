"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from "motion/react"
import { Search, Lock, Star, ExternalLink, ChevronRight, ChevronDown, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { tools } from "./data/tools"

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30, filter: "blur(10px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(5px)" }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08
    }
  }
}

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          initial={{ 
            x: `${Math.random() * 100}%`, 
            y: `${Math.random() * 100}%`,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
            x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{ 
            duration: Math.random() * 20 + 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  )
}

// Glowing orb component
function GlowingOrb({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: [0.15, 0.25, 0.15],
        scale: [1, 1.1, 1]
      }}
      transition={{ 
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

// Tool data imported from ./data/tools

const categories = ["All", "Research", "Writing", "Design", "Building", "Productivity", "Agents", "Marketing", "Video & Audio"]
const pricingTiers = ["All", "Free", "Freemium", "Paid"]

function getPricingTier(pricing: string): string {
  const p = pricing.toLowerCase()
  if (p === "free" || p === "free/open-source" || p === "free tier" || p === "free/self-host") return "Free"
  if (p.startsWith("free")) return "Freemium"
  return "Paid"
}


function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
      <span className="font-mono text-sm">{rating.toFixed(1)}</span>
    </div>
  )
}

function TickerBar() {
  const items = [
    "The AI Index",
    "5000+ AI Tools",
    "Curated by The Signal",
    "Updated Weekly",
    "Free to Browse Top 150"
  ]
  
  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary via-primary to-primary text-primary-foreground py-2.5 overflow-hidden z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-foreground/5" />
      
      <div className="ticker-wrapper relative">
        <div className="ticker-content">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center">
              {items.map((item, j) => (
                <span key={j} className="flex items-center">
                  <span className="font-mono text-sm font-medium whitespace-nowrap px-4">{item}</span>
                  <Sparkles className="w-3 h-3 text-primary-foreground/50" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        .ticker-wrapper {
          display: flex;
          width: 100%;
        }
        .ticker-content {
          display: flex;
          animation: ticker 25s linear infinite;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
      `}</style>
    </motion.div>
  )
}

export default function AIIndex() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedPricing, setSelectedPricing] = useState("All")
  const [expandedTool, setExpandedTool] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [ctaEmail, setCtaEmail] = useState("")
  const [gateLoading, setGateLoading] = useState(false)
  const [gateMessage, setGateMessage] = useState("")

  useEffect(() => {
    // Check for magic link unlock
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("unlocked") === "IC2026") {
      setIsUnlocked(true)
      // Set cookie for 1 year
      document.cookie = "ai_index_unlocked=true; max-age=31536000; path=/"
    }
    
    // Check for existing cookie
    if (document.cookie.includes("ai_index_unlocked=true")) {
      setIsUnlocked(true)
    }
  }, [])

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = searchQuery === "" || 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tagline.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory
      const matchesPricing = selectedPricing === "All" || getPricingTier(tool.pricing) === selectedPricing

      return matchesSearch && matchesCategory && matchesPricing
    })
  }, [searchQuery, selectedCategory, selectedPricing])

  const visibleTools = filteredTools.slice(0, 150)
  const lockedTools = filteredTools.slice(150)
  const lockedCount = isUnlocked ? 0 : lockedTools.length

  const scrollToDatabase = () => {
    document.getElementById("database")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubscriberCheck = async (emailToCheck: string) => {
    setGateLoading(true)
    setGateMessage("")
    try {
      const res = await fetch("/api/check-subscriber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToCheck }),
      })
      const data = await res.json()
      if (data.status === "subscribed") {
        setIsUnlocked(true)
        document.cookie = "ai_index_unlocked=true; max-age=31536000; path=/"
        setGateMessage("Welcome back! Full index unlocked.")
      } else if (data.status === "new_subscriber") {
        setIsUnlocked(true)
        document.cookie = "ai_index_unlocked=true; max-age=31536000; path=/"
        setGateMessage("Welcome! Opening The Signal for you to subscribe.")
        window.open(`https://innercirclesignal.substack.com/?utm_campaign=ai_index_gate&email=${encodeURIComponent(emailToCheck)}`, "_blank")
      } else {
        setGateMessage("Something went wrong. Please try again.")
      }
    } catch {
      setGateMessage("Something went wrong. Please try again.")
    } finally {
      setGateLoading(false)
    }
  }

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubscriberCheck(email)
  }

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubscriberCheck(ctaEmail)
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border/50"
        initial={{ y: -100, opacity: 0, filter: "blur(10px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">The AI Index</span>
          </motion.div>
          <div className="flex items-center gap-3">
            <a 
              href="https://innercirclesignal.substack.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >

              <span className="hidden sm:inline">The Signal</span>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-14 min-h-[90vh] flex items-center overflow-hidden">
        {/* Animated glowing orbs */}
        <GlowingOrb className="w-[600px] h-[600px] -top-40 -left-40 bg-primary/15 dark:bg-primary/20" delay={0} />
        <GlowingOrb className="w-[500px] h-[500px] top-1/2 -right-40 bg-accent/15 dark:bg-accent/20" delay={2} />
        <GlowingOrb className="w-[400px] h-[400px] -bottom-20 left-1/3 bg-primary/10 dark:bg-primary/15" delay={4} />
        
        {/* Floating particles */}
        <FloatingParticles />
        
        {/* Background typography element with parallax */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span 
            className="font-[family-name:var(--font-display)] text-[25vw] font-black text-foreground/[0.03] leading-none"
            animate={{ 
              textShadow: [
                "0 0 40px oklch(0.75 0.15 175 / 0)",
                "0 0 80px oklch(0.75 0.15 175 / 0.1)",
                "0 0 40px oklch(0.75 0.15 175 / 0)"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            10K
          </motion.span>
        </motion.div>
        
        {/* Animated grid texture */}
        <motion.div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />

        <motion.div 
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <div className="max-w-4xl">
            <motion.h1 
              className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] text-balance"
              variants={fadeInUp}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              5000+ AI Tools.
              <br />
              <motion.span 
                className="text-primary inline-block"
                animate={{ 
                  textShadow: [
                    "0 0 20px oklch(0.75 0.15 175 / 0.3)",
                    "0 0 40px oklch(0.75 0.15 175 / 0.5)",
                    "0 0 20px oklch(0.75 0.15 175 / 0.3)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                One Place.
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Every AI tool worth knowing, categorised, rated, and curated. Free to browse the top 150. Subscribe to unlock the full database.
            </motion.p>

            <motion.div 
              className="mt-10 flex flex-wrap gap-4"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px oklch(0.75 0.15 175 / 0.4)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button 
                  onClick={scrollToDatabase}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center">
                    Browse the Index
                    <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button 
                  variant="outline" 
                  size="lg"
                  asChild
                  className="border-border hover:bg-secondary hover:border-primary/50 font-semibold px-8 transition-all duration-300"
                >
                  <a href="#gate" onClick={(e) => { e.preventDefault(); document.getElementById("gate")?.scrollIntoView({ behavior: "smooth" }) }}>
                    Unlock Full Access
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats bar */}
            <motion.div 
              className="mt-16 flex flex-wrap gap-6 sm:gap-10"
              variants={stagger}
            >
              {[
                { value: "5000+", label: "Tools" },
                { value: "50+", label: "Categories" },
                { value: "Weekly", label: "Updates" },
                { value: "Free", label: "to Browse" }
              ].map((stat, i) => (
                <motion.div 
                  key={i} 
                  className="flex items-baseline gap-2 group cursor-default"
                  variants={fadeInUp}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.span 
                    className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-primary"
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {stat.value}
                  </motion.span>
                  <span className="font-mono text-sm text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Attribution strip */}
      <div className="bg-secondary/50 border-y border-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">

            <span className="text-sm text-muted-foreground">
              Curated by <span className="text-foreground font-medium">The Signal</span>, Inner Circle&apos;s weekly AI newsletter
            </span>
          </div>
          <a 
            href="https://innercirclesignal.substack.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            Updated weekly · Subscribe for full access
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Database Section */}
      <section id="database" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight">AI Tool Index</h2>
          </motion.div>

          {/* Search and filters */}
          <div className="mb-8 flex flex-col gap-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                type="text"
                placeholder="Search tools, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border h-12 font-mono"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category, i) => (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: selectedCategory === category 
                      ? "0 0 20px oklch(0.75 0.15 175 / 0.4)" 
                      : "0 0 10px oklch(0.75 0.15 175 / 0.2)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 text-sm font-mono rounded-md transition-all duration-300 relative overflow-hidden ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  {selectedCategory === category && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    />
                  )}
                  <span className="relative z-10">{category}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-mono text-muted-foreground mr-1">Pricing:</span>
              {pricingTiers.map((tier) => (
                <motion.button
                  key={tier}
                  onClick={() => setSelectedPricing(tier)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all duration-300 relative overflow-hidden ${
                    selectedPricing === tier
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  {selectedPricing === tier && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    />
                  )}
                  <span className="relative z-10">{tier}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tool table */}
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[3rem_1fr_2fr_6rem_5rem_8rem] gap-4 px-4 py-3 bg-secondary/50 border-b border-border text-sm font-mono text-muted-foreground uppercase tracking-wide">
              <span>#</span>
              <span>Tool</span>
              <span>Description</span>
              <span>Users</span>
              <span>Rating</span>
              <span>Pricing</span>
            </div>

            {/* Table rows - Visible tools */}
            <AnimatePresence mode="popLayout">
              {visibleTools.map((tool, index) => (
                <motion.div
                  key={`${tool.name}-${tool.category}`}
                  layout
                  initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{
                    duration: 0.4,
                    delay: Math.min(index * 0.02, 0.3),
                    ease: [0.22, 1, 0.36, 1]
                  }}
                  className="border-b border-border"
                >
                  <div
                    onClick={() => setExpandedTool(expandedTool === `${tool.name}-${tool.category}` ? null : `${tool.name}-${tool.category}`)}
                    className="grid grid-cols-1 md:grid-cols-[3rem_1fr_2fr_6rem_5rem_8rem] gap-2 md:gap-4 px-4 py-4 transition-colors cursor-pointer hover:bg-secondary/30"
                  >
                    <span className="hidden md:block font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>

                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {tool.name}
                      </a>
                      {tool.icPick && (
                        <motion.span
                          className="px-2 py-0.5 text-xs font-mono font-bold bg-primary/20 text-primary rounded relative overflow-hidden"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3, type: "spring" }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          IC Pick
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                          />
                        </motion.span>
                      )}
                      <span className="px-2 py-0.5 text-xs font-mono bg-secondary text-secondary-foreground rounded md:hidden">
                        {tool.category}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-1">{tool.tagline}</p>

                    <div className="flex items-center justify-between md:contents gap-4">
                      <span className="font-mono text-sm text-muted-foreground">{tool.users}</span>
                      <StarRating rating={tool.rating} />
                      <span className="font-mono text-sm text-foreground">{tool.pricing}</span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedTool === `${tool.name}-${tool.category}` && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 md:pl-[calc(3rem+1rem)]">
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                            {tool.description}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Locked tools */}
            {!isUnlocked && lockedTools.length > 0 && (
              <>
                {lockedTools.slice(0, 3).map((_, index) => (
                  <div 
                    key={`locked-${index}`}
                    className="grid grid-cols-1 md:grid-cols-[3rem_1fr_2fr_6rem_5rem_8rem] gap-2 md:gap-4 px-4 py-4 border-b border-border bg-secondary/20 opacity-60"
                  >
                    <span className="hidden md:block font-mono text-sm text-muted-foreground">{String(151 + index).padStart(2, '0')}</span>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-muted-foreground">████████</span>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground blur-sm select-none">██████████████████</span>
                    <span className="font-mono text-sm text-muted-foreground blur-sm select-none">███</span>
                    <span className="font-mono text-sm text-muted-foreground blur-sm select-none">█.█</span>
                    <span className="font-mono text-sm text-muted-foreground blur-sm select-none">$██/mo</span>
                  </div>
                ))}
              </>
            )}

            {/* Unlocked additional tools */}
            {isUnlocked && lockedTools.map((tool, index) => (
              <div key={`${tool.name}-${tool.category}`} className="border-b border-border">
                <div
                  onClick={() => setExpandedTool(expandedTool === `${tool.name}-${tool.category}` ? null : `${tool.name}-${tool.category}`)}
                  className="grid grid-cols-1 md:grid-cols-[3rem_1fr_2fr_6rem_5rem_8rem] gap-2 md:gap-4 px-4 py-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <span className="hidden md:block font-mono text-sm text-muted-foreground">{String(151 + index).padStart(2, '0')}</span>

                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {tool.name}
                    </a>
                    {tool.icPick && (
                      <span className="px-2 py-0.5 text-xs font-mono font-bold bg-primary/20 text-primary rounded">
                        IC Pick
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-1">{tool.tagline}</p>

                  <div className="flex items-center justify-between md:contents gap-4">
                    <span className="font-mono text-sm text-muted-foreground">{tool.users}</span>
                    <StarRating rating={tool.rating} />
                    <span className="font-mono text-sm text-foreground">{tool.pricing}</span>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedTool === `${tool.name}-${tool.category}` && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 md:pl-[calc(3rem+1rem)]">
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                          {tool.description}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Subscribe CTA Section */}
      <section id="gate" className="py-16 sm:py-24 bg-secondary/30 border-y border-border overflow-hidden relative">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
        </div>
        
        <motion.div 
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative"
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Full access. <motion.span 
              className="text-primary inline-block"
              animate={{ 
                textShadow: [
                  "0 0 20px oklch(0.75 0.15 175 / 0.3)",
                  "0 0 40px oklch(0.75 0.15 175 / 0.5)",
                  "0 0 20px oklch(0.75 0.15 175 / 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >Zero cost.</motion.span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The Signal is Inner Circle&apos;s weekly AI newsletter. Subscribe free and unlock the complete AI Index: every tool, every rating, every IC Pick.
          </p>

          {/* Perks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-10 text-left">
            {[
              "Full access to all 5000+ tools",
              "Weekly AI newsletter, no fluff",
              "IC Picks: tools we actually use",
              "Early access to events and community"
            ].map((perk, i) => (
              <motion.div 
                key={i} 
                className="flex items-start gap-3 group"
                initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ x: 4 }}
              >
                <motion.div 
                  className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 relative"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.4, type: "spring", stiffness: 200 }}
                >
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
                <span className="text-sm text-foreground group-hover:text-primary transition-colors duration-300">{perk}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <form onSubmit={handleCtaSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={ctaEmail}
                onChange={(e) => setCtaEmail(e.target.value)}
                required
                disabled={gateLoading}
                className="flex-1 bg-input border-border h-12 font-mono"
              />
              <Button type="submit" disabled={gateLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 px-8">
                {gateLoading ? "Checking..." : "Unlock All"}
                {!gateLoading && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </form>
            {gateMessage && (
              <p className="mt-3 text-sm font-mono text-primary text-center">{gateMessage}</p>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
  
              <span className="font-[family-name:var(--font-display)] font-bold">The AI Index</span>
            </div>
            <p className="text-sm text-muted-foreground text-center sm:text-right">
              Curated by The Signal · Inner Circle · © 2026 Inner Circle
            </p>
          </div>
        </div>
      </footer>

      {/* Ticker bar */}
      <TickerBar />
    </div>
  )
}
