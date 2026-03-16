import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard = ({ children, className, hover = true, ...props }: GlassCardProps) => {
  return (
    <motion.div
      className={cn("glass-card", className)}
      whileHover={hover ? { y: -4, boxShadow: "0 0 30px rgba(124, 58, 237, 0.15), 0 8px 32px rgba(0,0,0,0.4)" } : undefined}
      transition={{ type: "spring", duration: 0.5, bounce: 0 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
