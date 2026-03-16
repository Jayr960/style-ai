import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import GlassCard from "@/components/GlassCard";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as [number, number, number, number] } },
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Planner = () => {
  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl">
          Weekly <span className="gradient-text">Planner</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Plan your outfits for the week ahead</p>
      </motion.div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day, i) => (
          <motion.div key={day} variants={fadeUp}>
            <GlassCard className="p-4 text-center">
              <div className="relative z-10">
                <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">{day}</span>
                <div className="mt-4 flex aspect-[3/4] items-center justify-center rounded-xl border border-dashed border-border">
                  <CalendarDays className="h-6 w-6 text-muted-foreground/40" strokeWidth={1} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">No outfit</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Planner;
