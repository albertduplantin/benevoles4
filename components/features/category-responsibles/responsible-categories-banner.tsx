'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, X } from 'lucide-react';

interface ResponsibleCategory {
  id: string;
  categoryId: string;
  categoryLabel: string;
  responsibleId: string;
  assignedBy: string;
  assignedAt: Date;
}

export function ResponsibleCategoriesBanner() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ResponsibleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!user || user.role !== 'category_responsible') {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/my-categories?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching responsible categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user]);

  // Ne rien afficher si :
  // - En cours de chargement
  // - Pas un responsable de catégorie
  // - Pas de catégories assignées
  // - Banner fermé
  if (loading || !user || user.role !== 'category_responsible' || categories.length === 0 || !isVisible) {
    return null;
  }

  return (
    <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-purple-900 mb-1">
              🎯 Vos responsabilités
            </h3>
            <p className="text-sm text-purple-700 mb-2">
              Vous êtes responsable de {categories.length} catégorie{categories.length > 1 ? 's' : ''} :
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant="secondary"
                  className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300"
                >
                  {cat.categoryLabel}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-purple-600 mt-2">
              Vous pouvez créer, éditer et gérer les missions de ces catégories.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-purple-400 hover:text-purple-600 transition-colors p-1 rounded hover:bg-purple-100"
          title="Masquer ce bandeau"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

















