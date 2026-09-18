import React from 'react';
import { Link } from 'wouter';

const TranscendPage: React.FC = () => {
  const subPages = [
    { path: '/portal/endgame', title: 'The Endgame', description: 'Ultimate long-term wealth transcendence planning.', icon: '♟️' },
    { path: '/portal/will-writer', title: 'Will Writer', description: 'AI-assisted will and estate document creation.', icon: '📜' },
    { path: '/portal/couples', title: 'Couples Mode', description: 'Joint financial planning optimized for couples.', icon: '💑' },
    { path: '/portal/wrapped', title: 'Russell Wrapped', description: 'Your annual financial journey summary — Spotify-style.', icon: '🎁' },
    { path: '/portal/story-generator', title: 'Story Generator', description: 'Generate compelling client success narratives.', icon: '✍️' },
    { path: '/portal/co-pilot', title: 'Live Co-Pilot', description: 'Real-time AI co-pilot for live client meetings.', icon: '🤖' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <span className="text-4xl mr-4">🚀</span>
          <h1 className="text-4xl font-bold">Transcend</h1>
        </div>
        <p className="mb-8 text-lg text-gray-300">
          Tools for achieving financial enlightenment, legacy building, and 
          transcending traditional advisory limitations.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subPages.map((page) => (
            <Link key={page.path} href={page.path}
              className="bg-[#1a1f2a] border border-white/10 rounded-xl p-6 shadow-lg hover:bg-[#22c55e]/10 hover:scale-105 transition-all duration-300"
            >
              <div className="text-3xl mb-3">{page.icon}</div>
              <h2 className="text-xl font-semibold mb-2">{page.title}</h2>
              <p className="text-gray-400 text-sm">{page.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TranscendPage;
