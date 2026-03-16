import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "outline";
}

const GradientButton = ({ children, className, size = "md", variant = "primary", ...props }: GradientButtonProps) => {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      className={cn(
        "relative overflow-hidden rounded-xl font-semibold tracking-tight transition-all",
        sizeClasses[size],
        variant === "primary"
          ? "bg-gradient-to-br from-violet to-coral text-foreground glow-primary"
          : "gradient-border bg-secondary text-foreground",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0 }}
      {...props}
    >
      {variant === "primary" && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent"
          initial={{ x: "-100%" }}
          whileHover={{ x: "100%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default GradientButton;
