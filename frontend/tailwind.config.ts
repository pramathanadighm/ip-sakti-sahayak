import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090D16",
        surface: {
          50: "#1E2638",
          100: "#161D2E",
          200: "#101624",
          300: "#0C101B",
        },
        legal: {
          gold: "#E5A93C",
          goldLight: "#FDE68A",
          goldMuted: "#B47C22",
          navy: "#0F172A",
          accent: "#38BDF8",
          emerald: "#10B981",
        },
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": {
            boxShadow: "0 0 15px rgba(229, 169, 60, 0.45), inset 0 0 10px rgba(229, 169, 60, 0.25)",
            borderColor: "rgba(229, 169, 60, 0.9)",
          },
          "50%": {
            boxShadow: "0 0 25px rgba(229, 169, 60, 0.8), inset 0 0 15px rgba(229, 169, 60, 0.4)",
            borderColor: "rgba(253, 230, 138, 1)",
          },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;
