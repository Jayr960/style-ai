import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import GlassCard from "@/components/GlassCard";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as [number, number, number, number] } },
};

const Shop = () => {
  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl">
          Shop <span className="gradient-text">Recommendations</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">AI-powered suggestions to complete your wardrobe</p>
      </motion.div>

      <motion.div variants={fadeUp} className="mt-12">
        <GlassCard hover={false} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative z-10">
            <div className="mb-6 inline-flex rounded-2xl bg-secondary p-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" strokeWidth={1} />
            </div>
            <h3 className="text-xl font-semibold tracking-tight">No recommendations yet</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Build your wardrobe first, then AI will identify gaps and suggest items to complete your style.
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default Shop;
