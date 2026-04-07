"use client";

import Image from "next/image";
import Link from "next/link";
import { EB_Garamond } from "next/font/google";
import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildAccountStatusFields,
  buildDocumentStatusPatch,
  deriveProfileVerificationState,
  toDocumentLabels,
  type AccountStatus,
  type DocumentType,
} from "@/lib/profileVerification";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type StorageDocumentType = 'carte-identite' | 'kbis' | 'rc-pro';

const DOCUMENTS_BUCKET = 'user-documents';

const normalizeRawDocumentPath = (value: string): string => {
  const trimmed = value.trim().replace(/^\/+/, '');

  if (!trimmed) {
    return '';
  }

  const bucketPrefix = `${DOCUMENTS_BUCKET}/`;
  return trimmed.startsWith(bucketPrefix) ? trimmed.slice(bucketPrefix.length) : trimmed;
};

const decodePathSafely = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const extractDocumentFilePath = (storedValue?: string | null): string | null => {
  if (!storedValue) {
    return null;
  }

  const trimmed = storedValue.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    const directPath = normalizeRawDocumentPath(trimmed);
    return directPath || null;
  }

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split('/').filter(Boolean);
    const bucketIndex = segments.indexOf(DOCUMENTS_BUCKET);

    if (bucketIndex !== -1 && bucketIndex + 1 < segments.length) {
      const fromBucket = normalizeRawDocumentPath(
        decodePathSafely(segments.slice(bucketIndex + 1).join('/'))
      );
      return fromBucket || null;
    }

    const objectIndex = segments.indexOf('object');
    if (objectIndex !== -1) {
      const mode = segments[objectIndex + 1] || '';
      const hasVisibilityMode =
        mode === 'public'
        || mode === 'sign'
        || mode === 'authenticated'
        || mode === 'private';

      const bucket = hasVisibilityMode ? segments[objectIndex + 2] : mode;
      const pathStart = hasVisibilityMode ? objectIndex + 3 : objectIndex + 2;

      if (bucket === DOCUMENTS_BUCKET && pathStart < segments.length) {
        const fromObject = normalizeRawDocumentPath(
          decodePathSafely(segments.slice(pathStart).join('/'))
        );
        return fromObject || null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const normalizeDocumentReference = (storedValue?: string | null): string => {
  const filePath = extractDocumentFilePath(storedValue);
  if (filePath) {
    return filePath;
  }

  return storedValue?.trim() || '';
};

const STATUS_LABELS: Record<AccountStatus, { label: string; color: string; description: string }> = {
  pending: {
    label: "En attente de documents",
    color: "bg-[#A97244] text-white border-[#A97244]",
    description: "Merci de compléter vos documents pour pouvoir réserver."
  },
  documents_submitted: {
    label: "En attente de validation de l'administrateur",
    color: "bg-[#D4A373] text-white border-[#D4A373]",
    description: "Vos documents sont en cours de vérification par l'administrateur."
  },
  approved: {
    label: "Validé",
    color: "bg-[#56862F] text-white border-[#56862F]",
    description: "Votre compte est validé, vous pouvez réserver."
  },
  rejected: {
    label: "Compte rejeté",
    color: "bg-[#B12F2E] text-white border-[#B12F2E]",
    description: "Votre compte a été rejeté. Veuillez contacter l'administrateur."
  }
};

export default function ProfilPage() {
  const { user, loading: authLoading, refreshProfile } = useAuth();
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
    adresse: "",
    siret: "",
    account_status: "pending" as AccountStatus,
    carte_identite_url: "",
    kbis_url: "",
    rc_pro_url: "",
    carte_identite_status: null as string | null,
    kbis_status: null as string | null,
    rc_pro_status: null as string | null,
    carte_identite_rejection_notes: "",
    kbis_rejection_notes: "",
    rc_pro_rejection_notes: "",
    validation_notes: "",
  });

  const [carteIdentiteFile, setCarteIdentiteFile] = useState<File | null>(null);
  const [kbisFile, setKbisFile] = useState<File | null>(null);
  const [rcProFile, setRcProFile] = useState<File | null>(null);

  const verificationState = useMemo(
    () => deriveProfileVerificationState({
      activite_exercee: formData.activite_exercee,
      carte_identite_url: formData.carte_identite_url,
      kbis_url: formData.kbis_url,
      rc_pro_url: formData.rc_pro_url,
      carte_identite_status: formData.carte_identite_status,
      kbis_status: formData.kbis_status,
      rc_pro_status: formData.rc_pro_status,
    }),
    [
      formData.activite_exercee,
      formData.carte_identite_url,
      formData.kbis_url,
      formData.rc_pro_url,
      formData.carte_identite_status,
      formData.kbis_status,
      formData.rc_pro_status,
    ]
  );

  const pendingDocumentLabels = toDocumentLabels(verificationState.pendingDocuments);
  const rejectedDocumentLabels = toDocumentLabels(verificationState.rejectedDocuments);
  const missingRequirementLabels = [
    ...toDocumentLabels(verificationState.missingDocuments),
    ...(verificationState.hasActivity ? [] : ['Activite exercee']),
  ];

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
        const normalizedCarteRef = normalizeDocumentReference(profile.carte_identite_url);
        const normalizedKbisRef = normalizeDocumentReference(profile.kbis_url);
        const normalizedRcProRef = normalizeDocumentReference(profile.rc_pro_url);

        const derivedState = deriveProfileVerificationState({
          activite_exercee: profile.activite_exercee,
          documents_submitted_at: profile.documents_submitted_at,
          carte_identite_url: normalizedCarteRef,
          kbis_url: normalizedKbisRef,
          rc_pro_url: normalizedRcProRef,
          carte_identite_status: profile.carte_identite_status,
          kbis_status: profile.kbis_status,
          rc_pro_status: profile.rc_pro_status,
        });
        const normalizedStatuses = buildDocumentStatusPatch(derivedState);
        const accountStatusFields = buildAccountStatusFields(
          derivedState,
          profile.documents_submitted_at
        );

        setFormData({
          nom: profile.nom || user.user_metadata?.nom || "",
          prenom: profile.prenom || user.user_metadata?.prenom || "",
          email: user.email || "",
          telephone: profile.telephone || user.user_metadata?.telephone || "",
          activite_exercee: profile.activite_exercee || user.user_metadata?.activite_exercee || "",
          adresse: profile.adresse || user.user_metadata?.adresse || "",
          siret: profile.siret || user.user_metadata?.siret || "",
          account_status: accountStatusFields.account_status,
          carte_identite_url: normalizedCarteRef,
          kbis_url: normalizedKbisRef,
          rc_pro_url: normalizedRcProRef,
          carte_identite_status: normalizedStatuses.carte_identite_status,
          kbis_status: normalizedStatuses.kbis_status,
          rc_pro_status: normalizedStatuses.rc_pro_status,
          carte_identite_rejection_notes: profile.carte_identite_rejection_notes || "",
          kbis_rejection_notes: profile.kbis_rejection_notes || "",
          rc_pro_rejection_notes: profile.rc_pro_rejection_notes || "",
          validation_notes: profile.validation_notes || "",
        });

        const normalizationUpdates: Record<string, string | null> = {};

        if (normalizedCarteRef && normalizedCarteRef !== (profile.carte_identite_url || "")) {
          normalizationUpdates.carte_identite_url = normalizedCarteRef;
        }
        if (normalizedKbisRef && normalizedKbisRef !== (profile.kbis_url || "")) {
          normalizationUpdates.kbis_url = normalizedKbisRef;
        }
        if (normalizedRcProRef && normalizedRcProRef !== (profile.rc_pro_url || "")) {
          normalizationUpdates.rc_pro_url = normalizedRcProRef;
        }

        if ((profile.carte_identite_status || null) !== normalizedStatuses.carte_identite_status) {
          normalizationUpdates.carte_identite_status = normalizedStatuses.carte_identite_status;
        }
        if ((profile.kbis_status || null) !== normalizedStatuses.kbis_status) {
          normalizationUpdates.kbis_status = normalizedStatuses.kbis_status;
        }
        if ((profile.rc_pro_status || null) !== normalizedStatuses.rc_pro_status) {
          normalizationUpdates.rc_pro_status = normalizedStatuses.rc_pro_status;
        }
        if ((profile.account_status || 'pending') !== accountStatusFields.account_status) {
          normalizationUpdates.account_status = accountStatusFields.account_status;
        }
        if ((profile.documents_submitted_at || null) !== accountStatusFields.documents_submitted_at) {
          normalizationUpdates.documents_submitted_at = accountStatusFields.documents_submitted_at;
        }
        if ((profile.validated_at || null) !== accountStatusFields.validated_at) {
          normalizationUpdates.validated_at = accountStatusFields.validated_at;
        }

        if (Object.keys(normalizationUpdates).length > 0) {
          const { error: normalizationError } = await supabase
            .from('profiles')
            .update(normalizationUpdates)
            .eq('id', user.id);

          if (normalizationError) {
            console.error('Erreur de normalisation des références de documents:', normalizationError);
          }
        }
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

  const getDocumentRefByType = (type: DocumentType): string => {
    if (type === 'carte') return formData.carte_identite_url;
    if (type === 'kbis') return formData.kbis_url;
    return formData.rc_pro_url;
  };

  const handleOpenDocument = async (type: DocumentType) => {
    setError(null);

    try {
      const storedRef = getDocumentRefByType(type);
      const filePath = extractDocumentFilePath(storedRef);

      if (!filePath) {
        throw new Error('Référence document invalide');
      }

      const supabase = createClient();
      const { data, error: signedUrlError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(filePath, 120);

      if (signedUrlError || !data?.signedUrl) {
        throw signedUrlError || new Error('URL signée indisponible');
      }

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setError("Impossible d'ouvrir le document. Veuillez réessayer.");
    }
  };

  const buildDocumentFieldPatch = (
    type: DocumentType,
    filePath: string | null,
    status: 'pending' | null
  ): Record<string, string | null> => {
    if (type === 'carte') {
      return {
        carte_identite_url: filePath,
        carte_identite_status: status,
        carte_identite_rejection_notes: null,
      };
    }

    if (type === 'kbis') {
      return {
        kbis_url: filePath,
        kbis_status: status,
        kbis_rejection_notes: null,
      };
    }

    return {
      rc_pro_url: filePath,
      rc_pro_status: status,
      rc_pro_rejection_notes: null,
    };
  };

  const clearSelectedDocumentFile = (type: DocumentType) => {
    if (type === 'carte') {
      setCarteIdentiteFile(null);
      return;
    }

    if (type === 'kbis') {
      setKbisFile(null);
      return;
    }

    setRcProFile(null);
  };

  const syncAccountStatusFromProfile = async (
    supabase: ReturnType<typeof createClient>,
    userId: string
  ) => {
    const { data: profileSnapshot, error: snapshotError } = await supabase
      .from('profiles')
      .select('activite_exercee, documents_submitted_at, carte_identite_url, kbis_url, rc_pro_url, carte_identite_status, kbis_status, rc_pro_status')
      .eq('id', userId)
      .single();

    if (snapshotError || !profileSnapshot) {
      throw new Error('Impossible de recalculer le statut du compte');
    }

    const derivedState = deriveProfileVerificationState(profileSnapshot);
    const normalizedStatuses = buildDocumentStatusPatch(derivedState);
    const accountStatusFields = buildAccountStatusFields(
      derivedState,
      profileSnapshot.documents_submitted_at
    );

    const { error: syncError } = await supabase
      .from('profiles')
      .update({
        ...normalizedStatuses,
        ...accountStatusFields,
      })
      .eq('id', userId);

    if (syncError) {
      throw syncError;
    }

    return {
      derivedState,
      normalizedStatuses,
      accountStatus: accountStatusFields.account_status,
    };
  };

  const applyLocalDocumentState = (
    type: DocumentType,
    filePath: string | null,
    normalizedStatuses: {
      carte_identite_status: 'pending' | 'approved' | 'rejected' | null;
      kbis_status: 'pending' | 'approved' | 'rejected' | null;
      rc_pro_status: 'pending' | 'approved' | 'rejected' | null;
    },
    accountStatus: AccountStatus
  ) => {
    setFormData((prev) => ({
      ...prev,
      account_status: accountStatus,
      carte_identite_status: normalizedStatuses.carte_identite_status,
      kbis_status: normalizedStatuses.kbis_status,
      rc_pro_status: normalizedStatuses.rc_pro_status,
      ...(type === 'carte'
        ? {
            carte_identite_url: filePath || '',
            carte_identite_rejection_notes: '',
          }
        : type === 'kbis'
          ? {
              kbis_url: filePath || '',
              kbis_rejection_notes: '',
            }
          : {
              rc_pro_url: filePath || '',
              rc_pro_rejection_notes: '',
            }),
    }));
  };

  const notifyAdminForSubmittedDocuments = async () => {
    try {
      await fetch('/api/emails/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: `${formData.prenom} ${formData.nom}`,
          userEmail: formData.email,
          userPhone: formData.telephone || 'Non renseigne',
          userActivity: formData.activite_exercee,
        }),
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email admin:", emailError);
    }
  };

  const handleDocumentMutationError = (err: unknown, fallbackMessage: string) => {
    const error = err as Error;
    if (error.message?.includes('storage')) {
      setError("Erreur lors de l'envoi du fichier. Verifiez votre connexion et reessayez.");
      return;
    }

    if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
      setError("Vous n'avez pas la permission de modifier ce document.");
      return;
    }

    setError(error.message || fallbackMessage);
  };

  const uploadAndSyncDocument = async (type: DocumentType, file: File) => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      throw new Error('Utilisateur non connecte');
    }

    const previousAccountStatus = formData.account_status;
    const documentType: StorageDocumentType =
      type === 'carte' ? 'carte-identite' : type === 'kbis' ? 'kbis' : 'rc-pro';

    const filePath = await uploadDocument(file, documentType);
    const updateData = buildDocumentFieldPatch(type, filePath, 'pending');

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', authUser.id);

    if (updateError) {
      throw updateError;
    }

    const { derivedState, normalizedStatuses, accountStatus } = await syncAccountStatusFromProfile(
      supabase,
      authUser.id
    );

    applyLocalDocumentState(type, filePath, normalizedStatuses, accountStatus);
    clearSelectedDocumentFile(type);
    await refreshProfile();

    if (previousAccountStatus !== 'documents_submitted' && accountStatus === 'documents_submitted' && derivedState.pendingDocuments.length > 0) {
      await notifyAdminForSubmittedDocuments();
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier ne doit pas dépasser 5 MB");
      return;
    }

    // Vérifier le type MIME
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError("Format non autorisé. Utilisez PDF, JPG ou PNG");
      return;
    }

    // Vérifier que l'extension correspond au type MIME
    const ext = file.name.split('.').pop()?.toLowerCase();
    const mimeToExt: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
    };
    const allowedExts = mimeToExt[file.type] || [];
    if (!ext || !allowedExts.includes(ext)) {
      setError("L'extension du fichier ne correspond pas à son format. Vérifiez le fichier.");
      return;
    }

    if (type === 'carte') {
      setCarteIdentiteFile(file);
    } else if (type === 'kbis') {
      setKbisFile(file);
    } else {
      setRcProFile(file);
    }
    setError(null);

    // Upload automatiquement le fichier
    setUploadingDoc(true);
    try {
      await uploadAndSyncDocument(type, file);
    } catch (err) {
      handleDocumentMutationError(err, "Erreur lors de l'upload du document. Veuillez reessayer.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (type: DocumentType) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    setUploadingDoc(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Utilisateur non connecte");

      // Supprimer le fichier du storage
      const storedRef = getDocumentRefByType(type);

      if (storedRef) {
        const filePath = extractDocumentFilePath(storedRef);

        if (!filePath) {
          throw new Error("Impossible d'identifier le document à supprimer.");
        }

        const { error: removeError } = await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .remove([filePath]);

        if (removeError) {
          throw new Error(`Suppression du fichier impossible: ${removeError.message}`);
        }
      }

      const updateData = buildDocumentFieldPatch(type, null, null);

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', authUser.id);

      if (updateError) throw updateError;

      const { normalizedStatuses, accountStatus } = await syncAccountStatusFromProfile(
        supabase,
        authUser.id
      );

      applyLocalDocumentState(type, null, normalizedStatuses, accountStatus);
      clearSelectedDocumentFile(type);
      await refreshProfile();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      const error = err as Error;
      setError(error.message || "Erreur lors de la suppression");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleUploadDocument = async (type: DocumentType) => {
    const file = type === 'carte' ? carteIdentiteFile : type === 'kbis' ? kbisFile : rcProFile;
    if (!file) return;

    setUploadingDoc(true);
    setError(null);

    try {
      await uploadAndSyncDocument(type, file);
    } catch (err) {
      handleDocumentMutationError(err, "Erreur lors de l'upload du document. Veuillez reessayer.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const uploadDocument = async (file: File, documentType: StorageDocumentType): Promise<string> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Utilisateur non connecté");

    // Sanitize: extraire uniquement l'extension et utiliser un nom sécurisé
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = originalName.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const filePath = `${user.id}/${documentType}-${timestamp}.${ext}`;

    // Upload le nouveau fichier
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    return filePath;
  };

  const handleSubmitDocuments = async () => {
    if (!carteIdentiteFile && !kbisFile && !rcProFile && !formData.activite_exercee) {
      setError("Veuillez remplir au moins un champ");
      return;
    }

    setUploadingDoc(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Utilisateur non connecte");

      const previousAccountStatus = formData.account_status;

      let carteUrl = formData.carte_identite_url;
      let kbisUrl = formData.kbis_url;
      let rcProUrl = formData.rc_pro_url;
      const profileUpdatePayload: Record<string, string | null> = {
        activite_exercee: formData.activite_exercee,
      };

      // Upload des fichiers si présents
      if (carteIdentiteFile) {
        carteUrl = await uploadDocument(carteIdentiteFile, 'carte-identite');
        Object.assign(profileUpdatePayload, buildDocumentFieldPatch('carte', carteUrl, 'pending'));
      }
      if (kbisFile) {
        kbisUrl = await uploadDocument(kbisFile, 'kbis');
        Object.assign(profileUpdatePayload, buildDocumentFieldPatch('kbis', kbisUrl, 'pending'));
      }
      if (rcProFile) {
        rcProUrl = await uploadDocument(rcProFile, 'rc-pro');
        Object.assign(profileUpdatePayload, buildDocumentFieldPatch('rc_pro', rcProUrl, 'pending'));
      }

      // Mise à jour du profil
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdatePayload)
        .eq('id', authUser.id)
        .select();

      if (updateError) {
        throw new Error(`Erreur de mise à jour: ${updateError.message}`);
      }

      if (!updateData || updateData.length === 0) {
        throw new Error('La mise à jour a été bloquée par les règles de sécurité');
      }

      const { derivedState, normalizedStatuses, accountStatus } = await syncAccountStatusFromProfile(
        supabase,
        authUser.id
      );

      // Mettre à jour l'état local avec les nouvelles valeurs
      setFormData(prev => ({
        ...prev,
        activite_exercee: formData.activite_exercee,
        account_status: accountStatus,
        carte_identite_url: carteUrl || "",
        kbis_url: kbisUrl || "",
        rc_pro_url: rcProUrl || "",
        carte_identite_status: normalizedStatuses.carte_identite_status,
        kbis_status: normalizedStatuses.kbis_status,
        rc_pro_status: normalizedStatuses.rc_pro_status,
      }));

      setCarteIdentiteFile(null);
      setKbisFile(null);
      setRcProFile(null);
      await refreshProfile();
      setSuccess(true);

      if (
        previousAccountStatus !== 'documents_submitted'
        && accountStatus === 'documents_submitted'
        && derivedState.pendingDocuments.length > 0
      ) {
        await notifyAdminForSubmittedDocuments();
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
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          activite_exercee: formData.activite_exercee,
          adresse: formData.adresse,
          siret: formData.siret,
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        throw updateError;
      }

      const { normalizedStatuses, accountStatus } = await syncAccountStatusFromProfile(
        supabase,
        user.id
      );

      setFormData((prev) => ({
        ...prev,
        account_status: accountStatus,
        carte_identite_status: normalizedStatuses.carte_identite_status,
        kbis_status: normalizedStatuses.kbis_status,
        rc_pro_status: normalizedStatuses.rc_pro_status,
      }));

      await refreshProfile();

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
                  {formData.account_status === 'documents_submitted' && pendingDocumentLabels.length > 0 && (
                    <p className="text-sm mt-2 font-medium">
                      Documents en attente : {pendingDocumentLabels.join(', ')}
                    </p>
                  )}
                  {formData.account_status === 'pending' && missingRequirementLabels.length > 0 && (
                    <p className="text-sm mt-2 font-medium">
                      Elements manquants : {missingRequirementLabels.join(', ')}
                    </p>
                  )}
                  {formData.account_status === 'rejected' && rejectedDocumentLabels.length > 0 && (
                    <p className="text-sm mt-2 font-medium">
                      Documents refuses : {rejectedDocumentLabels.join(', ')}
                    </p>
                  )}
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
      <section className="bg-slate-50 pt-10 pb-16">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`${garamond.className} text-4xl font-semibold text-[#D4A373]`}>▸ Mes informations</h2>
          </div>

          {/* Messages d'erreur et de succès */}
          {error && (
            <div className="bg-[#B12F2E] border border-[#B12F2E] text-white px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-[#56862F] border border-[#56862F] text-white px-4 py-3 rounded mb-6">
              Profil mis à jour avec succès !
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Adresse complète */}
            <div>
              <label htmlFor="adresse" className="block text-sm font-semibold text-slate-900">
                Adresse complète <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373] disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="12 avenue Jean Médecin, 06000 Nice"
              />
              <p className="mt-1 text-xs text-slate-500">Adresse utilisée pour la facturation : <strong>Adresse, Code Postal Ville</strong></p>
            </div>

            {/* SIRET */}
            <div>
              <label htmlFor="siret" className="block text-sm font-semibold text-slate-900">
                SIRET <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="siret"
                name="siret"
                value={formData.siret}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373] disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="Ex: 123 456 789 00012"
              />
              <p className="mt-1 text-xs text-slate-500">Numéro SIRET de votre activité</p>
            </div>

            {/* Documents — 3 colonnes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">

              {/* Carte d'identité */}
              <div className="border border-slate-200 bg-white p-4 flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  Carte d&apos;identité <span className="text-red-500">*</span>
                </span>
                {formData.carte_identite_url ? (
                  <>
                    {formData.carte_identite_rejection_notes && formData.carte_identite_status === 'rejected' && (
                      <div className="bg-[#B12F2E] rounded p-2 text-xs text-white">
                        <strong>Refus :</strong> {formData.carte_identite_rejection_notes}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenDocument('carte')}
                      className="text-xs text-blue-600 hover:text-blue-800 underline truncate text-left cursor-pointer"
                    >
                      Voir le document
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                      {formData.carte_identite_status === 'pending' && (
                        <span className="bg-[#A97244] text-white px-2 py-0.5 text-xs font-medium">En attente</span>
                      )}
                      {formData.carte_identite_status === 'approved' && (
                        <span className="bg-[#56862F] text-white px-2 py-0.5 text-xs font-medium">Validé</span>
                      )}
                      {formData.carte_identite_status === 'rejected' && (
                        <span className="bg-[#B12F2E] text-white px-2 py-0.5 text-xs font-medium">Refusé</span>
                      )}
                      {formData.carte_identite_status !== 'approved' && (
                        <button type="button" onClick={() => handleDeleteDocument('carte')}
                          className="bg-[#d06264] hover:bg-[#c05254] text-white px-2 py-0.5 text-xs font-bold rounded cursor-pointer"
                          title="Supprimer">X</button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <input type="file" id="carte-identite-input"
                      onChange={(e) => handleFileChange(e, 'carte')}
                      accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                    <label htmlFor="carte-identite-input"
                      className="cursor-pointer bg-[#D4A373] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363] text-center">
                      + Ajouter un fichier
                    </label>
                    {carteIdentiteFile && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#56862F] font-medium truncate">✓ {carteIdentiteFile.name}</span>
                        <button type="button" onClick={() => handleUploadDocument('carte')}
                          disabled={uploadingDoc}
                          className="cursor-pointer bg-[#56862F] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white text-center transition-colors hover:bg-[#456d25] disabled:opacity-50 disabled:cursor-not-allowed">
                          {uploadingDoc ? 'Upload...' : 'Envoyer'}
                        </button>
                      </div>
                    )}
                  </>
                )}
                <p className="text-xs text-slate-400 mt-auto">PDF, JPG, PNG · max 5 MB</p>
              </div>

              {/* KBIS */}
              <div className="border border-slate-200 bg-white p-4 flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  KBIS ou justificatif <span className="text-red-500">*</span>
                </span>
                {formData.kbis_url ? (
                  <>
                    {formData.kbis_rejection_notes && formData.kbis_status === 'rejected' && (
                      <div className="bg-[#B12F2E] rounded p-2 text-xs text-white">
                        <strong>Refus :</strong> {formData.kbis_rejection_notes}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenDocument('kbis')}
                      className="text-xs text-blue-600 hover:text-blue-800 underline truncate text-left cursor-pointer"
                    >
                      Voir le document
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                      {formData.kbis_status === 'pending' && (
                        <span className="bg-[#A97244] text-white px-2 py-0.5 text-xs font-medium">En attente</span>
                      )}
                      {formData.kbis_status === 'approved' && (
                        <span className="bg-[#56862F] text-white px-2 py-0.5 text-xs font-medium">Validé</span>
                      )}
                      {formData.kbis_status === 'rejected' && (
                        <span className="bg-[#B12F2E] text-white px-2 py-0.5 text-xs font-medium">Refusé</span>
                      )}
                      {formData.kbis_status !== 'approved' && (
                        <button type="button" onClick={() => handleDeleteDocument('kbis')}
                          className="bg-[#d06264] hover:bg-[#c05254] text-white px-2 py-0.5 text-xs font-bold rounded cursor-pointer"
                          title="Supprimer">X</button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <input type="file" id="kbis-input"
                      onChange={(e) => handleFileChange(e, 'kbis')}
                      accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                    <label htmlFor="kbis-input"
                      className="cursor-pointer bg-[#D4A373] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363] text-center">
                      + Ajouter un fichier
                    </label>
                    {kbisFile && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#56862F] font-medium truncate">✓ {kbisFile.name}</span>
                        <button type="button" onClick={() => handleUploadDocument('kbis')}
                          disabled={uploadingDoc}
                          className="cursor-pointer bg-[#56862F] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white text-center transition-colors hover:bg-[#456d25] disabled:opacity-50 disabled:cursor-not-allowed">
                          {uploadingDoc ? 'Upload...' : 'Envoyer'}
                        </button>
                      </div>
                    )}
                  </>
                )}
                <p className="text-xs text-slate-400 mt-auto">PDF, JPG, PNG · max 5 MB</p>
              </div>

              {/* RC Pro */}
              <div className="border border-slate-200 bg-white p-4 flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  Attestation RC Pro <span className="text-red-500">*</span>
                </span>
                {formData.rc_pro_url ? (
                  <>
                    {formData.rc_pro_rejection_notes && formData.rc_pro_status === 'rejected' && (
                      <div className="bg-[#B12F2E] rounded p-2 text-xs text-white">
                        <strong>Refus :</strong> {formData.rc_pro_rejection_notes}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenDocument('rc_pro')}
                      className="text-xs text-blue-600 hover:text-blue-800 underline truncate text-left cursor-pointer"
                    >
                      Voir le document
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                      {formData.rc_pro_status === 'pending' && (
                        <span className="bg-[#A97244] text-white px-2 py-0.5 text-xs font-medium">En attente</span>
                      )}
                      {formData.rc_pro_status === 'approved' && (
                        <span className="bg-[#56862F] text-white px-2 py-0.5 text-xs font-medium">Validé</span>
                      )}
                      {formData.rc_pro_status === 'rejected' && (
                        <span className="bg-[#B12F2E] text-white px-2 py-0.5 text-xs font-medium">Refusé</span>
                      )}
                      {formData.rc_pro_status !== 'approved' && (
                        <button type="button" onClick={() => handleDeleteDocument('rc_pro')}
                          className="bg-[#d06264] hover:bg-[#c05254] text-white px-2 py-0.5 text-xs font-bold rounded cursor-pointer"
                          title="Supprimer">X</button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <input type="file" id="rc-pro-input"
                      onChange={(e) => handleFileChange(e, 'rc_pro')}
                      accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
                    <label htmlFor="rc-pro-input"
                      className="cursor-pointer bg-[#D4A373] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363] text-center">
                      + Ajouter un fichier
                    </label>
                    {rcProFile && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#56862F] font-medium truncate">✓ {rcProFile.name}</span>
                        <button type="button" onClick={() => handleUploadDocument('rc_pro')}
                          disabled={uploadingDoc}
                          className="cursor-pointer bg-[#56862F] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white text-center transition-colors hover:bg-[#456d25] disabled:opacity-50 disabled:cursor-not-allowed">
                          {uploadingDoc ? 'Upload...' : 'Envoyer'}
                        </button>
                      </div>
                    )}
                  </>
                )}
                <p className="text-xs text-slate-400 mt-auto">PDF, JPG, PNG · max 5 MB</p>
              </div>

            </div>

            {/* Boutons d'action */}
            <div className="flex flex-wrap items-center gap-4 pt-6">
              <Link
                href="/modifier-mot-de-passe"
                className="bg-slate-700 px-8 py-3 font-semibold uppercase tracking-wide text-white text-sm transition-colors hover:bg-slate-600"
              >
                Modifier le mot de passe
              </Link>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="cursor-pointer bg-[#D4A373] px-8 py-3 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363]"
                >
                  Modifier mes informations
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setCarteIdentiteFile(null);
                      setKbisFile(null);
                      setRcProFile(null);
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
                    {loading ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </>
              )}

            </div>
          </form>

        </div>
      </section>
    </div>
  );
}
