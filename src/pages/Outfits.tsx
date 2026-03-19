import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Calendar, RefreshCw, Check, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useWeather } from "@/hooks/useWeather";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as [number, number, number, number] } },
};

interface SavedOutfit {
  id: string;
  outfit_name: string | null;
  items: any;
  occasion: string | null;
  reasoning: string | null;
  date: string | null;
  outfit_image_url: string | null;
  saved: boolean;
}

interface GeneratedOutfit {
  day: string;
  outfit_name: string;
  item_ids: string[];
  occasion: string;
  reasoning: string;
  flat_lay_description?: string;
  outfit_image_url?: string | null;
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Outfits = () => {
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loadingOutfits, setLoadingOutfits] = useState(true);
  const [itemCount, setItemCount] = useState(0);
  const { weather } = useWeather();

  // Load saved outfits from DB on mount
  const fetchSavedOutfits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingOutfits(false); return; }

    const { data: items } = await supabase
      .from("wardrobe_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count } = await supabase
      .from("wardrobe_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    setItemCount(count || 0);

    const { data } = await supabase
      .from("outfits")
      .select("id, outfit_name, items, occasion, reasoning, date, outfit_image_url, saved")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(7);

    if (data) setSavedOutfits(data as SavedOutfit[]);
    setLoadingOutfits(false);
  }, []);

  useEffect(() => { fetchSavedOutfits(); }, [fetchSavedOutfits]);

  const fetchPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("user_preferences")
      .select("style_vibes, preferred_colors, occasions")
      .eq("user_id", user.id)
      .maybeSingle();
    return data;
  };

  const fetchStyleHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("user_style_history")
      .select("outfit_tags, style_vibe, colors, occasion")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    return data || [];
  };

  const fetchWardrobeItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("wardrobe_items")
      .select("id, image_url, item_type, color, style, pattern, season, tags")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    return data || [];
  };

  const getWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    return monday.toISOString().split("T")[0];
  };

  const handleGenerate = async () => {
    if (itemCount < 3) {
      toast({ title: "Not enough items", description: "Add at least 3 items to your wardrobe first.", variant: "destructive" });
      return;
    }

    setGenerating(true);

    try {
      const [wardrobeItems, preferences, styleHistory] = await Promise.all([
        fetchWardrobeItems(),
        fetchPreferences(),
        fetchStyleHistory(),
      ]);

      const { data, error } = await supabase.functions.invoke("generate-outfits", {
        body: { wardrobeItems, weather, preferences, styleHistory },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const outfits: GeneratedOutfit[] = data.outfits || [];

      // Auto-save all outfits to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete previous generated outfits for this week
      const weekStart = getWeekStart();
      await supabase.from("weekly_planner").delete().eq("user_id", user.id).eq("week_start", weekStart);
      await supabase.from("outfits").delete().eq("user_id", user.id).eq("saved", false);

      // Insert new outfits
      const insertedOutfits: SavedOutfit[] = [];
      for (const outfit of outfits) {
        const dayIndex = DAY_ORDER.indexOf(outfit.day);
        const currentDay = (new Date().getDay() + 6) % 7;
        const diff = dayIndex - currentDay;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + (diff >= 0 ? diff : diff + 7));

        const { data: inserted, error: insertError } = await supabase.from("outfits").insert({
          user_id: user.id,
          outfit_name: outfit.outfit_name,
          items: outfit.item_ids,
          occasion: outfit.occasion,
          reasoning: outfit.reasoning,
          date: targetDate.toISOString().split("T")[0],
          outfit_image_url: outfit.outfit_image_url || null,
          saved: true,
        }).select().single();

        if (insertError) {
          console.error("Insert outfit error:", insertError);
          continue;
        }

        if (inserted) {
          insertedOutfits.push(inserted as SavedOutfit);

          // Save to weekly planner
          await supabase.from("weekly_planner").upsert({
            user_id: user.id,
            day_of_week: outfit.day,
            outfit_id: inserted.id,
            outfit_data: {
              outfit_name: outfit.outfit_name,
              occasion: outfit.occasion,
              reasoning: outfit.reasoning,
              outfit_image_url: outfit.outfit_image_url,
              item_ids: outfit.item_ids,
            },
            week_start: weekStart,
          }, { onConflict: "user_id,day_of_week,week_start" });

          // Save to style history
          const itemMeta = wardrobeItems.filter((w: any) => outfit.item_ids.includes(w.id));
          const colors = [...new Set(itemMeta.map((i: any) => i.color).filter(Boolean))];
          const tags = [...new Set(itemMeta.flatMap((i: any) => i.tags || []))];
          const styleVibe = itemMeta[0]?.style || preferences?.style_vibes?.[0] || null;

          await supabase.from("user_style_history").insert({
            user_id: user.id,
            outfit_tags: tags as string[],
            style_vibe: styleVibe,
            colors: colors as string[],
            occasion: outfit.occasion,
            outfit_metadata: {
              outfit_name: outfit.outfit_name,
              item_ids: outfit.item_ids,
              reasoning: outfit.reasoning,
            },
          });
        }
      }

      setSavedOutfits(insertedOutfits);
      toast({ title: "Outfits generated!", description: `${insertedOutfits.length} outfits created and saved for your week.` });
    } catch (err: any) {
      console.error("Generate error:", err);
      toast({ title: "Generation failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteOutfit = async (id: string) => {
    const { error } = await supabase.from("outfits").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setSavedOutfits((prev) => prev.filter((o) => o.id !== id));
      toast({ title: "Outfit removed" });
    }
  };

  // Sort outfits by day order
  const sortedOutfits = [...savedOutfits].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getDay() : 99;
    const dateB = b.date ? new Date(b.date).getDay() : 99;
    return dateA - dateB;
  });

  const getDayFromDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T12:00:00");
    return DAY_ORDER[(d.getDay() + 6) % 7];
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl">
            AI <span className="gradient-text">Outfits</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {savedOutfits.length > 0
              ? `${savedOutfits.length} outfits for your week`
              : "Generate AI-curated outfit combinations"}
          </p>
        </div>
        <GradientButton size="sm" onClick={handleGenerate} disabled={generating || itemCount < 3}>
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
          ) : savedOutfits.length > 0 ? (
            <RefreshCw className="mr-2 h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
          )}
          {generating ? "Generating..." : savedOutfits.length > 0 ? "Regenerate" : "Generate Outfits"}
        </GradientButton>
      </motion.div>

      {generating && (
        <motion.div variants={fadeUp} className="mt-12">
          <GlassCard hover={false} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative z-10">
              <motion.div
                className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-violet/20 to-coral/10 p-6"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-10 w-10 text-violet" strokeWidth={1} />
              </motion.div>
              <h3 className="text-xl font-semibold tracking-tight">Crafting your weekly wardrobe...</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Our AI is analyzing your {itemCount} items{weather ? ` and ${weather.city} weather (${weather.temp}°F)` : ""}, generating styled flat-lay images for each outfit.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">This may take up to a minute</p>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {!generating && loadingOutfits && (
        <div className="mt-8 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {!generating && !loadingOutfits && savedOutfits.length === 0 && (
        <motion.div variants={fadeUp} className="mt-12">
          <GlassCard hover={false} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative z-10">
              <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-violet/20 to-coral/10 p-6">
                <Sparkles className="h-10 w-10 text-violet" strokeWidth={1} />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">
                {itemCount < 3 ? "Not enough items yet" : "No outfits generated yet"}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {itemCount < 3
                  ? `Add at least 3 items to your wardrobe (you have ${itemCount}). Then generate AI-curated outfits for the whole week.`
                  : "Hit Generate Outfits to get AI-curated looks with styled flat-lay images for every day of the week."}
              </p>
              <div className="mt-6">
                <GradientButton disabled={itemCount < 3} onClick={handleGenerate}>
                  <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Generate Outfits
                </GradientButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {!generating && !loadingOutfits && sortedOutfits.length > 0 && (
        <motion.div
          className="mt-8 space-y-4"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          <AnimatePresence>
            {sortedOutfits.map((outfit) => {
              const day = getDayFromDate(outfit.date);
              return (
                <motion.div key={outfit.id} variants={fadeUp} layout>
                  <GlassCard className="p-0 overflow-hidden">
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet/20 to-coral/10">
                            <Calendar className="h-4 w-4 text-violet" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{day}</p>
                            <p className="text-xs text-muted-foreground">{outfit.outfit_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {outfit.occasion && (
                            <Badge variant="secondary" className="text-[10px] bg-violet/10 text-violet border-violet/20">
                              {outfit.occasion}
                            </Badge>
                          )}
                          <button
                            onClick={() => handleDeleteOutfit(outfit.id)}
                            className="rounded-full p-1.5 bg-secondary text-muted-foreground hover:text-coral transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>

                      {/* Flat-lay image */}
                      {outfit.outfit_image_url ? (
                        <div className="aspect-[4/3] w-full overflow-hidden bg-secondary/30">
                          <img
                            src={outfit.outfit_image_url}
                            alt={outfit.outfit_name || "Outfit flat-lay"}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[4/3] w-full items-center justify-center bg-secondary/30">
                          <p className="text-xs text-muted-foreground">Image not available</p>
                        </div>
                      )}

                      {/* Reasoning */}
                      <div className="border-t border-border/50 px-5 py-3">
                        <p className="text-xs text-muted-foreground">{outfit.reasoning}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Outfits;
