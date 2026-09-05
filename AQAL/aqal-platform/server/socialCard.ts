/**
 * Social Card Generator
 * Generates an SVG-based "Share Your Rarity" card for social media sharing.
 * The card includes the user's radar chart visualization and rarity score.
 */

import { ALL_AXES } from "@shared/axisModes";

interface SocialCardData {
  userName: string;
  rarity: number;
  scores: number[];
  topAxes: string[];
}

// Shareable card renders the full profile, so spokes follow ALL_AXES (32 lines).
const AXIS_LABELS = ALL_AXES;

function generateRadarPath(scores: number[], cx: number, cy: number, r: number): string {
  const axes = scores.length;
  const points: string[] = [];
  for (let i = 0; i < axes; i++) {
    const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
    const val = Math.min(scores[i] || 50, 100) / 100;
    const x = cx + r * val * Math.cos(angle);
    const y = cy + r * val * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(" ");
}

function generateGridLines(cx: number, cy: number, r: number, axes: number): string {
  let svg = "";
  // Concentric circles
  for (let ring = 1; ring <= 4; ring++) {
    const ringR = (r * ring) / 4;
    svg += `<circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>`;
  }
  // Axis lines
  for (let i = 0; i < axes; i++) {
    const angle = (Math.PI * 2 * i) / axes - Math.PI / 2;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    svg += `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>`;
  }
  return svg;
}

export function generateSocialCardSVG(data: SocialCardData): string {
  const { userName, rarity, scores, topAxes } = data;
  const width = 1200;
  const height = 630;
  const cx = 420;
  const cy = 315;
  const r = 220;

  const radarPoints = generateRadarPath(scores, cx, cy, r);
  const gridLines = generateGridLines(cx, cy, r, AXIS_LABELS.length);

  const formattedRarity = rarity >= 1000000
    ? `${(rarity / 1000000).toFixed(1)}M`
    : rarity >= 1000
    ? `${(rarity / 1000).toFixed(1)}K`
    : rarity.toLocaleString();

  const topAxesText = topAxes.slice(0, 3).join(" · ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="50%" style="stop-color:#0f0f1a"/>
      <stop offset="100%" style="stop-color:#0a0a0f"/>
    </linearGradient>
    <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(59,130,246,0.3)"/>
      <stop offset="100%" style="stop-color:rgba(168,85,247,0.3)"/>
    </linearGradient>
    <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="50%" style="stop-color:#fbbf24"/>
      <stop offset="100%" style="stop-color:#f59e0b"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="goldGlow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  
  <!-- Subtle mesh gradient orbs -->
  <circle cx="200" cy="100" r="200" fill="rgba(59,130,246,0.03)"/>
  <circle cx="1000" cy="500" r="250" fill="rgba(168,85,247,0.03)"/>
  
  <!-- Border -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" rx="8"/>

  <!-- Radar Chart -->
  ${gridLines}
  <polygon points="${radarPoints}" fill="url(#radarFill)" stroke="url(#radarStroke)" stroke-width="2" filter="url(#glow)"/>

  <!-- Right side content -->
  <!-- AQAL Logo/Brand -->
  <text x="820" y="80" font-family="monospace" font-size="12" fill="rgba(255,255,255,0.4)" letter-spacing="4">AQAL INTELLIGENCE</text>
  
  <!-- User name -->
  <text x="820" y="180" font-family="serif" font-size="28" fill="rgba(255,255,255,0.9)" font-weight="600">${escapeXml(userName)}</text>
  
  <!-- Rarity Score -->
  <text x="820" y="260" font-family="monospace" font-size="14" fill="rgba(255,255,255,0.5)" letter-spacing="2">COGNITIVE RARITY</text>
  <text x="820" y="320" font-family="monospace" font-size="56" fill="url(#goldGrad)" font-weight="700" filter="url(#goldGlow)">1 in ${formattedRarity}</text>
  
  <!-- Top Axes -->
  <text x="820" y="400" font-family="monospace" font-size="11" fill="rgba(255,255,255,0.4)" letter-spacing="2">DOMINANT AXES</text>
  <text x="820" y="430" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.7)">${escapeXml(topAxesText)}</text>
  
  <!-- Line-count badge -->
  <rect x="820" y="470" width="140" height="32" rx="16" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)"/>
  <text x="890" y="491" font-family="monospace" font-size="12" fill="rgba(255,255,255,0.6)" text-anchor="middle">${AXIS_LABELS.length} LINES</text>
  
  <!-- CTA -->
  <text x="820" y="570" font-family="sans-serif" font-size="14" fill="rgba(255,255,255,0.4)">Discover your cognitive rarity →</text>
  <text x="820" y="595" font-family="monospace" font-size="12" fill="rgba(59,130,246,0.8)">aqal.intelligence</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
