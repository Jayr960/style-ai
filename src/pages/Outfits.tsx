import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Calendar, RefreshCw, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";
import OutfitFlatLay from "@/components/OutfitFlatLay";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useWeather } from "@/hooks/useWeather";

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
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

interface SavedOutfit {
  id: string;
  outfit_name: string | null;
  items: any; // item_ids array or item objects
  occasion: string | null;
  reasoning: string | null;
  date: string | null;
  saved: boolean;
}

interface GeneratedOutfit {
  day: string;
  outfit_name: string;
  item_ids: string[];
  items?: { id: string; role: string }[];
  occasion: string;
  reasoning: string;
}

import { Heart, Share, CloudRain, Sun } from "lucide-react";

interface GenerationOptions {
  followWeather: boolean;
  includeLayering: boolean;
  learnStyle: boolean;
  selectedOccasion: string | null;
  selectedVibe: string | null;
  selectedColor: string | null;
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const OCCASIONS = ["Everyday", "Work / School", "Going Out", "Date Night", "Gym / Active", "Formal Event", "Chill / Lounge", "Travel"];
const VIBES = ["Keep It Simple", "Make It Bold", "Street Ready", "Clean & Polished", "Cozy Mode", "Elevated Casual"];
const COLORS = ["No Preference", "Neutrals Only", "Monochrome", "Earth Tones", "Bold & Bright", "Dark & Moody"];

const CustomSwitch = ({ checked, onChange, label }: { checked: boolean, onChange: (c:boolean)=>void, label: string }) => (
  <button onClick={() => onChange(!checked)} className="flex items-center justify-between w-full p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
    <span className="text-sm font-medium">{label}</span>
    <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${checked ? 'bg-violet' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: checked ? 20 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
    </div>
  </button>
);

const PillSelector = ({ options, selected, onSelect, label }: { options: string[], selected: string|null, onSelect: (o:string|null)=>void, label: string }) => (
  <div className="mb-5">
    <p className="text-[10px] text-muted-foreground mb-3 font-bold uppercase tracking-widest">{label}</p>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} onClick={() => onSelect(opt === selected ? null : opt)} className={`px-4 py-2 text-xs rounded-full transition-all duration-300 font-semibold ${opt === selected ? 'bg-gradient-to-r from-violet to-coral text-white shadow-[0_4px_14px_0_rgba(139,92,246,0.39)] hover:-translate-y-0.5' : 'bg-white border border-border/50 hover:border-violet/30 text-muted-foreground hover:text-foreground'}`}>
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const Outfits = () => {
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [wardrobeMap, setWardrobeMap] = useState<Record<string, WardrobeItem>>({});
  const [generating, setGenerating] = useState(false);
  const [loadingOutfits, setLoadingOutfits] = useState(true);
  const [itemCount, setItemCount] = useState(0);
  const { weather } = useWeather();

  const [followWeather, setFollowWeather] = useState(true);
  const [includeLayering, setIncludeLayering] = useState(true);
  const [learnStyle, setLearnStyle] = useState(true);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingOutfits(false); return; }

    // Fetch wardrobe items and outfits in parallel
    const [wardrobeRes, outfitsRes, countRes] = await Promise.all([
      supabase.from("wardrobe_items").select("id, image_url, item_type, color, style, pattern, season, tags").eq("user_id", user.id),
      supabase.from("outfits").select("id, outfit_name, items, occasion, reasoning, date, saved").eq("user_id", user.id).order("created_at", { ascending: false }).limit(7),
      supabase.from("wardrobe_items").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    if (wardrobeRes.data) {
      const map: Record<string, WardrobeItem> = {};
      wardrobeRes.data.forEach((item: any) => { map[item.id] = item; });
      setWardrobeMap(map);
    }

    setItemCount(countRes.count || 0);
    if (outfitsRes.data) setSavedOutfits(outfitsRes.data as SavedOutfit[]);
    setLoadingOutfits(false);
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const fetchPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("user_preferences").select("style_vibes, preferred_colors, occasions").eq("user_id", user.id).maybeSingle();
    return data;
  };

  const fetchStyleHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.from("user_style_history").select("outfit_tags, style_vibe, colors, occasion").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
    return data || [];
  };

  const fetchWardrobeItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.from("wardrobe_items").select("id, image_url, item_type, color, style, pattern, season, tags").eq("user_id", user.id).order("created_at", { ascending: false });
    return data || [];
  };

