import { motion } from "framer-motion";

interface OutfitItem {
  id: string;
  image_url: string;
  item_type: string | null;
  role?: string;
}

interface OutfitFlatLayProps {
  items: OutfitItem[];
  className?: string;
}

const roleOrder = ["outerwear", "top", "bottom", "shoes", "accessory"];

const OutfitFlatLay = ({ items, className = "" }: OutfitFlatLayProps) => {
  // Sort items by role for consistent layout
  const sorted = [...items].sort((a, b) => {
    const ai = roleOrder.indexOf(a.role || "accessory");
    const bi = roleOrder.indexOf(b.role || "accessory");
    return ai - bi;
  });

  if (sorted.length === 0) {
    return (
      <div className={`flex aspect-[4/3] items-center justify-center bg-secondary/30 ${className}`}>
        <p className="text-xs text-muted-foreground">No items</p>
      </div>
    );
  }

  // Dynamic grid based on item count
  const gridClass =
    sorted.length <= 2
      ? "grid-cols-2"
      : sorted.length === 3
      ? "grid-cols-3"
      : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={`grid ${gridClass} gap-2 bg-secondary/20 p-3 ${className}`}>
      {sorted.map((item, i) => (
        <motion.div
          key={item.id}
          className="relative overflow-hidden rounded-xl border border-border/30 bg-secondary/40 aspect-square"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: [0.2, 0, 0, 1] }}
        >
          <img
            src={item.image_url}
            alt={item.item_type || "clothing"}
            className="h-full w-full object-contain p-1"
          />
          {item.role && (
            <span className="absolute bottom-1 left-1 rounded-md bg-background/80 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
              {item.role}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default OutfitFlatLay;
