import { motion, useInView, useScroll, useSpring, animate, useMotionValueEvent } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Shirt, Cloud, Moon, Sun, Camera, Brain, ChevronUp, ArrowRight, Star, Instagram, Twitter, Facebook, ShoppingBag, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import useEmblaCarousel from "embla-carousel-react";
import GradientButton from "@/components/GradientButton";

// --- Custom Ripple Wrapper for Buttons ---
function RippleWrapper({ children, className, onClick, ...props }: any) {
  const [ripples, setRipples] = useState<any[]>([]);
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples([...ripples, { x, y, id: Date.now() }]);
    if (onClick) onClick(e);
  };
  return (
    <div className={`relative overflow-hidden cursor-pointer ${className}`} onClick={handleClick} {...props}>
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple-span"
          style={{ left: r.x, top: r.y, transform: "translate(-50%, -50%)", width: 40, height: 40 }}
          onAnimationEnd={() => setRipples((state) => state.filter((rip) => rip.id !== r.id))}
        />
      ))}
    </div>
  );
}

// --- Animated Counter ---
function Counter({ from = 0, to, suffix = "", duration = 2 }: { from?: number, to: number, suffix?: string, duration?: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });
  
  useEffect(() => {
    if (isInView && nodeRef.current) {
      const controls = animate(from, to, {
        duration,
        ease: "easeOut",
        onUpdate(value) {
          nodeRef.current!.textContent = Math.floor(value).toLocaleString() + suffix;
        }
      });
      return () => controls.stop();
    }
  }, [isInView, from, to, suffix, duration]);

  return <span ref={nodeRef}>{from}{suffix}</span>;
}

// --- Mode Toggle ---
function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full border border-border bg-background hover:bg-secondary transition-colors relative overflow-hidden group"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 bg-primary/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 pointer-events-none" />
      {theme === "dark" ? <Sun className="h-5 w-5 relative z-10" /> : <Moon className="h-5 w-5 relative z-10" />}
    </button>
  );
}

// --- Variants ---
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0, 0, 0.2, 1] as [number, number, number, number] } }
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } }
};

