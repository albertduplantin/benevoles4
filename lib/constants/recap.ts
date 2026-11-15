/** Réglages par défaut de l'email « récapitulatif des missions » (modifiables par l'administrateur) */
export const DEFAULT_RECAP_SUBJECT = 'Vos missions au festival';
export const DEFAULT_SENDER_NAME = 'Festival Films Courts de Dinan';

/** Retire ce qui pourrait casser un en-tête d'email (retours à la ligne, chevrons, guillemets) */
export const cleanHeader = (value: string) => value.replace(/[\r\n<>"]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Objet de l'email pour un bénévole : remplace {nom} (prénom + nom, majuscules ou minuscules sans importance).
 * Un objet vide, ou vide une fois rempli, retombe sur l'objet par défaut.
 */
export function renderRecapSubject(template: string | null | undefined, fullName: string): string {
  const base = cleanHeader(template ?? '') || DEFAULT_RECAP_SUBJECT;
  const subject = cleanHeader(base.replace(/\{\s*nom\s*\}/gi, fullName));
  return subject || DEFAULT_RECAP_SUBJECT;
}
