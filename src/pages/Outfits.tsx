import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Calendar, RefreshCw, Save, Check } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useWeather } from "@/hooks/useWeather";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as [number, number, number, number] } },
};

interface WardrobeItem {
  id: string;
  image_url: string;
  item_type: string | null;
  color: string | null;
  style: string | null;
  pattern: string | null;
  season: string[] | null;
  tags: string[] | null;
}

interface GeneratedOutfit {
  day: string;
  outfit_name: string;
  item_ids: string[];
  occasion: string;
  reasoning: string;
}

const Outfits = () => {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [outfits, setOutfits] = useState<GeneratedOutfit[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedDays, setSavedDays] = useState<Set<string>>(new Set());
  const [itemCount, setItemCount] = useState(0);
  const { weather } = useWeather();

  const fetchWardrobeItems = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("wardrobe_items")
      .select("id, image_url, item_type, color, style, pattern, season, tags")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      setWardrobeItems(data as WardrobeItem[]);
      setItemCount(data.length);
    }
  }, []);

  useEffect(() => { fetchWardrobeItems(); }, [fetchWardrobeItems]);

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

  const handleGenerate = async () => {
    if (itemCount < 3) {
      toast({ title: "Not enough items", description: "Add at least 3 items to your wardrobe first.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setOutfits([]);
    setSavedDays(new Set());

    try {
      const preferences = await fetchPreferences();

      const { data, error } = await supabase.functions.invoke("generate-outfits", {
        body: { wardrobeItems, weather, preferences },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setOutfits(data.outfits || []);
      toast({ title: "Outfits generated!", description: `${data.outfits?.length || 0} outfit combinations created for your week.` });
    } catch (err: any) {
      console.error("Generate error:", err);
      toast({ title: "Generation failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveOutfit = async (outfit: GeneratedOutfit) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(outfit.day);
    try {
      const today = new Date();
      const dayIndex = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(outfit.day);
      const currentDay = (today.getDay() + 6) % 7; // Mon=0
      const diff = dayIndex - currentDay;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + (diff >= 0 ? diff : diff + 7));

      const { error } = await supabase.from("outfits").insert({
        user_id: user.id,
        outfit_name: outfit.outfit_name,
        items: outfit.item_ids,
        occasion: outfit.occasion,
        reasoning: outfit.reasoning,
        date: targetDate.toISOString().split("T")[0],
        saved: true,
      });

      if (error) throw error;
      setSavedDays((prev) => new Set([...prev, outfit.day]));
      toast({ title: "Outfit saved!", description: `${outfit.outfit_name} saved for ${outfit.day}.` });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const getItemById = (id: string) => wardrobeItems.find((item) => item.id === id);

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl">
            AI <span className="gradient-text">Outfits</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {outfits.length > 0
              ? `${outfits.length} outfits generated for your week`
              : "Generate AI-curated outfit combinations"}
          </p>
        </div>
        <GradientButton size="sm" onClick={handleGenerate} disabled={generating || itemCount < 3}>
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
          ) : outfits.length > 0 ? (
            <RefreshCw className="mr-2 h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
          )}
          {generating ? "Generating..." : outfits.length > 0 ? "Regenerate" : "Generate Outfits"}
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
                Our AI is analyzing your {itemCount} items{weather ? ` and ${weather.city} weather (${weather.temp}°F)` : ""} to create the perfect outfits.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {!generating && outfits.length === 0 && (
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
                  : "Hit Generate Outfits to get AI-curated looks for every day of the week, based on your wardrobe and local weather."}
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

      {!generating && outfits.length > 0 && (
        <motion.div
          className="mt-8 space-y-4"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          <AnimatePresence>
            {outfits.map((outfit) => {
              const isSaved = savedDays.has(outfit.day);
              return (
                <motion.div key={outfit.day} variants={fadeUp} layout>
                  <GlassCard className="p-0 overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet/20 to-coral/10">
                            <Calendar className="h-4 w-4 text-violet" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{outfit.day}</p>
                            <p className="text-xs text-muted-foreground">{outfit.outfit_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] bg-violet/10 text-violet border-violet/20">
                            {outfit.occasion}
                          </Badge>
                          <button
                            onClick={() => !isSaved && handleSaveOutfit(outfit)}
                            disabled={isSaved || saving === outfit.day}
                            className={`rounded-full p-1.5 transition-colors ${
                              isSaved
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {saving === outfit.day ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                            ) : isSaved ? (
                              <Check className="h-3.5 w-3.5" strokeWidth={2} />
                            ) : (
                              <Save className="h-3.5 w-3.5" strokeWidth={1.5} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3 overflow-x-auto p-4">
                        {outfit.item_ids.map((itemId) => {
                          const item = getItemById(itemId);
                          if (!item) return (
                            <div key={itemId} className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-secondary text-xs text-muted-foreground">
                              Missing
                            </div>
                          );
                          return (
                            <div key={itemId} className="flex-shrink-0">
                              <div className="h-24 w-24 overflow-hidden rounded-xl border border-border/50">
                                <img src={item.image_url} alt={item.item_type || "item"} className="h-full w-full object-cover" />
                              </div>
                              <p className="mt-1 text-center text-[10px] capitalize text-muted-foreground">{item.item_type}</p>
                            </div>
                          );
                        })}
                      </div>

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
