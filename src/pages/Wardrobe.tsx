import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Upload, Shirt, X, Sparkles, Trash2, Loader2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as [number, number, number, number] } },
};

const tabs = ["All", "Tops", "Bottoms", "Shoes", "Accessories"];

const typeToTab: Record<string, string> = {
  "t-shirt": "Tops", "shirt": "Tops", "blouse": "Tops", "hoodie": "Tops", "sweater": "Tops",
  "jacket": "Tops", "blazer": "Tops", "coat": "Tops", "tank-top": "Tops", "polo": "Tops",
  "jeans": "Bottoms", "pants": "Bottoms", "shorts": "Bottoms", "skirt": "Bottoms", "trousers": "Bottoms",
  "sneakers": "Shoes", "boots": "Shoes", "sandals": "Shoes", "heels": "Shoes", "loafers": "Shoes",
  "hat": "Accessories", "scarf": "Accessories", "bag": "Accessories", "belt": "Accessories",
  "watch": "Accessories", "jewelry": "Accessories", "sunglasses": "Accessories",
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

const Wardrobe = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("wardrobe_items").select("id, image_url, item_type, color, style, pattern, season, tags").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch wardrobe:", error);
    } else {
      setItems((data as WardrobeItem[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 10MB", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      // Upload image to storage
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage.from("clothing-images").upload(filePath, selectedFile);
      if (uploadError) throw uploadError;
      setUploadProgress(50);

      const { data: { publicUrl } } = supabase.storage.from("clothing-images").getPublicUrl(filePath);

      // Convert to base64 for AI analysis
      setAnalyzing(true);
      setUploadProgress(60);

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
      });
      reader.readAsDataURL(selectedFile);
      const imageBase64 = await base64Promise;
      setUploadProgress(70);

      // Analyze with AI
      const { data: analysis, error: analysisError } = await supabase.functions.invoke("analyze-clothing", {
        body: { imageBase64, mimeType: selectedFile.type },
      });

      if (analysisError) throw analysisError;
      setUploadProgress(85);

      let finalImageUrl = publicUrl;

      // If the image isn't a clean product shot, generate one
      if (analysis.is_product_shot === false) {
        setUploadProgress(88);
        toast({ title: "Enhancing image...", description: "Generating a clean product photo" });
        
        const { data: cleanupData, error: cleanupError } = await supabase.functions.invoke("cleanup-clothing-image", {
          body: { imageBase64, mimeType: selectedFile.type, analysis, userId: user.id },
        });

        if (!cleanupError && cleanupData?.generated && cleanupData?.imageUrl) {
          finalImageUrl = cleanupData.imageUrl;
        }
      }

      setUploadProgress(92);

      // Save to database
      const { error: insertError } = await supabase.from("wardrobe_items").insert({
        user_id: user.id,
        image_url: finalImageUrl,
        item_type: analysis.type,
        color: analysis.color,
        style: analysis.style,
        pattern: analysis.pattern,
        season: analysis.season,
        tags: analysis.tags,
        ai_analysis: analysis,
      });

      if (insertError) throw insertError;
      setUploadProgress(100);

      toast({ title: "Item added!", description: `${analysis.type} • ${analysis.color} • ${analysis.style}${analysis.is_product_shot === false ? " (AI-enhanced image)" : ""}` });
      setShowUpload(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchItems();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setTimeout(async () => {
      const { error } = await supabase.from("wardrobe_items").delete().eq("id", id);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        setDeletingId(null);
      } else {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setDeletingId(null);
      }
    }, 400);
  };

  const filteredItems = activeTab === "All" ? items : items.filter((item) => typeToTab[item.item_type || ""] === activeTab);

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl">
            My <span className="gradient-text">Wardrobe</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <motion.span key={items.length} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              {items.length}
            </motion.span>{" "}
            items uploaded
          </p>
        </div>
        <GradientButton size="sm" onClick={() => setShowUpload(true)}>
          <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Upload
        </GradientButton>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="tab-active"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-violet/20 to-coral/10 border border-violet/20"
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <motion.div variants={fadeUp} className="mt-12">
          <GlassCard hover={false} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative z-10">
              <motion.div
                className="mb-6 inline-flex rounded-2xl bg-secondary p-6"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Shirt className="h-10 w-10 text-muted-foreground" strokeWidth={1} />
              </motion.div>
              <h3 className="text-xl font-semibold tracking-tight">
                {activeTab === "All" ? "Your wardrobe is empty" : `No ${activeTab.toLowerCase()} yet`}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Upload photos of your clothes and our AI will analyze each item — identifying type, color, style, and best seasons to wear it.
              </p>
              <div className="mt-6">
                <GradientButton onClick={() => setShowUpload(true)}>
                  <Upload className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Upload Your First Item
                </GradientButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ) : (
        <motion.div
          className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                variants={fadeUp}
                initial="hidden"
                animate={deletingId === item.id ? { scale: 0, opacity: 0 } : "show"}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <GlassCard className="group relative overflow-hidden p-0">
                  <div className="relative z-10">
                    <div className="aspect-square overflow-hidden rounded-t-2xl bg-secondary/50">
                      <img src={item.image_url} alt={item.item_type || "clothing"} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium capitalize">{item.item_type || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.color} • {item.style}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] bg-violet/10 text-violet border-violet/20">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-coral" strokeWidth={1.5} />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => !uploading && setShowUpload(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            >
              <GlassCard hover={false} className="relative w-full max-w-md p-8">
                <div className="relative z-10">
                  <button
                    onClick={() => { if (!uploading) { setShowUpload(false); setSelectedFile(null); setPreviewUrl(null); } }}
                    className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <h2 className="text-xl font-bold tracking-tighter">Upload Clothing Item</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Take a photo or upload an image</p>

                  {previewUrl ? (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-border">
                      <img src={previewUrl} alt="Preview" className="h-64 w-full object-cover" />
                    </div>
                  ) : (
                    <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 transition-colors hover:border-violet/40">
                      <Upload className="mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                      <span className="text-sm font-medium">Click to upload or drag & drop</span>
                      <span className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 10MB</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    </label>
                  )}

                  {uploading && (
                    <div className="mt-4">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        {analyzing ? "Analyzing with AI..." : "Uploading..."}
                      </p>
                    </div>
                  )}

                  <div className="mt-6">
                    <GradientButton className="w-full" disabled={!selectedFile || uploading} onClick={handleUpload}>
                      {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
                      )}
                      {uploading ? (analyzing ? "Analyzing..." : "Uploading...") : "Analyze with AI"}
                    </GradientButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Wardrobe;
