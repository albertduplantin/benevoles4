'use client';

import { useState, useEffect } from 'react';
import { X, Phone, MessageCircle } from 'lucide-react';
import { SUPPORT_NAME, SUPPORT_PHONE, SUPPORT_PHONE_LINK } from '@/lib/constants/support';

export function SupportBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Vérifier si le bandeau a déjà été fermé (localStorage)
    const bannerClosed = localStorage.getItem('support-banner-closed');
    if (!bannerClosed) {
      // Afficher le bandeau après 2 secondes pour ne pas être trop intrusif
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Mémoriser que l'utilisateur a fermé le bandeau (persiste pendant la session)
    localStorage.setItem('support-banner-closed', 'true');
  };

  // Ne pas afficher pendant le SSR
  if (!isMounted || !isVisible) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 animate-in slide-in-from-top-5 duration-500">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 py-2">
          <div className="flex-shrink-0">
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-900 leading-relaxed">
              <span className="font-medium">Bug ou question ?</span> Contactez {SUPPORT_NAME} :{' '}
              <a 
                href={`tel:${SUPPORT_PHONE_LINK}`}
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                <Phone className="h-3 w-3" />
                {SUPPORT_PHONE}
              </a>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