// --- Main Landing Page ---
const Landing = () => {
  const navigate = useNavigate();
  const { scrollYProgress, scrollY } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  
  const [navFrosted, setNavFrosted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  useMotionValueEvent(scrollY, "change", (latest) => {
    setNavFrosted(latest > 50);
    setShowBackToTop(latest > 600);
  });

  const [selectedVibe, setSelectedVibe] = useState("Streetwear");
  const vibes = [
    { name: "Streetwear", icon: "🛹" },
    { name: "Minimalist", icon: "⬜" },
    { name: "Casual", icon: "☕" },
    { name: "Preppy", icon: "👔" },
    { name: "Boho", icon: "🌿" },
    { name: "Formal", icon: "✨" },
  ];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center", dragFree: true });
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    // Note: Hover pause functionality can be added here by listening to mouse enter/leave on embla container,
    // but drag interaction pauses naturally in native embla if implemented with the 'embla-carousel-autoplay' plugin.
    // For this simple version, we'll keep the interval running.
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-background text-foreground overflow-hidden selection:bg-primary/30">
      
      {/* Scroll Progress Bar at Top */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 z-[60] origin-left"
        style={{ scaleX, background: "var(--gradient-primary)" }}
      />

      {/* Vibrant Animated Background Mesh */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute inset-0 bg-[#fafafa] dark:bg-background z-[-1]" />
        
        {/* Vibrant violet (top left) */}
        <div 
          className="absolute top-[-15%] left-[-15%] w-[800px] h-[800px] rounded-full opacity-[0.35] blur-[150px] animate-[mesh-blob-1_14s_ease-in-out_infinite] mix-blend-normal dark:opacity-20"
          style={{ background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)" }}
        />
        
        {/* Vibrant coral/pink (top right) */}
        <div 
          className="absolute top-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.45] blur-[140px] animate-[mesh-blob-2_16s_ease-in-out_infinite] mix-blend-normal dark:opacity-20"
          style={{ background: "radial-gradient(circle, #fda4af 0%, transparent 70%)" }}
        />
        
        {/* Soft purple (center left) */}
        <div 
          className="absolute top-[30%] left-[-10%] w-[900px] h-[900px] rounded-full opacity-[0.40] blur-[180px] animate-[mesh-blob-3_12s_ease-in-out_infinite] mix-blend-normal dark:opacity-10"
          style={{ background: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)" }}
        />
        
        {/* Warm rose (bottom right) */}
        <div 
          className="absolute bottom-[-20%] right-[-10%] w-[850px] h-[850px] rounded-full opacity-[0.35] blur-[160px] animate-[mesh-blob-4_15s_ease-in-out_infinite] mix-blend-normal dark:opacity-15"
          style={{ background: "radial-gradient(circle, #fecdd3 0%, transparent 70%)" }}
        />

        {/* Light indigo (bottom left) */}
        <div 
          className="absolute bottom-[-10%] left-[10%] w-[750px] h-[750px] rounded-full opacity-[0.40] blur-[140px] animate-[mesh-blob-5_10s_ease-in-out_infinite] mix-blend-normal dark:opacity-15"
          style={{ background: "radial-gradient(circle, #a5b4fc 0%, transparent 70%)" }}
        />

        {/* Noise overlay texture */}
        <div 
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none z-[1]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
        />
      </div>

      {/* Navbar Sequence */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-between transition-all duration-300 ${navFrosted ? 'backdrop-blur-xl bg-background/60 border-b border-border shadow-sm' : 'bg-transparent'}`}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tighter text-foreground" style={{ fontFamily: "var(--cursive-font)" }}>FitAI</span>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <RippleWrapper className="rounded-full inline-block" onClick={() => navigate("/login")}>
            <button className="text-sm font-medium px-4 py-2 hover:text-primary transition-colors">
              Log in
            </button>
          </RippleWrapper>
          <RippleWrapper className="rounded-full inline-block" onClick={() => navigate("/login?signup=true")}>
            <GradientButton size="sm" className="rounded-full shadow-lg hover:shadow-primary/20">
              Sign up
            </GradientButton>
          </RippleWrapper>
        </div>
      </motion.header>

      {/* Hero Section Sequence */}
      <section className="relative z-10 flex min-h-[95vh] flex-col items-center justify-center px-6 text-center pt-24">
        <div className="max-w-4xl flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="relative">
            <motion.div 
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/50 backdrop-blur px-5 py-2 text-xs font-semibold text-primary uppercase tracking-widest shadow-sm"
              animate={{ y: [0, -6, 0], rotate: [-1, 2, -1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              The Future of Styling
            </motion.div>
          </motion.div>

          <h1 className="text-6xl font-semibold tracking-tight leading-[1.05] sm:text-7xl md:text-8xl text-balance flex flex-col items-center pb-4">
            <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }} className="inline-block">
              Your wardrobe,
            </motion.span>
            <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }} className="text-primary block mt-4 inline-block drop-shadow-sm" style={{ fontFamily: "var(--cursive-font)", fontWeight: 400 }}>
              beautifully synthesized.
            </motion.span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.4, ease: "easeOut" }} className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground font-light leading-relaxed">
            Minimal. Intentional. Intelligent. Upload your clothes and let AI curate perfectly balanced outfits, attuned to your personal aesthetic and local weather.
          </motion.p>
          
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 1.8, ease: "easeOut" }} className="mt-14 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
            <RippleWrapper className="rounded-full inline-block shadow-xl hover:shadow-2xl transition-all" onClick={() => navigate("/login?signup=true")}>
              <div className="relative group overflow-hidden rounded-full">
                <GradientButton size="lg" className="rounded-full px-10 hover:scale-105 transition-transform">
                  Elevate Your Style
                </GradientButton>
                <div className="absolute inset-0 z-10 pointer-events-none w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] translate-x-[-150%] group-hover:animate-[shimmer-sweep_0.8s_ease-in-out_forwards]" />
              </div>
            </RippleWrapper>
            
            <RippleWrapper className="rounded-full inline-block" onClick={() => navigate("/login")}>
              <button className="px-8 py-3 rounded-full text-foreground hover:bg-white/50 dark:hover:bg-secondary/50 transition-colors font-medium border border-transparent hover:border-border">
                Sign In
              </button>
            </RippleWrapper>
          </motion.div>
        </div>
      </section>

      {/* Section 1: Animated Stats Bar */}
      <section className="relative z-10 px-6 py-12">
        <motion.div 
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="max-w-6xl mx-auto glass-card rounded-3xl p-8 border border-border/50 bg-background/40 backdrop-blur-md shadow-lg"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-border/30">
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-[var(--gradient-primary)]">
                <Counter to={10000} suffix="+" />
              </span>
              <span className="text-sm text-muted-foreground mt-2 font-medium">Outfits Generated</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-[var(--gradient-primary)]">
                <Counter to={5000} suffix="+" />
              </span>
              <span className="text-sm text-muted-foreground mt-2 font-medium">Wardrobes Digitized</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-[var(--gradient-primary)]">
                <Counter to={98} suffix="%" />
              </span>
              <span className="text-sm text-muted-foreground mt-2 font-medium">Style Match Rate</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-[var(--gradient-primary)]">
                <Counter to={50} suffix="+" />
              </span>
              <span className="text-sm text-muted-foreground mt-2 font-medium">Supported Styles</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 2: How It Works */}
      <section className="relative z-10 px-6 py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-4xl md:text-5xl font-bold tracking-tight mb-20 inline-block relative">
            <span className="relative z-10">How It Works</span>
            <div className="absolute bottom-1 left-0 right-0 h-3 bg-primary/20 -z-0 rotate-1 rounded-sm" />
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Animated Dashed Line connecting steps (hidden on mobile) */}
            <motion.svg className="absolute top-1/2 left-[15%] w-[70%] h-px -translate-y-1/2 hidden md:block z-0" initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.line x1="0" y1="0" x2="100%" y2="0" stroke="var(--primary)" strokeWidth="2" strokeDasharray="8 8" 
                variants={{ hidden: { strokeDashoffset: 1000, opacity: 0 }, show: { strokeDashoffset: 0, opacity: 0.5, transition: { duration: 2, ease: "linear" } } }} 
              />
            </motion.svg>

            {[
              { icon: Camera, title: "Upload Your Clothes", desc: "Snap a photo. Our AI identifies type, color, and texture instantly." },
              { icon: Brain, title: "AI Learns Your Style", desc: "We analyze your aesthetic and local weather patterns." },
              { icon: Shirt, title: "Get Your Perfect Outfit", desc: "Receive personalized combinations curated just for you." }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.2, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
                className="relative z-10 flex flex-col items-center group glass-card p-10 rounded-3xl bg-background/60 backdrop-blur-xl border-border/40 hover:-translate-y-2 hover:shadow-xl hover:border-primary/30 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 z-[-1] pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] translate-x-[-200%] group-hover:animate-[shimmer-sweep_1s_ease-in-out_forwards]" />
                
                <div className="h-20 w-20 rounded-full bg-secondary border border-border/50 flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] group-hover:border-primary/50 bg-background">
                  <step.icon className="h-8 w-8 text-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground font-light leading-relaxed">{step.desc}</p>
                <div className="mt-6 text-sm font-semibold tracking-widest text-primary/60">STEP 0{i+1}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Feature Showcase */}
      <section className="relative z-10 px-6 py-20 divide-y divide-border/30 max-w-7xl mx-auto overflow-hidden">
        
        {/* Row 1 */}
        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true, margin: "-100px" }} className="py-24 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative h-[400px] w-full rounded-3xl glass border border-border/50 bg-background/40 flex items-center justify-center overflow-hidden">
            <div className="grid grid-cols-2 gap-4 p-8 w-full h-full opacity-60">
              {[1,2,3,4].map(n => (
                <motion.div key={n} className="bg-secondary/80 rounded-2xl border border-border/50" animate={{ scale: [0.95, 1, 0.95], opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, delay: n*0.5, repeat: Infinity }} />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Your Entire Wardrobe, Digitized</h2>
            <p className="text-lg text-muted-foreground font-light leading-relaxed mb-8">
              Take photos of your clothes and let our AI handle the rest. We auto-tag colors, fabrics, and styles, turning your messy closet into a fully searchable database in seconds.
            </p>
            <RippleWrapper className="inline-block"><GradientButton variant="outline" className="rounded-full">Learn More</GradientButton></RippleWrapper>
          </div>
        </motion.div>

        {/* Row 2 */}
        <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true, margin: "-100px" }} className="py-24 grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Outfits Built Around Your Weather</h2>
            <p className="text-lg text-muted-foreground font-light leading-relaxed mb-8">
              Never guess if you need a jacket again. We pull real-time meteorological data and cross-reference it with your digitized closet to build the perfect outfit for the actual temperature outside.
            </p>
            <RippleWrapper className="inline-block"><GradientButton variant="outline" className="rounded-full">See How It Works</GradientButton></RippleWrapper>
          </div>
          <div className="order-1 md:order-2 relative h-[400px] w-full rounded-3xl glass border border-border/50 bg-background/40 flex flex-col items-center justify-center overflow-hidden p-8">
            <div className="w-full max-w-[280px] bg-background shadow-xl rounded-3xl p-6 border border-border/50 relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <span className="font-semibold text-lg">New York</span>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                  <Sun className="h-8 w-8 text-amber-500" />
                </motion.div>
              </div>
              <div className="text-6xl font-bold tracking-tighter mb-2">72°</div>
              <div className="text-muted-foreground">Perfect for a light jacket</div>
              <motion.div animate={{ x: [-10, 10, -10] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 right-10 opacity-20">
                <Cloud className="h-20 w-20" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Row 3 */}
        <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true, margin: "-100px" }} className="py-24 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative h-[400px] w-full rounded-3xl glass border border-border/50 bg-background/40 flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-[280px] bg-background shadow-xl rounded-2xl border border-border/50 flex flex-col overflow-hidden">
              <div className="h-40 bg-secondary/50 relative overflow-hidden group">
                <div className="absolute top-0 bottom-0 w-[200%] -left-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[shimmer-sweep_2s_infinite]" />
              </div>
              <div className="p-5 flex flex-col gap-3">
                <div className="h-4 w-3/4 bg-secondary rounded-full" />
                <div className="h-4 w-1/4 bg-secondary rounded-full mb-4" />
                <button className="w-full py-2 bg-foreground text-background rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-foreground/80 transition-colors">
                  <ShoppingBag className="h-4 w-4" /> Add to Cart
                </button>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Shop What Completes You</h2>
            <p className="text-lg text-muted-foreground font-light leading-relaxed mb-8">
              We identify the missing pieces in your wardrobe. FitAI recommends the exact items you need to unlock dozens of new outfit combinations with the clothes you already own.
            </p>
            <RippleWrapper className="inline-block"><GradientButton variant="outline" className="rounded-full">Update Wardrobe</GradientButton></RippleWrapper>
          </div>
        </motion.div>
      </section>

      {/* Section 4: Style Selector */}
      <section className="relative z-10 px-6 py-32 bg-secondary/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
            What's Your Vibe?
          </motion.h2>
          
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {vibes.map((vibe) => (
              <motion.button
                key={vibe.name}
                variants={fadeUp}
                onClick={() => setSelectedVibe(vibe.name)}
                className={`relative overflow-hidden rounded-2xl p-6 flex flex-col items-center gap-3 transition-all duration-300 border ${selectedVibe === vibe.name ? 'border-primary shadow-[0_0_20px_rgba(124,58,237,0.3)] bg-background scale-105 z-10' : 'border-border/50 bg-background/50 hover:bg-background hover:scale-[1.02]'}`}
              >
                {selectedVibe === vibe.name && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />}
                <span className="text-4xl">{vibe.icon}</span>
                <span className="font-semibold text-foreground tracking-tight">{vibe.name}</span>
              </motion.button>
            ))}
          </motion.div>

          <div className="h-16 flex items-center justify-center mb-10 overflow-hidden">
            <motion.p
              key={selectedVibe}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-medium"
            >
              We'll build your wardrobe around your <span className="bg-clip-text text-transparent bg-[var(--gradient-primary)]">{selectedVibe}</span> vibe.
            </motion.p>
          </div>

          <RippleWrapper className="inline-block rounded-full shadow-lg hover:shadow-xl transition-shadow">
            <GradientButton size="lg" className="rounded-full px-12" onClick={() => navigate("/login?signup=true")}>
              Get Started
            </GradientButton>
          </RippleWrapper>
        </div>
      </section>

      {/* Section 5: Testimonials Carousel */}
      <section className="relative z-10 py-32 overflow-hidden mx-auto max-w-7xl">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center px-6 mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Loved by style enthusiasts</h2>
        </motion.div>
        
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6 pb-10 px-6 cursor-grab active:cursor-grabbing">
            {[1, 2, 3, 4, 5].map((_, idx) => (
              <div key={idx} className="flex-[0_0_85%] min-w-0 sm:flex-[0_0_40%] lg:flex-[0_0_30%]">
                <div className="glass-card bg-background/60 p-8 rounded-3xl border border-border/50 h-full flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300">
                  <div>
                    <div className="flex gap-1 mb-6 text-yellow-400">
                      <Star className="fill-yellow-400 w-5 h-5"/> <Star className="fill-yellow-400 w-5 h-5"/> <Star className="fill-yellow-400 w-5 h-5"/> <Star className="fill-yellow-400 w-5 h-5"/> <Star className="fill-yellow-400 w-5 h-5"/>
                    </div>
                    <p className="text-lg font-light leading-relaxed mb-8">
                      "I used to stare at my closet for 20 minutes every morning. Now FitAI just tells me what to wear and I look better than ever. It perfectly matches the chaotic weather here."
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold ${['bg-red-400', 'bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-amber-400'][idx % 5]}`}>
                      {['JS', 'MK', 'AL', 'TR', 'EC'][idx % 5]}
                    </div>
                    <div>
                      <div className="font-bold">Real User {idx + 1}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Streetwear fan</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Final CTA */}
      <section className="relative z-10 py-40 px-6 text-center overflow-hidden">
        {/* Intense Cluster of Blobs strictly for this section */}
        <div className="absolute inset-0 z-[-1] flex items-center justify-center opacity-60">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] animate-[pulse_6s_infinite]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-accent/20 blur-[120px] animate-[pulse_4s_infinite_reverse]" />
        </div>
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">Your best outfit is <br/><span className="text-primary italic font-serif" style={{ fontFamily: "var(--cursive-font)", fontWeight: 400 }}>one click away</span></h2>
          <p className="text-xl text-muted-foreground font-light mb-12 max-w-2xl mx-auto">
            Join thousands of people who never stress about getting dressed again.
          </p>
          <RippleWrapper className="inline-block relative">
            <div className="absolute inset-0 rounded-full animate-[pulse-glow_2s_ease-in-out_infinite] bg-[var(--gradient-primary)] opacity-50 blur-xl" />
            <GradientButton size="lg" className="rounded-full px-12 py-8 text-xl shadow-2xl relative z-10 hover:scale-105 transition-transform" onClick={() => navigate("/login?signup=true")}>
              Get Started Free
            </GradientButton>
          </RippleWrapper>
        </motion.div>
      </section>

      {/* Modern Expanded Footer */}
      <footer className="relative z-10 border-t border-border/30 bg-background/80 backdrop-blur-md pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 px-4">
          <div className="flex flex-col gap-4 items-start">
            <span className="text-4xl text-foreground font-bold animate-[glimmer-text_4s_ease-in-out_infinite]" style={{ fontFamily: "var(--cursive-font)" }}>FitAI</span>
            <p className="text-muted-foreground font-light max-w-xs leading-relaxed">Your wardrobe, beautifully synthesized. Stop stressing about clothes.</p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-lg mb-2">Platform</h4>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Home</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">How It Works</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Sign Up</a>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-lg mb-2">Social</h4>
            <div className="flex gap-4">
              <a href="#" className="p-3 bg-secondary rounded-full hover:bg-primary/20 hover:text-primary transition-colors"><Instagram className="w-5 h-5"/></a>
              <a href="#" className="p-3 bg-secondary rounded-full hover:bg-primary/20 hover:text-primary transition-colors"><Twitter className="w-5 h-5"/></a>
              <a href="#" className="p-3 bg-secondary rounded-full hover:bg-primary/20 hover:text-primary transition-colors"><Facebook className="w-5 h-5"/></a>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-transparent relative pt-8 flex flex-col items-center">
          <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="text-xs text-muted-foreground font-light tracking-wide">&copy; {new Date().getFullYear()} FitAI. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Back to Top */}
      <motion.button
        animate={{ opacity: showBackToTop ? 1 : 0, y: showBackToTop ? 0 : 30, scale: showBackToTop ? 1 : 0.8 }}
        style={{ pointerEvents: showBackToTop ? "auto" : "none" }}
        className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-[var(--gradient-primary)] text-white shadow-2xl hover:-translate-y-2 transition-transform duration-300 flex items-center justify-center glow-primary"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <ChevronUp className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default Landing;
