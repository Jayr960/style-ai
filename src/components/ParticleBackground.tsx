import { useCallback } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

const ParticleBackground = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: true, zIndex: 0 },
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        particles: {
          color: { value: ["#7c3aed", "#ff4d6d"] },
          links: {
            enable: true,
            opacity: 0.08,
            distance: 150,
            color: { value: "#7c3aed" },
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.4,
            direction: "none",
            outModes: { default: "bounce" },
          },
          number: {
            value: 40,
            density: { enable: true },
          },
          opacity: { value: { min: 0.1, max: 0.3 } },
          size: { value: { min: 1, max: 2 } },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: "repulse" },
          },
          modes: {
            repulse: { distance: 100, speed: 0.5 },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default ParticleBackground;
