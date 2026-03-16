import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Upload, Shirt, X } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import GradientButton from "@/components/GradientButton";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0, 0, 1] as [number, number, number, number] } },
};

const tabs = ["All", "Tops", "Bottoms", "Shoes", "Accessories"];

const Wardrobe = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [showUpload, setShowUpload] = useState(false);

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl">
            My <span className="gradient-text">Wardrobe</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Upload and manage your clothing items</p>
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

      {/* Empty State */}
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
            <h3 className="text-xl font-semibold tracking-tight">Your wardrobe is empty</h3>
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

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowUpload(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            >
              <GlassCard hover={false} className="relative w-full max-w-md p-8">
                <div className="relative z-10">
                  <button onClick={() => setShowUpload(false)} className="absolute right-0 top-0 text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                  <h2 className="text-xl font-bold tracking-tighter">Upload Clothing Item</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Take a photo or upload an image</p>

                  <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 transition-colors hover:border-violet/40">
                    <Upload className="mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                    <span className="text-sm font-medium">Click to upload or drag & drop</span>
                    <span className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 10MB</span>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>

                  <div className="mt-6">
                    <GradientButton className="w-full" disabled>
                      <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
                      Analyze with AI
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

// Fix missing import
import { Sparkles } from "lucide-react";

export default Wardrobe;
