import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

// ============================================================
// DESIGN OPTION SELECTOR - 10 UNIQUE AESTHETICS
// ============================================================

const designs = [
  { id: 1, name: "Warm Sunrise", desc: "Golden gradients, illustrated people, warmth & connection", colors: ["#FF6B35", "#F7C948", "#FFF8E7"] },
  { id: 2, name: "Ocean Depths", desc: "Deep blue calm, white foam accents, beach & nature", colors: ["#0A2463", "#3E92CC", "#D8F3FF"] },
  { id: 3, name: "Emerald & Gold", desc: "Luxury organic, nature meets premium, rich textures", colors: ["#064635", "#D4AF37", "#F5F0E8"] },
  { id: 4, name: "Cybernetic Neural", desc: "Animated particles, floating equations, living data streams", colors: ["#0D1B2A", "#00F5D4", "#7B2FFF"] },
  { id: 5, name: "Soft Editorial", desc: "Magazine-style, warm photography, cream & charcoal", colors: ["#FDFAF6", "#2D2D2D", "#C9A96E"] },
  { id: 6, name: "Deep Space", desc: "Cosmic purple nebula, stars, infinite expansion", colors: ["#0B0014", "#6B21A8", "#E879F9"] },
  { id: 7, name: "Glass Morphism", desc: "Frosted glass cards, soft blurred gradients, modern", colors: ["#667EEA", "#764BA2", "#F8F9FA"] },
  { id: 8, name: "Warm Earth", desc: "Terracotta, sage green, human connection & grounding", colors: ["#C67B5C", "#87A878", "#FAF3EE"] },
  { id: 9, name: "Electric Violet", desc: "Bold purple energy, dynamic motion, power & vitality", colors: ["#2D1B69", "#8B5CF6", "#DDD6FE"] },
  { id: 10, name: "Pure White", desc: "Apple-inspired minimalism, vast whitespace, precision", colors: ["#FFFFFF", "#1D1D1F", "#0071E3"] },
];

export default function DesignOptions() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Choose Your AQAL Design</h1>
        <p className="text-gray-400 text-center mb-12 text-lg">Click any option to see the full preview</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {designs.map((d) => (
            <Link key={d.id} href={`/design/${d.id}`}>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="cursor-pointer rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-colors"
              >
                <div className="h-32 flex" style={{ background: `linear-gradient(135deg, ${d.colors[0]}, ${d.colors[1]}, ${d.colors[2]})` }}>
                  <div className="m-auto text-center px-3">
                    <span className="text-white/90 text-xs font-bold drop-shadow-lg">Option {d.id}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-800/50">
                  <h3 className="font-bold text-sm">{d.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{d.desc}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
