'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { createVolunteerManually } from '@/lib/firebase/create-volunteer';
import { toast } from 'sonner';
import { UserPlusIcon, CopyIcon, CheckIcon, MailIcon } from 'lucide-react';

interface CreateVolunteerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVolunteerCreated?: (userId: string) => void;
}

export function CreateVolunteerModal({
  open,
  onOpenChange,
  onVolunteerCreated
}: CreateVolunteerModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    emailOnly: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdVolunteer, setCreatedVolunteer] = useState<{
    userId: string;
    token?: string;
    temporaryPassword?: string;
  } | null>(null);
  const [copiedItem, setCopiedItem] = useState<'link' | 'password' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Adresse email invalide');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createVolunteerManually(formData);
      
      setCreatedVolunteer(result);
      
      toast.success('Bénévole créé avec succès !');
      
      if (onVolunteerCreated) {
        onVolunteerCreated(result.userId);
      }
    } catch (error: any) {
      console.error('Error creating volunteer:', error);
      toast.error(error.message || 'Erreur lors de la création du bénévole');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, type: 'link' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedItem(type);
    toast.success('Copié dans le presse-papier');
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleClose = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      emailOnly: false,
    });
    setCreatedVolunteer(null);
    setCopiedItem(null);
    onOpenChange(false);
  };

  const personalLink = createdVolunteer?.token
    ? `${window.location.origin}/mes-missions?token=${createdVolunteer.token}`
    : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un bénévole manuellement</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau bénévole sans qu'il ait besoin de s'inscrire
          </DialogDescription>
        </DialogHeader>

        {!createdVolunteer ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="Jean"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="06 12 34 56 78"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="emailOnly"
                checked={formData.emailOnly}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, emailOnly: checked as boolean }))
                }
              />
              <Label
                htmlFor="emailOnly"
                className="text-sm font-normal cursor-pointer"
              >
                Mode "Email uniquement" (pas de connexion requise)
              </Label>
            </div>

            {formData.emailOnly && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex gap-2">
                  <MailIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-900">
                    Un lien personnel sera généré automatiquement. Vous pourrez le copier et l'envoyer par email au bénévole.
                  </p>
                </div>
              </div>
            )}

            {!formData.emailOnly && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-900">
                  Un mot de passe temporaire sera généré. Vous devrez le communiquer au bénévole pour qu'il se connecte et le change.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Créer
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Succès */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckIcon className="h-5 w-5" />
                <p className="font-semibold">Bénévole créé avec succès !</p>
              </div>
              <p className="text-sm text-green-700">
                {formData.firstName} {formData.lastName} a été ajouté à la plateforme.
              </p>
            </div>

            {/* Lien personnel pour email-only */}
            {createdVolunteer.token && (
              <div className="space-y-2">
                <Label>Lien personnel à envoyer par email</Label>
                <div className="flex gap-2">
                  <Input
                    value={personalLink}
                    readOnly
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(personalLink, 'link')}
                  >
                    {copiedItem === 'link' ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Envoyez ce lien par email au bénévole. Il pourra consulter ses missions sans se connecter.
                </p>
              </div>
            )}

            {/* Mot de passe temporaire */}
            {createdVolunteer.temporaryPassword && (
              <div className="space-y-2">
                <Label>Mot de passe temporaire</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdVolunteer.temporaryPassword}
                    readOnly
                    className="flex-1 font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(createdVolunteer.temporaryPassword!, 'password')}
                  >
                    {copiedItem === 'password' ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Communiquez ce mot de passe au bénévole. Il devra le changer lors de sa première connexion.
                </p>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              Terminer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


















