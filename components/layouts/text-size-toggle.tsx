'use client';

import { useEffect, useState } from 'react';
import { TypeIcon } from 'lucide-react';

const KEY = 'text-size';

/** Bouton « Texte plus grand » : agrandit tout le texte du site (retenu dans le navigateur) */
export function TextSizeToggle({ className = '' }: { className?: string }) {
  const [large, setLarge] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) === 'large';
      setLarge(saved);
      document.documentElement.classList.toggle('text-large', saved);
    } catch {}
  }, []);

  const toggle = () => {
    const next = !large;
    setLarge(next);
    document.documentElement.classList.toggle('text-large', next);
    try {
      localStorage.setItem(KEY, next ? 'large' : 'normal');
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={large}
      title={large ? 'Revenir à la taille normale' : 'Agrandir le texte'}
      className={`inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition hover:bg-accent ${className}`}
    >
      <TypeIcon className="h-4 w-4" />
      {large ? 'Texte normal' : 'Texte plus grand'}
    </button>
  );
}
