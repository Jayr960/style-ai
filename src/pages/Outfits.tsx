import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } },
};

const Outfits = () => {
  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl">
          AI <span className="gradient-text">Outfits</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Generated outfit combinations from your wardrobe</p>
      </motion.div>

      <motion.div variants={fadeUp} className="mt-12">
        <GlassCard hover={false} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative z-10">
            <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-violet/20 to-coral/10 p-6">
              <Sparkles className="h-10 w-10 text-violet" strokeWidth={1} />
            </div>
            <h3 className="text-xl font-semibold tracking-tight">No outfits generated yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Add at least 3 items to your wardrobe, then generate AI-curated outfits based on your style and the weather.
            </p>
            <div className="mt-6">
              <GradientButton disabled>
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

export default Outfits;
