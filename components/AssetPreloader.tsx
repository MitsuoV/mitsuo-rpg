
import React, { useState, useEffect } from 'react';
import { ASSETS, HERO_CLASSES, ENEMIES, AREAS } from '../constants';

interface AssetPreloaderProps {
  onComplete: () => void;
}

export const AssetPreloader: React.FC<AssetPreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing Systems...');

  useEffect(() => {
    const criticalAssets: string[] = [
      ASSETS.LOGO,
      ASSETS.SLIME_SPRITESHEET,
      ASSETS.STARDUST,
      ...HERO_CLASSES.map(c => c.icon).filter(i => i.startsWith('http')),
      ...Object.values(ENEMIES).map(e => e.spriteUrl),
      ...AREAS.map(a => a.backgroundImage || '')
    ].filter(Boolean);

    let loadedCount = 0;
    const total = criticalAssets.length;

    const loadAsset = (url: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to preload: ${url}`);
          resolve(); // Resolve anyway to not block the game
        };
      });
    };

    const runPreload = async () => {
      for (const url of criticalAssets) {
        // Update status text based on what's being loaded
        if (url.includes('logo')) setStatus('Fetching Realm Sigils...');
        else if (url.includes('spritesheet')) setStatus('Calibrating Slime Textures...');
        else if (url.includes('plains')) setStatus('Manifesting World Map...');
        else setStatus('Caching Arcane Visuals...');

        await loadAsset(url);
        loadedCount++;
        setProgress(Math.floor((loadedCount / total) * 100));
        // Small delay for visual flair
        await new Promise(r => setTimeout(r, 50));
      }
      
      setStatus('Realm Synced.');
      setTimeout(onComplete, 500);
    };

    runPreload();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="text-yellow-500 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
            Elyria Engine
          </div>
          <div className="text-gray-600 text-[8px] font-mono uppercase">
            v1.0.0 Alpha • Secure Link
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            <span className="truncate max-w-[200px]">{status}</span>
            <span className="font-mono">{progress}%</span>
          </div>
          
          <div className="w-full h-4 bg-gray-900 border-2 border-gray-800 p-0.5 relative overflow-hidden">
            <div 
              className="h-full bg-yellow-600 transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>
          </div>
          
          <div className="flex justify-between text-[6px] text-gray-700 font-mono uppercase">
            <span>Core: Active</span>
            <span>Memory: Optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
};
