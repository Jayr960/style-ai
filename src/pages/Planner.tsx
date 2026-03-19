import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Sparkles } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import GradientButton from "@/components/GradientButton";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as [number, number, number, number] } },
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface PlannerEntry {
  day_of_week: string;
  outfit_data: {
    outfit_name?: string;
    occasion?: string;
    reasoning?: string;
    outfit_image_url?: string;
    item_ids?: string[];
  };
  outfit_id: string | null;
}

const Planner = () => {
  const [entries, setEntries] = useState<Record<string, PlannerEntry>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    return monday.toISOString().split("T")[0];
  };

  const fetchPlanner = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const weekStart = getWeekStart();
    const { data } = await supabase
      .from("weekly_planner")
      .select("day_of_week, outfit_data, outfit_id")
      .eq("user_id", user.id)
      .eq("week_start", weekStart);

    if (data) {
      const map: Record<string, PlannerEntry> = {};
      data.forEach((entry: any) => {
        map[entry.day_of_week] = entry as PlannerEntry;
      });
      setEntries(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlanner(); }, [fetchPlanner]);

  const hasAnyOutfits = Object.keys(entries).length > 0;

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl">
          Weekly <span className="gradient-text">Planner</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasAnyOutfits ? "Your AI-generated outfits for the week" : "Plan your outfits for the week ahead"}
        </p>
      </motion.div>

      {loading ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((day, i) => {
            const entry = entries[day];
            const outfitData = entry?.outfit_data;

            return (
              <motion.div key={day} variants={fadeUp}>
                <GlassCard className="p-3 text-center">
                  <div className="relative z-10">
                    <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                      {dayShort[i]}
                    </span>

                    {outfitData?.outfit_image_url ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-border/50 aspect-[3/4]">
                        <img
                          src={outfitData.outfit_image_url}
                          alt={outfitData.outfit_name || "Outfit"}
                          className="h-full w-full object-contain bg-secondary/30"
                        />
                      </div>
                    ) : (
                      <div className="mt-3 flex aspect-[3/4] items-center justify-center rounded-xl border border-dashed border-border">
                        <CalendarDays className="h-6 w-6 text-muted-foreground/40" strokeWidth={1} />
                      </div>
                    )}

                    {outfitData ? (
                      <div className="mt-2">
                        <p className="text-[10px] font-medium truncate">{outfitData.outfit_name}</p>
                        {outfitData.occasion && (
                          <Badge variant="secondary" className="mt-1 text-[8px] bg-violet/10 text-violet border-violet/20">
                            {outfitData.occasion}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">No outfit</p>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && !hasAnyOutfits && (
        <motion.div variants={fadeUp} className="mt-8 flex justify-center">
          <GradientButton onClick={() => navigate("/dashboard/outfits")}>
            <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Generate Outfits First
          </GradientButton>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Planner;
