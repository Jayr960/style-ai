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

// Helper to find the best item for a slot
const extractSlot = (items: OutfitItem[], roles: string[]) => {
  const item = items.find((i) => roles.includes(i.role?.toLowerCase() || ""));
  if (item) return item;
  // Fallback if no exact role matched but we have items left, though ideally roles are set
  return null;
};

const OutfitFlatLay = ({ items, className = "" }: OutfitFlatLayProps) => {
  if (items.length === 0) {
    return (
      <div className={`flex aspect-[4/3] items-center justify-center bg-secondary/10 rounded-2xl ${className}`}>
        <p className="text-xs text-muted-foreground">No items</p>
      </div>
    );
  }

  // Best effort slot mapping
  const topItem = extractSlot(items, ["top", "outerwear"]) || items[0];
  const bottomItem = extractSlot(items.filter(i => i !== topItem), ["bottom"]) || items[1];
  const shoesItem = extractSlot(items.filter(i => i !== topItem && i !== bottomItem), ["shoes", "footwear"]) || items[2];
  const accItem = extractSlot(items.filter(i => i !== topItem && i !== bottomItem && i !== shoesItem), ["accessory"]) || items[3];

  const ItemCard = ({ item, customClass = "", delay = 0 }: { item: OutfitItem, customClass?: string, delay: number }) => {
    if (!item) return <div className={`hidden sm:block rounded-2xl border border-dashed border-border/30 bg-white/30 ${customClass}`} />;
    return (
      <motion.div
        className={`relative overflow-hidden rounded-[16px] border border-gray-200/60 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(139,92,246,0.3)] ${customClass}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={item.image_url}
          alt={item.item_type || "clothing item"}
          className="h-full w-full object-contain p-4"
        />
        {(item.role || item.item_type) && (
          <span className="absolute bottom-2 left-2 rounded-full bg-gradient-to-r from-violet to-coral px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
            {item.role || item.item_type || "ITEM"}
          </span>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-[2fr_2fr_1fr] md:grid-rows-2 gap-4 p-5 bg-[#fafafa]/50 ${className}`}>
      <ItemCard item={topItem} customClass="md:col-start-1 md:col-end-2 md:row-start-1 md:row-end-3 aspect-[3/4] md:aspect-auto" delay={0.1} />
      {bottomItem && <ItemCard item={bottomItem} customClass="md:col-start-2 md:col-end-3 md:row-start-1 md:row-end-3 aspect-[3/4] md:aspect-auto" delay={0.2} />}
      {accItem && <ItemCard item={accItem} customClass="hidden md:block md:col-start-3 md:col-end-4 md:row-start-1 md:row-end-2" delay={0.3} />}
      {shoesItem && <ItemCard item={shoesItem} customClass="col-span-2 md:col-span-1 md:col-start-3 md:col-end-4 md:row-start-2 md:row-end-3 aspect-[2/1] md:aspect-square" delay={0.4} />}
    </div>
  );
};

export default OutfitFlatLay;
