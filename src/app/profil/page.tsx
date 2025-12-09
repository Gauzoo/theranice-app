"use client";

import Image from "next/image";
import { EB_Garamond } from "next/font/google";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type AccountStatus = 'pending' | 'documents_submitted' | 'approved' | 'rejected';

const STATUS_LABELS: Record<AccountStatus, { label: string; color: string; description: string }> = {
  pending: {
    label: "En attente de documents",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    description: "Merci de compléter vos documents pour pouvoir réserver."
  },
  documents_submitted: {
    label: "Documents soumis - En cours de validation",
    color: "bg-[#D4A373] text-white border-[#D4A373]",
    description: "Vos documents sont en cours de vérification par l'administrateur."
  },
  approved: {
    label: "Validé",
    color: "bg-green-100 text-green-800 border-green-300",
    description: "Votre compte est validé, vous pouvez réserver."
  },
  rejected: {
    label: "Compte rejeté",
    color: "bg-red-100 text-red-800 border-red-300",
    description: "Votre compte a été rejeté. Veuillez contacter l'administrateur."
  }
};

export default function ProfilPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    activite_exercee: "",
    account_status: "pending" as AccountStatus,
    carte_identite_url: "",
    kbis_url: "",
    carte_identite_status: null as string | null,
    kbis_status: null as string | null,
    carte_identite_rejection_notes: "",
    kbis_rejection_notes: "",
    validation_notes: "",
  });

  const [carteIdentiteFile, setCarteIdentiteFile] = useState<File | null>(null);
  const [kbisFile, setKbisFile] = useState<File | null>(null);

  // Récupère les données de l'utilisateur au chargement
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/");
      return;
    }

    const fetchUserData = async () => {
      const supabase = createClient();

      // Récupère le profil depuis la table profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData({
          nom: profile.nom || "",
          prenom: profile.prenom || "",
          email: user.email || "",
          telephone: profile.telephone || "",
          activite_exercee: profile.activite_exercee || "",
          account_status: profile.account_status || "pending",
          carte_identite_url: profile.carte_identite_url || "",
          kbis_url: profile.kbis_url || "",
          carte_identite_status: profile.carte_identite_status || null,
          kbis_status: profile.kbis_status || null,
          carte_identite_rejection_notes: profile.carte_identite_rejection_notes || "",
          kbis_rejection_notes: profile.kbis_rejection_notes || "",
          validation_notes: profile.validation_notes || "",
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          email: user.email || "",
        }));
      }

      setIsProfileLoading(false);
    };

    fetchUserData();
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'carte' | 'kbis') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier ne doit pas dépasser 5 MB");
      return;
    }

    // Vérifier le type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError("Format non autorisé. Utilisez PDF, JPG ou PNG");
      return;
    }

    if (type === 'carte') {
      setCarteIdentiteFile(file);
    } else {
      setKbisFile(file);
    }
    setError(null);

    // Upload automatiquement le fichier
    setUploadingDoc(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const documentType = type === 'carte' ? 'carte-identite' : 'kbis';
      const fileUrl = await uploadDocument(file, documentType);

      // Mettre à jour le profil avec la nouvelle URL ET le statut 'pending'
      const updateData = type === 'carte' 
        ? { 
            carte_identite_url: fileUrl,
            carte_identite_status: 'pending',
            carte_identite_rejection_notes: null
          }
        : { 
            kbis_url: fileUrl,
            kbis_status: 'pending',
            kbis_rejection_notes: null
          };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Mettre à jour l'état local
      setFormData(prev => ({
        ...prev,
        ...(type === 'carte' 
          ? { 
              carte_identite_url: fileUrl,
              carte_identite_status: 'pending',
              carte_identite_rejection_notes: ""
            }
          : { 
              kbis_url: fileUrl,
              kbis_status: 'pending',
              kbis_rejection_notes: ""
            })
      }));

      // Réinitialiser le fichier sélectionné
      if (type === 'carte') {
        setCarteIdentiteFile(null);
      } else {
        setKbisFile(null);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      const error = err as Error;
      setError(error.message || "Erreur lors de l'upload");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (type: 'carte' | 'kbis') => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    setUploadingDoc(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // Supprimer le fichier du storage
      const documentType = type === 'carte' ? 'carte-identite' : 'kbis';
      const fileUrl = type === 'carte' ? formData.carte_identite_url : formData.kbis_url;
      
      if (fileUrl) {
        // Extraire le chemin du fichier depuis l'URL
        const urlParts = fileUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${user.id}/${fileName}`;
        
        await supabase.storage.from('user-documents').remove([filePath]);
      }

      // Déterminer le nouveau statut du compte
      // Si on supprime un document alors que le compte est approuvé, on le repasse en "documents_submitted"
      let newAccountStatus = formData.account_status;
      if (formData.account_status === 'approved') {
        newAccountStatus = 'documents_submitted';
      }

      // Mettre à jour le profil pour retirer l'URL, le statut du document, et potentiellement le statut du compte
      const updateData = type === 'carte' 
        ? { 
            carte_identite_url: null,
            carte_identite_status: null,
            carte_identite_rejection_notes: null,
            account_status: newAccountStatus
          }
        : { 
            kbis_url: null,
            kbis_status: null,
            kbis_rejection_notes: null,
            account_status: newAccountStatus
          };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Mettre à jour l'état local
      setFormData(prev => ({
        ...prev,
        account_status: newAccountStatus,
        ...(type === 'carte' 
          ? { 
              carte_identite_url: "",
              carte_identite_status: null,
              carte_identite_rejection_notes: ""
            }
          : { 
              kbis_url: "",
              kbis_status: null,
              kbis_rejection_notes: ""
            })
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      const error = err as Error;
      setError(error.message || "Erreur lors de la suppression");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleUploadDocument = async (type: 'carte' | 'kbis') => {
    const file = type === 'carte' ? carteIdentiteFile : kbisFile;
    if (!file) return;

    setUploadingDoc(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const documentType = type === 'carte' ? 'carte-identite' : 'kbis';
      const fileUrl = await uploadDocument(file, documentType);

      // Mettre à jour le profil avec la nouvelle URL ET le statut 'pending'
      const updateData = type === 'carte' 
        ? { 
            carte_identite_url: fileUrl,
            carte_identite_status: 'pending',
            carte_identite_rejection_notes: null
          }
        : { 
            kbis_url: fileUrl,
            kbis_status: 'pending',
            kbis_rejection_notes: null
          };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Mettre à jour l'état local
      setFormData(prev => ({
        ...prev,
        ...(type === 'carte' 
          ? { 
              carte_identite_url: fileUrl,
              carte_identite_status: 'pending',
              carte_identite_rejection_notes: ""
            }
          : { 
              kbis_url: fileUrl,
              kbis_status: 'pending',
              kbis_rejection_notes: ""
            })
      }));

      // Réinitialiser le fichier sélectionné
      if (type === 'carte') {
        setCarteIdentiteFile(null);
      } else {
        setKbisFile(null);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      const error = err as Error;
      setError(error.message || "Erreur lors de l'upload");
    } finally {
      setUploadingDoc(false);
    }
  };

  const uploadDocument = async (file: File, documentType: 'carte-identite' | 'kbis'): Promise<string> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Utilisateur non connecté");

    // Garder le nom original du fichier avec un préfixe pour le type
    const timestamp = Date.now();
    const filePath = `${user.id}/${documentType}-${timestamp}-${file.name}`;

    // Upload le nouveau fichier
    const { error: uploadError } = await supabase.storage
      .from('user-documents')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Récupère l'URL publique
    const { data } = supabase.storage
      .from('user-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmitDocuments = async () => {
    if (!carteIdentiteFile && !kbisFile && !formData.activite_exercee) {
      setError("Veuillez remplir au moins un champ");
      return;
    }

    setUploadingDoc(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      let carteUrl = formData.carte_identite_url;
      let kbisUrl = formData.kbis_url;

      // Upload des fichiers si présents
      if (carteIdentiteFile) {
        carteUrl = await uploadDocument(carteIdentiteFile, 'carte-identite');
      }
      if (kbisFile) {
        kbisUrl = await uploadDocument(kbisFile, 'kbis');
      }

      // Déterminer le nouveau statut
      const hasAllDocuments = (carteUrl && kbisUrl && formData.activite_exercee);
      const newStatus: AccountStatus = hasAllDocuments ? 'documents_submitted' : 'pending';

      console.log('📤 Données AVANT UPDATE:', {
        activite_exercee: formData.activite_exercee,
        userId: user.id,
        hasAllDocuments,
        newStatus
      });

      // Mise à jour du profil
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          activite_exercee: formData.activite_exercee,
          carte_identite_url: carteUrl,
          kbis_url: kbisUrl,
          account_status: newStatus,
          documents_submitted_at: hasAllDocuments ? new Date().toISOString() : null,
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        throw new Error(`Erreur de mise à jour: ${updateError.message}`);
      }

      if (!updateData || updateData.length === 0) {
        throw new Error('La mise à jour a été bloquée par les règles de sécurité');
      }

      // Mettre à jour l'état local avec les nouvelles valeurs
      setFormData(prev => ({
        ...prev,
        activite_exercee: formData.activite_exercee,
        account_status: newStatus,
        carte_identite_url: carteUrl || "",
        kbis_url: kbisUrl || "",
      }));

      setCarteIdentiteFile(null);
      setKbisFile(null);
      setSuccess(true);

      // Envoyer l'email à l'admin si tous les documents sont soumis
      if (hasAllDocuments) {
        try {
          await fetch('/api/emails/notify-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userName: `${formData.prenom} ${formData.nom}`,
              userEmail: formData.email,
              userPhone: formData.telephone || 'Non renseigné',
              userActivity: formData.activite_exercee,
            }),
          });
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email admin:', emailError);
          // Ne pas bloquer le processus si l'email échoue
        }
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Erreur lors de l'upload");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Vous devez être connecté");
      }

      // Met à jour le profil dans la table profiles
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          activite_exercee: formData.activite_exercee,
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setIsEditing(false);
      
      // Cache le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Une erreur est survenue lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* Hero section - réduite de moitié */}
      <section
        className="relative isolate flex min-h-[40vh] items-center justify-center overflow-hidden pt-24 text-white"
      >
        <Image
          src="/photos/covers1.jpg"
          alt="Theranice"
          fill
          className="absolute inset-0 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-4 px-6 py-16 text-center">
          
          <h1 className="text-4xl sm:text-5xl">
            {formData.prenom} {formData.nom}
          </h1>

          <p className="text-lg text-slate-100">
            Gérez vos informations personnelles
          </p>
        </div>
      </section>

      {/* Section statut du compte */}
      <section className="bg-slate-50 py-8">
        <div className="mx-auto max-w-3xl px-6">
          {isProfileLoading ? (
            <div className="rounded border border-slate-200 bg-white px-6 py-6 shadow-sm">
              <div className="mb-3 h-3 w-44 animate-pulse rounded bg-slate-200" />
              <div className="h-3 w-72 animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            <div className={`border px-6 py-4 rounded ${STATUS_LABELS[formData.account_status].color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    Statut du compte : {STATUS_LABELS[formData.account_status].label}
                  </h3>
                  <p className="text-sm">
                    {STATUS_LABELS[formData.account_status].description}
                  </p>
                  {formData.account_status === 'rejected' && formData.validation_notes && (
                    <p className="text-sm mt-2 font-medium">
                      Note : {formData.validation_notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section formulaire de profil */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`${garamond.className} text-4xl font-semibold text-[#D4A373]`}>▸ Mes informations</h2>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="cursor-pointer bg-[#D4A373] px-6 py-2 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363]"
              >
                Modifier
              </button>
            )}
          </div>

          {/* Messages d'erreur et de succès */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded mb-6">
              Profil mis à jour avec succès !
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom et Prénom */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="nom" className="block text-sm font-semibold text-slate-900">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373] disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label htmlFor="prenom" className="block text-sm font-semibold text-slate-900">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373] disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="Votre prénom"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 bg-slate-100 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-500">L&apos;email ne peut pas être modifié</p>
            </div>

            {/* Téléphone */}
            <div>
              <label htmlFor="telephone" className="block text-sm font-semibold text-slate-900">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373] disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="06 00 00 00 00"
              />
            </div>

            {/* Activité exercée */}
            <div>
              <label htmlFor="activite_exercee" className="block text-sm font-semibold text-slate-900">
                Activité exercée <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="activite_exercee"
                name="activite_exercee"
                value={formData.activite_exercee}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373] disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="Ex: Hypnothérapeute, Sophrologue..."
              />
            </div>

            {/* Carte d'identité */}
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                Carte d&apos;identité <span className="text-red-500">*</span>
              </label>
              {formData.carte_identite_url ? (
                <div className="mt-2">
                  {formData.carte_identite_rejection_notes && formData.carte_identite_status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-3 text-sm text-red-800">
                      <strong>Raison du refus :</strong> {formData.carte_identite_rejection_notes}
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <a
                      href={formData.carte_identite_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      {(() => {
                        const urlParts = formData.carte_identite_url.split('/');
                        const fileNameWithParams = urlParts[urlParts.length - 1];
                        const fileName = fileNameWithParams.split('?')[0];
                        // Extraire le nom après le timestamp
                        const parts = fileName.split('-');
                        if (parts.length >= 3) {
                          return parts.slice(2).join('-'); // Enlève "carte-identite-timestamp-"
                        }
                        return fileName;
                      })()}
                    </a>
                    {formData.carte_identite_status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument('carte')}
                        className="bg-[#d06264] hover:bg-[#c05254] text-white px-2 py-1 text-xs font-bold rounded cursor-pointer"
                        title="Supprimer le document"
                      >
                        X
                      </button>
                    )}
                    {formData.carte_identite_status === 'pending' && (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 text-sm font-medium">
                        Document en attente de validation
                      </span>
                    )}
                    {formData.carte_identite_status === 'approved' && (
                      <span className="bg-green-100 text-green-800 px-3 py-1  text-sm font-medium">
                        Document validé
                      </span>
                    )}
                    {formData.carte_identite_status === 'rejected' && (
                      <span className="bg-red-100 text-red-800 px-3 py-1 text-sm font-medium">
                        X Document refusé
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-4">
                  <input
                    type="file"
                    id="carte-identite-input"
                    onChange={(e) => handleFileChange(e, 'carte')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <label
                    htmlFor="carte-identite-input"
                    className="cursor-pointer bg-[#D4A373] px-6 py-2 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363]"
                  >
                    Ajouter un fichier
                  </label>
                  {carteIdentiteFile && (
                    <>
                      <span className="text-sm text-green-600 font-medium">
                        ✓ {carteIdentiteFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUploadDocument('carte')}
                        disabled={uploadingDoc}
                        className="cursor-pointer bg-green-600 px-6 py-2 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingDoc ? 'Upload...' : 'Upload'}
                      </button>
                    </>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1">Format accepté : PDF, JPG, PNG (max 5 MB)</p>
            </div>

            {/* KBIS */}
            <div>
              <label className="block text-sm font-semibold text-slate-900">
                KBIS ou justificatif professionnel <span className="text-red-500">*</span>
              </label>
              {formData.kbis_url ? (
                <div className="mt-2">
                  {formData.kbis_rejection_notes && formData.kbis_status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-3 text-sm text-red-800">
                      <strong>Raison du refus :</strong> {formData.kbis_rejection_notes}
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <a
                      href={formData.kbis_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      {(() => {
                        const urlParts = formData.kbis_url.split('/');
                        const fileNameWithParams = urlParts[urlParts.length - 1];
                        const fileName = fileNameWithParams.split('?')[0];
                        // Extraire le nom après le timestamp
                        const parts = fileName.split('-');
                        if (parts.length >= 2) {
                          return parts.slice(2).join('-'); // Enlève "kbis-timestamp-"
                        }
                        return fileName;
                      })()}
                    </a>
                    {formData.kbis_status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument('kbis')}
                        className="bg-[#d06264] hover:bg-[#c05254] text-white px-2 py-1 text-xs font-bold rounded cursor-pointer"
                        title="Supprimer le document"
                      >
                        X
                      </button>
                    )}
                    {formData.kbis_status === 'pending' && (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 text-sm font-medium">
                        Document en attente de validation
                      </span>
                    )}
                    {formData.kbis_status === 'approved' && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium">
                        Document validé
                      </span>
                    )}
                    {formData.kbis_status === 'rejected' && (
                      <span className="bg-red-100 text-red-800 px-3 py-1 text-sm font-medium">
                        X Document refusé
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-4">
                  <input
                    type="file"
                    id="kbis-input"
                    onChange={(e) => handleFileChange(e, 'kbis')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <label
                    htmlFor="kbis-input"
                    className="cursor-pointer bg-[#D4A373] px-6 py-2 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363]"
                  >
                    Ajouter un fichier
                  </label>
                  {kbisFile && (
                    <>
                      <span className="text-sm text-green-600 font-medium">
                        ✓ {kbisFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUploadDocument('kbis')}
                        disabled={uploadingDoc}
                        className="cursor-pointer bg-green-600 px-6 py-2 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingDoc ? 'Upload...' : 'Upload'}
                      </button>
                    </>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1">Format accepté : PDF, JPG, PNG (max 5 MB)</p>
            </div>

            {/* Bouton pour enregistrer les documents - visible si fichiers OU activité modifiée */}
            {(carteIdentiteFile || kbisFile || formData.activite_exercee) && formData.account_status !== 'approved' && (
              <div className="flex justify-center pt-6">
                <button
                  type="button"
                  onClick={handleSubmitDocuments}
                  disabled={uploadingDoc}
                  className="cursor-pointer bg-[#D4A373] px-8 py-3 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingDoc ? "Envoi en cours..." : "Enregistrer les documents"}
                </button>
              </div>
            )}

            {/* Boutons pour les informations personnelles - visible uniquement en mode édition */}
            {isEditing && (
              <div className="flex justify-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setCarteIdentiteFile(null);
                    setKbisFile(null);
                  }}
                  className="cursor-pointer bg-slate-300 px-8 py-3 font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-400"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer bg-[#D4A373] px-8 py-3 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Enregistrement..." : "Enregistrer mes informations"}
                </button>
              </div>
            )}
          </form>

        </div>
      </section>
    </div>
  );
}
