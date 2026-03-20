import { motion } from "framer-motion";

const blobs = [
  {
    color: "rgba(124, 58, 237, 0.07)",
    size: 600,
    initialX: "10%",
    initialY: "15%",
    animateX: ["10%", "30%", "15%", "10%"],
    animateY: ["15%", "25%", "40%", "15%"],
    duration: 25,
  },
  {
    color: "rgba(255, 77, 109, 0.05)",
    size: 500,
    initialX: "60%",
    initialY: "50%",
    animateX: ["60%", "45%", "70%", "60%"],
    animateY: ["50%", "30%", "60%", "50%"],
    duration: 30,
  },
  {
    color: "rgba(79, 70, 229, 0.04)",
    size: 450,
    initialX: "40%",
    initialY: "70%",
    animateX: ["40%", "55%", "35%", "40%"],
    animateY: ["70%", "55%", "80%", "70%"],
    duration: 35,
  },
];

const AuroraBlobs = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
    {blobs.map((blob, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: blob.size,
          height: blob.size,
          background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
          filter: "blur(80px)",
          left: blob.initialX,
          top: blob.initialY,
        }}
        animate={{ left: blob.animateX, top: blob.animateY }}
        transition={{
          duration: blob.duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

export default AuroraBlobs;
