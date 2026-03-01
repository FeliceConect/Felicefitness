import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Complexo Felice
        cafe: "#322b29",
        vinho: "#663739",
        dourado: "#c29863",
        nude: "#ae9b89",
        fendi: "#cac2b9",
        seda: "#ddd5c7",

        // Cores principais
        primary: {
          DEFAULT: "#c29863", // dourado
          hover: "#b08850",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#663739", // vinho
          hover: "#7a4446",
          foreground: "#ffffff",
        },

        // Backgrounds — warm light (base nude/fendi)
        background: {
          DEFAULT: "#f7f2ed",    // warm cream
          card: "#ffffff",       // white cards
          elevated: "#ede7e0",   // light warm
          input: "#f2ece5",      // input fields
        },

        // Borders
        border: {
          DEFAULT: "#d4cbc2",    // warm muted
          focus: "#c29863",
        },

        // Status
        success: {
          DEFAULT: "#7dad6a",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#d4850f",
          foreground: "#ffffff",
        },
        error: {
          DEFAULT: "#a04045",
          foreground: "#ffffff",
        },
        info: {
          DEFAULT: "#6b9bd2",
          foreground: "#ffffff",
        },

        // Texto
        foreground: {
          DEFAULT: "#322b29",    // café (dark on light)
          secondary: "#7a6e64",  // muted café
          muted: "#ae9b89",      // nude
        },

        // Para compatibilidade com shadcn/ui
        card: {
          DEFAULT: "#ffffff",
          foreground: "#322b29",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#322b29",
        },
        muted: {
          DEFAULT: "#ede7e0",
          foreground: "#ae9b89",
        },
        accent: {
          DEFAULT: "#c29863",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#a04045",
          foreground: "#ffffff",
        },
        input: "#f2ece5",
        ring: "#c29863",
      },
      fontFamily: {
        sans: ["var(--font-sarabun)", "Sarabun", "sans-serif"],
        heading: ["Butler", "serif"],
      },
      fontSize: {
        "title-lg": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "title-md": ["24px", { lineHeight: "1.3", fontWeight: "700" }],
        "title-sm": ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "label": ["14px", { lineHeight: "1.4", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "1.4", fontWeight: "500" }],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #c29863 0%, #b08850 100%)",
        "gradient-card": "linear-gradient(180deg, #ffffff 0%, #f7f2ed 100%)",
        "gradient-gold": "linear-gradient(135deg, #c29863 0%, #ddd5c7 100%)",
        "gradient-vinho": "linear-gradient(135deg, #663739 0%, #a04045 100%)",
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      keyframes: {
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "70%": { transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(194, 152, 99, 0.4)" },
          "50%": { boxShadow: "0 0 0 10px rgba(194, 152, 99, 0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "heartbeat": {
          "0%, 100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.1)" },
          "50%": { transform: "scale(1)" },
          "75%": { transform: "scale(1.1)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-5deg)" },
          "75%": { transform: "rotate(5deg)" },
        },
      },
      animation: {
        "shake": "shake 0.5s ease-in-out",
        "fade-in": "fade-in 0.3s ease-out",
        "shimmer": "shimmer 1.5s infinite linear",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "pop-in": "pop-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
        "float": "float 3s ease-in-out infinite",
        "heartbeat": "heartbeat 0.8s ease-in-out",
        "wiggle": "wiggle 0.3s ease-in-out",
      },
      padding: {
        "safe": "env(safe-area-inset-bottom, 20px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
