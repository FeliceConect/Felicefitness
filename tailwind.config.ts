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
        // Cores principais
        primary: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#06B6D4",
          hover: "#0891B2",
          foreground: "#FFFFFF",
        },

        // Backgrounds
        background: {
          DEFAULT: "#0A0A0F",
          card: "#14141F",
          elevated: "#1E1E2E",
          input: "#1A1A2E",
        },

        // Borders
        border: {
          DEFAULT: "#2E2E3E",
          focus: "#8B5CF6",
        },

        // Status
        success: {
          DEFAULT: "#10B981",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#000000",
        },
        error: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        info: {
          DEFAULT: "#3B82F6",
          foreground: "#FFFFFF",
        },

        // Texto
        foreground: {
          DEFAULT: "#F8FAFC",
          secondary: "#94A3B8",
          muted: "#64748B",
        },

        // Para compatibilidade com shadcn/ui
        card: {
          DEFAULT: "#14141F",
          foreground: "#F8FAFC",
        },
        popover: {
          DEFAULT: "#14141F",
          foreground: "#F8FAFC",
        },
        muted: {
          DEFAULT: "#1E1E2E",
          foreground: "#94A3B8",
        },
        accent: {
          DEFAULT: "#1E1E2E",
          foreground: "#F8FAFC",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        input: "#1A1A2E",
        ring: "#8B5CF6",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
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
        "gradient-primary": "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
        "gradient-card": "linear-gradient(180deg, #14141F 0%, #0A0A0F 100%)",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(139, 92, 246, 0.4)" },
          "50%": { boxShadow: "0 0 0 10px rgba(139, 92, 246, 0)" },
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