  const getWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1;
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
        body: { 
          wardrobeItems, 
          weather, 
          preferences, 
          styleHistory,
          generationOptions: { followWeather, includeLayering, learnStyle, selectedOccasion, selectedVibe, selectedColor } 
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const outfits: GeneratedOutfit[] = data.outfits || [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const weekStart = getWeekStart();
      await supabase.from("weekly_planner").delete().eq("user_id", user.id).eq("week_start", weekStart);
      await supabase.from("outfits").delete().eq("user_id", user.id).eq("saved", false);

      const insertedOutfits: SavedOutfit[] = [];
      for (const outfit of outfits) {
        const dayIndex = DAY_ORDER.indexOf(outfit.day);
        const currentDay = (new Date().getDay() + 6) % 7;
        const diff = dayIndex - currentDay;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + (diff >= 0 ? diff : diff + 7));

        // Store items with roles
        const itemsData = outfit.items || outfit.item_ids.map(id => ({ id, role: "unknown" }));

        const { data: inserted, error: insertError } = await supabase.from("outfits").insert({
          user_id: user.id,
          outfit_name: outfit.outfit_name,
          items: itemsData,
          occasion: outfit.occasion,
          reasoning: outfit.reasoning,
          date: targetDate.toISOString().split("T")[0],
          saved: true,
        }).select().single();

        if (insertError) { console.error("Insert outfit error:", insertError); continue; }

        if (inserted) {
          insertedOutfits.push(inserted as SavedOutfit);

          await supabase.from("weekly_planner").upsert({
            user_id: user.id,
            day_of_week: outfit.day,
            outfit_id: inserted.id,
            outfit_data: {
              outfit_name: outfit.outfit_name,
              occasion: outfit.occasion,
              reasoning: outfit.reasoning,
              items: itemsData,
            },
            week_start: weekStart,
          }, { onConflict: "user_id,day_of_week,week_start" });

          // Save style history
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
            outfit_metadata: { outfit_name: outfit.outfit_name, item_ids: outfit.item_ids, reasoning: outfit.reasoning },
          });
        }
      }

      // Refresh wardrobe map
      const map: Record<string, WardrobeItem> = {};
      wardrobeItems.forEach((item: any) => { map[item.id] = item; });
      setWardrobeMap(map);

      setSavedOutfits(insertedOutfits);
      toast({ title: "Outfits generated!", description: `${insertedOutfits.length} outfits created for your week.` });
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

  const getOutfitItems = (outfit: SavedOutfit) => {
    const items = outfit.items;
    if (!items || !Array.isArray(items)) return [];

    return items.map((item: any) => {
      const id = typeof item === "string" ? item : item.id;
      const role = typeof item === "string" ? undefined : item.role;
      const wardrobeItem = wardrobeMap[id];
      if (!wardrobeItem) return null;
      return { ...wardrobeItem, role };
    }).filter(Boolean);
  };

  const renderWeatherChip = () => {
    if (!weather) return null;
    const isCold = weather.temp < 60;
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
        {isCold ? <CloudRain className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        <span className="text-[10px] font-bold">{weather.temp}°F</span>
      </div>
    );
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} className="pb-24">
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

      <motion.div variants={fadeUp} className="mt-8">
        <GlassCard className="p-6 border-white/40 shadow-sm bg-white/40">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-8">
            <div className="space-y-3">
              <h3 className="text-sm font-bold tracking-tight">AI Settings</h3>
              <div className="flex flex-col gap-2">
                <CustomSwitch checked={followWeather} onChange={setFollowWeather} label="Follow the Weather" />
                <CustomSwitch checked={includeLayering} onChange={setIncludeLayering} label="Include Layering" />
                <CustomSwitch checked={learnStyle} onChange={setLearnStyle} label="Learn From My Style" />
              </div>
            </div>
            <div>
              <PillSelector label="Target Occasion" options={OCCASIONS} selected={selectedOccasion} onSelect={setSelectedOccasion} />
              <PillSelector label="Vibe" options={VIBES} selected={selectedVibe} onSelect={setSelectedVibe} />
              <PillSelector label="Color Mood" options={COLORS} selected={selectedColor} onSelect={setSelectedColor} />
            </div>
          </div>
        </GlassCard>
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
                AI is analyzing your {itemCount} items{weather ? ` and ${weather.city} weather (${weather.temp}°F)` : ""} to create perfect outfits from your actual clothes.
              </p>
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
                  ? `Add at least 3 items to your wardrobe (you have ${itemCount}).`
                  : "Hit Generate to get AI-curated looks using your actual wardrobe photos."}
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
              const outfitItems = getOutfitItems(outfit);

              return (
                <motion.div key={outfit.id} variants={fadeUp} layout className="mb-8 relative">
                  <GlassCard className="p-0 overflow-hidden relative shadow-lg shadow-violet/5 border-white/60 bg-white/50">
                    <div className="relative z-10">
                      
                      <div className="flex items-center justify-between px-6 py-5">
                        <div>
                          <p className="text-xs font-bold text-violet uppercase tracking-widest mb-1">{day}</p>
                          <h2 className="text-2xl font-black bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                            {outfit.outfit_name}
                          </h2>
                        </div>
                        <div className="flex items-center gap-3">
                          {renderWeatherChip()}
                          {outfit.occasion && (
                            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-violet to-coral shadow-sm">
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider">{outfit.occasion}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Asymmetric Editorial Grid */}
                      <div className="px-2">
                        {outfitItems.length > 0 ? (
                          <OutfitFlatLay items={outfitItems as any} />
                        ) : (
                          <div className="flex aspect-[4/3] w-full items-center justify-center bg-secondary/30 rounded-2xl">
                            <p className="text-xs text-muted-foreground">Some items may have been removed from your wardrobe</p>
                          </div>
                        )}
                      </div>

                      <div className="mx-6 my-5 p-5 rounded-2xl bg-white/60 border-l-4 border-l-violet shadow-sm flex items-start gap-4">
                        <Sparkles className="w-5 h-5 text-violet shrink-0 mt-0.5" />
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-medium">{outfit.reasoning}</p>
                      </div>

                      <div className="px-6 py-4 bg-gray-50/50 border-t border-border/40 flex items-center gap-3 justify-end">
                        <GradientButton size="sm" onClick={() => {}} className="rounded-full px-5 hover:shadow-lg hover:shadow-violet/20">
                          <Heart className="w-4 h-4 mr-2" /> Save Outfit
                        </GradientButton>
                        <button onClick={() => handleDeleteOutfit(outfit.id)} className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-coral hover:border-coral transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-colors">
                          <Share className="w-4 h-4" />
                        </button>
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
