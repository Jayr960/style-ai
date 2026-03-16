import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Shirt, Cloud, ShoppingBag, Zap, Eye } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0, 0, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const features = [
  { icon: Shirt, title: "AI Wardrobe", desc: "Upload any clothing item. Gemini Vision digitizes it instantly with type, color, style, and season." },
  { icon: Cloud, title: "Weather-Aware", desc: "Real-time weather integration ensures every outfit matches your local conditions perfectly." },
  { icon: Sparkles, title: "Smart Outfits", desc: "AI-generated outfit combinations from your actual wardrobe, styled to your personal taste." },
  { icon: ShoppingBag, title: "Shop Gaps", desc: "Discover what's missing from your wardrobe with AI-powered shopping recommendations." },
  { icon: Zap, title: "Weekly Planner", desc: "Auto-generate a full week of outfits with one tap. Each day accounts for the weather forecast." },
  { icon: Eye, title: "Style Profile", desc: "Define your aesthetic. FitAI learns your vibe and curates every look around it." },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Aurora blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/4 h-[800px] w-[800px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/4 h-[600px] w-[600px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #ff4d6d 0%, transparent 70%)" }}
          animate={{ x: [0, -40, 0], y: [0, -60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Nav */}
      <motion.nav
        className="glass fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4"
        initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
      >
        <span className="text-xl font-bold tracking-tighter gradient-text">FitAI</span>
        <div className="flex items-center gap-3">
          <motion.button
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
          >
            Sign In
          </motion.button>
          <GradientButton size="sm" onClick={() => navigate("/login?signup=true")}>
            Get Started
          </GradientButton>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-3xl">
          <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-violet" strokeWidth={1.5} />
            AI-Powered Personal Styling
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl font-bold tracking-tighter leading-[1.1] sm:text-7xl">
            Your wardrobe,{" "}
            <span className="gradient-text">synthesized.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Upload your clothes. Let AI curate outfits based on your style, the weather, and the occasion. Never wonder what to wear again.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <GradientButton size="lg" onClick={() => navigate("/login?signup=true")}>
              Start Your Wardrobe
            </GradientButton>
            <GradientButton size="lg" variant="outline" onClick={() => navigate("/login")}>
              Sign In
            </GradientButton>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 pb-32">
        <AnimatedSection className="mx-auto max-w-5xl">
          <motion.h2 variants={fadeUp} className="mb-12 text-center text-3xl font-bold tracking-tighter sm:text-4xl">
            Everything you need to{" "}
            <span className="gradient-text">dress smarter</span>
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <GlassCard className="p-6">
                  <div className="relative z-10">
                    <div className="mb-4 inline-flex rounded-xl bg-secondary p-3">
                      <f.icon className="h-5 w-5 text-violet" strokeWidth={1.5} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold tracking-tight">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-32">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Ready to <span className="gradient-text">transform</span> your style?
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-muted-foreground">
            Join thousands who have elevated their wardrobe with AI-powered outfit curation.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8">
            <GradientButton size="lg" onClick={() => navigate("/login?signup=true")}>
              Get Started Free
            </GradientButton>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <span className="gradient-text font-semibold">FitAI</span> · Your wardrobe, synthesized.
      </footer>
    </div>
  );
};

export default Landing;
