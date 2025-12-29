/**
 * Descriptions des catégories de missions pour les tooltips
 * Festival Films Courts de Dinan
 */

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  // Accueil public et professionnels
  'accueil_public_pr': 'Accueil du public et des professionnels : orientation, information, gestion des flux',
  'accueil_public_pro': 'Accueil du public et des professionnels : orientation, information, gestion des flux',
  'accreditations': 'Gestion des accréditations : distribution des badges, vérification des inscriptions, gestion de l\'outil informatique',
  'accueil_vip': 'Accueil VIP : prise en charge des invités spéciaux, professionnels et personnalités',
  'scolaire': 'Accueil des groupes scolaires : accompagnement des classes, gestion des séances dédiées',
  
  // Gestion & logistique
  'billetterie_vente': 'Billetterie et vente : vente de billets, gestion de caisse, renseignements tarifaires',
  'controle_acces_se': 'Contrôle d\'accès et sécurité : vérification des billets, gestion des entrées/sorties, respect des jauges',
  'controle_acces': 'Contrôle d\'accès : vérification des billets, gestion des entrées/sorties',
  'transports_accompagnement': 'Transports et accompagnement : déplacements d\'invités, navettes, courses logistiques',
  'logistique': 'Logistique générale : montage/démontage, manutention, installation de matériel',
  'logistique_technique': 'Logistique et technique : montage/démontage, manutention, support technique',
  
  // Communication
  'communication': 'Communication et réseaux sociaux : animation des réseaux, couverture événementielle, photos',
  'communication_reseaux': 'Communication et réseaux sociaux : animation des réseaux, couverture événementielle, photos',
  'developpement_publics': 'Développement des publics : promotion du festival, distribution de flyers, street marketing',
  'volet_professionnel': 'Volet professionnel : accueil et suivi des professionnels du cinéma, organisation d\'événements pro',
  'affichage_flyers': 'Affichage et distribution : pose d\'affiches, distribution de flyers, visibilité du festival en ville',
  
  // Bar & restauration
  'catering_buvette': 'Bar et buvette : service au bar, préparation et service de boissons et petite restauration',
  'bar_restauration_generale': 'Bar et restauration : service au bar, préparation et service de boissons et petite restauration',
  'samedi_soir_restauration': 'Coordination restauration samedi soir : organisation et gestion du service restauration lors de la soirée de clôture',
  
  // Animation
  'animation_1': 'Animation : accueil festif, ambiance, animation des espaces, jeux et activités',
  'animation_2': 'Animation et coordination : gestion d\'activités, animation d\'espaces, coordination d\'équipes',
  
  // Spécifiques
  'festival_court_ca': 'Festival Court Câlins : animation et gestion des séances jeune public',
  'nuit_courte': 'Nuit Courte : organisation et animation de la nuit blanche du festival',
  'dinan_pro': 'Dinan PRO : support à l\'événement professionnel, accueil des professionnels',
};

/**
 * Obtenir la description d'une catégorie
 */
export function getCategoryDescription(categoryValue: string): string {
  return CATEGORY_DESCRIPTIONS[categoryValue] || 'Mission pour le festival';
}











