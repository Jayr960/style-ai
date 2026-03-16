import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cloud, Thermometer, Droplets, Wind, Sparkles, Plus, Shirt } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const Dashboard = () => {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.email?.split("@")[0] || "");
    });
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      {/* Hero */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
          {getGreeting()},{" "}
          <span className="gradient-text">{userName || "there"}</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Your wardrobe, synthesized.</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Weather Widget */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-6">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">Current Weather</span>
                <Cloud className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-bold tabular-nums">62°</span>
                <span className="mb-1 text-sm text-muted-foreground">Overcast</span>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Droplets className="h-3 w-3" strokeWidth={1.5} /> 72%</span>
                <span className="flex items-center gap-1"><Wind className="h-3 w-3" strokeWidth={1.5} /> 8 mph</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-6">
            <div className="relative z-10">
              <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">Wardrobe</span>
              <div className="mt-4 flex items-end gap-2">
                <motion.span
                  className="text-4xl font-bold tabular-nums gradient-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  0
                </motion.span>
                <span className="mb-1 text-sm text-muted-foreground">items</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Upload your first item to get started</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Style */}
        <motion.div variants={fadeUp}>
          <GlassCard className="p-6">
            <div className="relative z-10">
              <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">Current Vibe</span>
              <p className="mt-4 text-lg font-semibold">Set up your style</p>
              <p className="mt-1 text-xs text-muted-foreground">Complete onboarding to personalize</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Generate CTA */}
      <motion.div variants={fadeUp} className="mt-8">
        <GlassCard hover={false} className="flex flex-col items-center justify-center p-12 text-center">
          <div className="relative z-10">
            <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-violet/20 to-coral/10 p-4">
              <Sparkles className="h-8 w-8 text-violet" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold tracking-tighter">Generate Your First Outfit</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Upload at least 3 clothing items, then let AI create the perfect outfit for today's weather.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
              <GradientButton size="lg" onClick={() => navigate("/dashboard/wardrobe")}>
                <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Add Clothes
              </GradientButton>
              <GradientButton size="lg" variant="outline" disabled>
                <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Generate Outfit
              </GradientButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
