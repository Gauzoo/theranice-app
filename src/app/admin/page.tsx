"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { EB_Garamond } from "next/font/google";
import Image from "next/image";

import {
  ROOM_LABELS,
  SLOT_LABELS,
  getPrice,
  type Slot,
  type Room,
} from '@/lib/constants';

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface Booking {
  id: string;
  user_id: string;
  date: string;
  slot: string;
  room: string;
  price: number;
  status: string;
  created_at: string;
  access_code: string | null;
  nuki_code_status: string | null;
  nuki_auth_id: string | null;
  profiles?: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
}

interface Member {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  created_at: string;
  account_status?: 'pending' | 'documents_submitted' | 'approved' | 'rejected';
  activite_exercee?: string;
  adresse?: string;
  siret?: string;
  validation_notes?: string;
  carte_identite_url?: string;
  kbis_url?: string;
  rc_pro_url?: string;
  carte_identite_status?: string | null;
  kbis_status?: string | null;
  rc_pro_status?: string | null;
  carte_identite_rejection_notes?: string;
  kbis_rejection_notes?: string;
  rc_pro_rejection_notes?: string;
}

interface PendingValidation extends Member {
  account_status: 'pending' | 'documents_submitted' | 'approved' | 'rejected';
  documents_submitted_at?: string;
}

type AdminDocumentType = 'carte' | 'kbis' | 'rc_pro';

type MemberModalFeedback = {
  type: 'success' | 'error';
  message: string;
} | null;



const MEMBER_DOCUMENTS: Array<{
  type: AdminDocumentType;
  label: string;
  accept: string;
}> = [
  {
    type: 'carte',
    label: "Carte d'identité",
    accept: '.pdf,.jpg,.jpeg,.png,.webp',
  },
  {
    type: 'kbis',
    label: 'KBIS',
    accept: '.pdf,.jpg,.jpeg,.png,.webp',
  },
  {
    type: 'rc_pro',
    label: 'RC Pro',
    accept: '.pdf,.jpg,.jpeg,.png,.webp',
  },
];

const MAX_MEMBER_DOCUMENT_SIZE = 6 * 1024 * 1024;

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "past">("upcoming");
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<Array<{id: string, nom: string, prenom: string, telephone?: string}>>([]);
  
  // Section Membres
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberModalFeedback, setMemberModalFeedback] = useState<MemberModalFeedback>(null);
  const [memberSaveLoading, setMemberSaveLoading] = useState(false);
  const [memberDocumentLoading, setMemberDocumentLoading] = useState<Record<AdminDocumentType, boolean>>({
    carte: false,
    kbis: false,
    rc_pro: false,
  });
  const [memberDocumentFiles, setMemberDocumentFiles] = useState<Record<AdminDocumentType, File | null>>({
    carte: null,
    kbis: null,
    rc_pro: null,
  });
  
  // Section Validation de comptes
  const [pendingValidations, setPendingValidations] = useState<PendingValidation[]>([]);
  
  const router = useRouter();

  // Formulaire d'ajout
  const [newBooking, setNewBooking] = useState({
    userId: '',
    date: '',
    slot: 'morning' as 'morning' | 'afternoon' | 'fullday',
    room: 'room1' as 'room1' | 'room2' | 'large',
    price: 50,
  });

  // Statistiques
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    monthRevenue: 0,
  });

  useEffect(() => {
    const supabase = createClient();

    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBookings(),
          fetchMembers(),
        ]);
      } catch (error) {
        console.error('Error while loading admin dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace('/connexion');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const getPendingValidationsFromMembers = (memberList: Member[]): PendingValidation[] => {
    return memberList.filter((member): member is PendingValidation => {
      if (
        member.account_status !== 'pending'
        && member.account_status !== 'documents_submitted'
        && member.account_status !== 'approved'
        && member.account_status !== 'rejected'
      ) {
        return false;
      }

      if (member.account_status === 'rejected' || member.account_status === 'approved') {
        return false;
      }

      return (
        member.carte_identite_status === 'pending'
        || member.kbis_status === 'pending'
        || member.rc_pro_status === 'pending'
        || member.account_status === 'documents_submitted'
        || member.account_status === 'pending'
      );
    });
  };

  const fetchMembers = async (): Promise<Member[] | null> => {
    setMembersLoading(true);
    setMembersError(null);

    try {
      const response = await fetch('/api/admin/members', { cache: 'no-store' });
      const result = await response.json().catch(() => ({} as { members?: unknown; error?: string }));

      if (!response.ok) {
        console.error('Error fetching members — full response:', JSON.stringify(result));
        const apiError = typeof result.error === 'string'
          ? result.error
          : 'Erreur lors de la récupération des membres';
        setMembersError(apiError);
        return null;
      }

      if (!Array.isArray(result.members)) {
        const shapeError = 'Réponse invalide du serveur pour les membres';
        setMembersError(shapeError);
        console.error('Error fetching members:', shapeError);
        return null;
      }

      const memberList = result.members as Member[];
      setMembers(memberList);
      setUsers(
        memberList.map((member) => ({
          id: member.id,
          nom: member.nom,
          prenom: member.prenom,
          telephone: member.telephone,
        }))
      );
      setPendingValidations(getPendingValidationsFromMembers(memberList));
      return memberList;
    } catch (error) {
      setMembersError('Erreur lors de la récupération des membres');
      console.error('Error fetching members:', error);
    } finally {
      setMembersLoading(false);
    }

    return null;
  };

  const fetchPendingValidations = async () => {
    await fetchMembers();
  };

  const fetchBookings = async () => {
    const supabase = createClient();
    setBookingsLoading(true);

    try {
      // Récupère toutes les réservations (avec cache bypass)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Récupère tous les profils en une seule requête
      const userIds = [...new Set(bookingsData?.map(b => b.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nom, prenom, telephone')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Crée un map des profils pour un accès rapide
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Associe les profils aux réservations (sans email pour l'instant)
      const bookingsWithProfiles = bookingsData?.map(booking => ({
        ...booking,
        profiles: {
          ...profilesMap.get(booking.user_id),
          email: '' // L'email n'est pas accessible facilement côté client
        }
      })) || [];

      setBookings(bookingsWithProfiles as Booking[]);
      calculateStats(bookingsWithProfiles as Booking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      alert('Erreur : ' + errorMessage);
    } finally {
      setBookingsLoading(false);
    }
  };

  const calculateStats = (allBookings: Booking[]) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
    
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.price, 0);
    const totalBookings = confirmedBookings.length;
    
    const upcomingBookings = confirmedBookings.filter(b => {
      const bookingDate = new Date(b.date + 'T00:00:00');
      return bookingDate >= now;
    }).length;

    const monthRevenue = confirmedBookings
      .filter(b => {
        const bookingDate = new Date(b.date + 'T00:00:00');
        return bookingDate.getMonth() === currentMonth && 
               bookingDate.getFullYear() === currentYear;
      })
      .reduce((sum, b) => sum + b.price, 0);

    setStats({
      totalRevenue,
      totalBookings,
      upcomingBookings,
      monthRevenue,
    });
  };

  const getFilteredBookings = (): Booking[] => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case "today":
        return bookings.filter(b => {
          const bookingDate = new Date(b.date + 'T00:00:00');
          return bookingDate.getTime() === today.getTime() && (b.status === 'confirmed' || b.status === 'pending_payment');
        });
      case "upcoming":
        return bookings.filter(b => {
          const bookingDate = new Date(b.date + 'T00:00:00');
          return bookingDate >= now && (b.status === 'confirmed' || b.status === 'pending_payment');
        });
      case "past":
        return bookings.filter(b => {
          const bookingDate = new Date(b.date + 'T00:00:00');
          return bookingDate < now && b.status === 'confirmed';
        });
      default:
        // Trie par ordre décroissant de date pour 'all'
        return bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      return;
    }

    try {
      // Appelle l'API serveur qui gère la suppression + révocation du code Nuki
      const response = await fetch('/api/admin/delete-booking', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert('Erreur lors de la suppression : ' + (result.error || 'Erreur inconnue'));
      } else {
        // Suppression immédiate de la liste locale pour feedback instantané
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        alert('Réservation supprimée avec succès');
        // Recharge depuis Supabase pour être sûr
        setTimeout(() => fetchBookings(), 500);
      }
    } catch (err) {
      console.error('Erreur catch:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      alert('Erreur : ' + errorMessage);
    }
  };

  const refreshEditingMember = async (memberId: string) => {
    const refreshedMembers = await fetchMembers();

    if (!refreshedMembers) {
      return null;
    }

    const refreshedMember = refreshedMembers.find((member) => member.id === memberId) || null;
    setEditingMember(refreshedMember);
    return refreshedMember;
  };

  const closeEditMemberModal = () => {
    setShowEditMemberModal(false);
    setEditingMember(null);
    setMemberModalFeedback(null);
    setMemberSaveLoading(false);
    setMemberDocumentLoading({
      carte: false,
      kbis: false,
      rc_pro: false,
    });
    setMemberDocumentFiles({
      carte: null,
      kbis: null,
      rc_pro: null,
    });
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberModalFeedback(null);
    setMemberSaveLoading(false);
    setMemberDocumentLoading({
      carte: false,
      kbis: false,
      rc_pro: false,
    });
    setMemberDocumentFiles({
      carte: null,
      kbis: null,
      rc_pro: null,
    });
    setShowEditMemberModal(true);
  };

  const getMemberDocumentUrl = (member: Member, documentType: AdminDocumentType) => {
    if (documentType === 'carte') {
      return member.carte_identite_url;
    }
    if (documentType === 'kbis') {
      return member.kbis_url;
    }
    return member.rc_pro_url;
  };

  const getMemberDocumentStatus = (member: Member, documentType: AdminDocumentType) => {
    if (documentType === 'carte') {
      return member.carte_identite_status;
    }
    if (documentType === 'kbis') {
      return member.kbis_status;
    }
    return member.rc_pro_status;
  };

  const getMemberDocumentNotes = (member: Member, documentType: AdminDocumentType) => {
    if (documentType === 'carte') {
      return member.carte_identite_rejection_notes;
    }
    if (documentType === 'kbis') {
      return member.kbis_rejection_notes;
    }
    return member.rc_pro_rejection_notes;
  };

  const getDocumentStatusDisplay = (status: string | null | undefined) => {
    if (status === 'approved') {
      return { label: 'Validé', className: 'bg-[#56862F] text-white' };
    }
    if (status === 'rejected') {
      return { label: 'Refusé', className: 'bg-[#B12F2E] text-white' };
    }
    if (status === 'pending') {
      return { label: 'En attente', className: 'bg-[#A97244] text-white' };
    }
    return { label: 'Manquant', className: 'bg-slate-200 text-slate-700' };
  };

  const setDocumentLoadingState = (documentType: AdminDocumentType, value: boolean) => {
    setMemberDocumentLoading((prev) => ({
      ...prev,
      [documentType]: value,
    }));
  };

  const handleSelectMemberDocument = (documentType: AdminDocumentType, file: File | null) => {
    if (!file) {
      setMemberDocumentFiles((prev) => ({
        ...prev,
        [documentType]: null,
      }));
      return;
    }

    const allowedMimeTypes = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);

    if (!allowedMimeTypes.has(file.type)) {
      setMemberModalFeedback({
        type: 'error',
        message: 'Format non autorisé. Utilisez PDF, JPG, PNG ou WEBP.',
      });
      return;
    }

    if (file.size > MAX_MEMBER_DOCUMENT_SIZE) {
      setMemberModalFeedback({
        type: 'error',
        message: 'Le fichier est trop volumineux (max 6 Mo).',
      });
      return;
    }

    setMemberModalFeedback(null);
    setMemberDocumentFiles((prev) => ({
      ...prev,
      [documentType]: file,
    }));
  };

  const handleOpenMemberDocument = (documentType: AdminDocumentType) => {
    if (!editingMember) {
      return;
    }

    const documentReference = getMemberDocumentUrl(editingMember, documentType);
    if (!documentReference) {
      setMemberModalFeedback({
        type: 'error',
        message: 'Aucun document disponible pour cette catégorie.',
      });
      return;
    }

    window.open(
      `/api/admin/view-document?userId=${editingMember.id}&fileType=${documentType}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleUploadMemberDocument = async (documentType: AdminDocumentType) => {
    if (!editingMember) {
      return;
    }

    const selectedFile = memberDocumentFiles[documentType];
    if (!selectedFile) {
      setMemberModalFeedback({
        type: 'error',
        message: 'Sélectionnez un fichier avant de lancer l\'upload.',
      });
      return;
    }

    setDocumentLoadingState(documentType, true);
    setMemberModalFeedback(null);

    try {
      const formData = new FormData();
      formData.append('userId', editingMember.id);
      formData.append('documentType', documentType);
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/member-document', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setMemberModalFeedback({
          type: 'error',
          message: result.error || 'Erreur lors de l\'upload du document.',
        });
        return;
      }

      await refreshEditingMember(editingMember.id);

      setMemberDocumentFiles((prev) => ({
        ...prev,
        [documentType]: null,
      }));
      setMemberModalFeedback({
        type: 'success',
        message: 'Document mis à jour avec succès.',
      });
    } catch (error) {
      console.error('Error uploading member document:', error);
      setMemberModalFeedback({
        type: 'error',
        message: 'Une erreur est survenue pendant l\'upload du document.',
      });
    } finally {
      setDocumentLoadingState(documentType, false);
    }
  };

  const handleDeleteMemberDocument = async (documentType: AdminDocumentType) => {
    if (!editingMember) {
      return;
    }

    const documentRef = getMemberDocumentUrl(editingMember, documentType);
    if (!documentRef) {
      setMemberModalFeedback({
        type: 'error',
        message: 'Aucun document à supprimer pour cette catégorie.',
      });
      return;
    }

    if (!confirm('Confirmer la suppression de ce document ?')) {
      return;
    }

    setDocumentLoadingState(documentType, true);
    setMemberModalFeedback(null);

    try {
      const response = await fetch('/api/admin/member-document', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingMember.id,
          documentType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMemberModalFeedback({
          type: 'error',
          message: result.error || 'Erreur lors de la suppression du document.',
        });
        return;
      }

      await refreshEditingMember(editingMember.id);

      setMemberDocumentFiles((prev) => ({
        ...prev,
        [documentType]: null,
      }));
      setMemberModalFeedback({
        type: 'success',
        message: 'Document supprimé avec succès.',
      });
    } catch (error) {
      console.error('Error deleting member document:', error);
      setMemberModalFeedback({
        type: 'error',
        message: 'Une erreur est survenue pendant la suppression du document.',
      });
    } finally {
      setDocumentLoadingState(documentType, false);
    }
  };

  const handleSaveMember = async () => {
    if (!editingMember) {
      return;
    }

    setMemberSaveLoading(true);
    setMemberModalFeedback(null);

    try {
      const response = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId: editingMember.id,
          nom: editingMember.nom,
          prenom: editingMember.prenom,
          telephone: editingMember.telephone,
          activite_exercee: editingMember.activite_exercee,
          adresse: editingMember.adresse,
          siret: editingMember.siret,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMemberModalFeedback({
          type: 'error',
          message: result.error || 'Erreur lors de la modification du membre.',
        });
        return;
      }

      if (result.member) {
        setEditingMember(result.member);
      }

      await fetchMembers();

      setMemberModalFeedback({
        type: 'success',
        message: 'Informations du membre mises à jour avec succès.',
      });
    } catch (error) {
      console.error('Error saving member:', error);
      setMemberModalFeedback({
        type: 'error',
        message: 'Une erreur est survenue pendant la sauvegarde du membre.',
      });
    } finally {
      setMemberSaveLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Erreur lors de la suppression');
        return;
      }

      alert('Membre supprimé avec succès');
      if (editingMember?.id === memberId) {
        closeEditMemberModal();
      }
      await fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Erreur lors de la suppression du membre');
    }
  };

  const handleValidateDocument = async (userId: string, documentType: 'carte' | 'kbis' | 'rc_pro', action: 'approve' | 'reject') => {
    const docName = documentType === 'carte' ? 'Carte d\'identité' : documentType === 'kbis' ? 'KBIS' : 'RC Pro';
    
    if (action === 'reject') {
      const notes = prompt(`Raison du refus du ${docName} :`);
      if (!notes || !notes.trim()) {
        alert('Veuillez indiquer la raison du refus');
        return;
      }
      
      if (!confirm(`Êtes-vous sûr de vouloir rejeter ce ${docName} ?`)) {
        return;
      }

      try {
        const response = await fetch('/api/admin/validate-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, documentType, action, notes }),
        });

        const result = await response.json();

        if (response.ok) {
          let feedback = `${docName} rejete avec succes`;
          if (result?.notification?.triggered) {
            if (result.notification.emailSent) {
              feedback += '\nEmail de decision envoye au client.';
            } else {
              feedback += `\nDecision enregistree, mais email non envoye: ${result.notification.emailError || 'erreur inconnue'}`;
            }
          }

          alert(feedback);
          await fetchMembers();
        } else {
          alert('Erreur : ' + result.error);
        }
      } catch (error) {
        alert('Erreur lors du rejet du document');
        console.error(error);
      }
    } else {
      if (!confirm(`Êtes-vous sûr de vouloir valider ce ${docName} ?`)) {
        return;
      }

      try {
        const response = await fetch('/api/admin/validate-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, documentType, action }),
        });

        const result = await response.json();

        if (response.ok) {
          let feedback = `${docName} valide avec succes`;
          if (result?.notification?.triggered) {
            if (result.notification.emailSent) {
              feedback += '\nEmail de decision envoye au client.';
            } else {
              feedback += `\nDecision enregistree, mais email non envoye: ${result.notification.emailError || 'erreur inconnue'}`;
            }
          }

          alert(feedback);
          await fetchMembers();
        } else {
          alert('Erreur : ' + result.error);
        }
      } catch (error) {
        alert('Erreur lors de la validation du document');
        console.error(error);
      }
    }
  };

  const handleAddBooking = async () => {
    if (!newBooking.userId || !newBooking.date || !newBooking.slot || !newBooking.room) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      const response = await fetch('/api/admin/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newBooking.userId,
          date: newBooking.date,
          slot: newBooking.slot,
          room: newBooking.room,
          price: newBooking.price,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert('Erreur : ' + (result.error || 'Erreur inconnue'));
        return;
      }

      const codeMsg = result.accessCode
        ? `\nCode d'accès Nuki : ${result.accessCode}`
        : '\n⚠️ Le code Nuki n\'a pas pu être généré.';
      
      alert('Réservation créée avec succès !' + codeMsg);
      setShowAddModal(false);
      setNewBooking({
        userId: '',
        date: '',
        slot: 'morning',
        room: 'room1',
        price: 30,
      });
      fetchBookings();
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la création de la réservation');
    }
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#D4A373] border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero section */}
      <section className="relative isolate flex min-h-[40vh] items-center justify-center overflow-hidden pt-24 text-white">
        <Image
          src="/photos/covers1.jpg"
          alt="Theranice"
          fill
          className="absolute inset-0 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-4 px-6 py-16 text-center">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Dashboard Admin
          </h1>
          <p className="text-lg text-slate-100">
            Gérez vos réservations et consultez vos statistiques
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 shadow-md">
            <p className="text-sm text-slate-600 mb-1">Revenus totaux</p>
            <p className="text-3xl font-bold text-[#D4A373]">{stats.totalRevenue}€</p>
          </div>
          <div className="bg-white p-6 shadow-md">
            <p className="text-sm text-slate-600 mb-1">Revenus ce mois</p>
            <p className="text-3xl font-bold text-[#56862F]">{stats.monthRevenue}€</p>
          </div>
          <div className="bg-white p-6 shadow-md">
            <p className="text-sm text-slate-600 mb-1">Réservations totales</p>
            <p className="text-3xl font-bold text-[#333333]">{stats.totalBookings}</p>
          </div>
          <div className="bg-white p-6 shadow-md">
            <p className="text-sm text-slate-600 mb-1">À venir</p>
            <p className="text-3xl font-bold text-[#B12F2E]">{stats.upcomingBookings}</p>
          </div>
        </div>

        {membersError && (
          <div className="mb-8 rounded border border-[#B12F2E] bg-red-50 px-4 py-3 text-[#7f2120]">
            <p className="text-sm font-medium">Erreur membres: {membersError}</p>
            <button
              onClick={fetchMembers}
              disabled={membersLoading}
              className={`mt-2 rounded px-3 py-1.5 text-xs font-semibold text-white ${
                membersLoading ? 'bg-[#B12F2E]/70 cursor-wait' : 'bg-[#B12F2E] hover:bg-[#8e2424] cursor-pointer'
              }`}
            >
              {membersLoading ? 'Rechargement...' : 'Réessayer'}
            </button>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white p-6 shadow-md mb-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <h2 className={`${garamond.className} text-2xl font-semibold text-[#D4A373]`}>
                ▸ Réservations
              </h2>
              <button
                onClick={fetchBookings}
                disabled={bookingsLoading}
                className={`bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2 ${
                  bookingsLoading ? "cursor-wait opacity-70" : "cursor-pointer"
                }`}
                title="Rafraîchir les réservations"
              >
                <svg className={`w-4 h-4 ${bookingsLoading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {bookingsLoading ? 'Rafraîchissement...' : 'Rafraîchir'}
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto bg-[#D4A373] hover:bg-[#c49363] text-white px-4 sm:px-6 py-2 text-sm sm:text-base font-medium transition-colors cursor-pointer"
            >
              + Ajouter une réservation
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setFilter("today")}
              className={`px-4 py-2 font-medium transition-all ${
                filter === "today"
                  ? "bg-[#D4A373] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-[#FAEDCD] cursor-pointer"
              }`}
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setFilter("upcoming")}
              className={`px-4 py-2 font-medium transition-all ${
                filter === "upcoming"
                  ? "bg-[#D4A373] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-[#FAEDCD] cursor-pointer"
              }`}
            >
              À venir
            </button>
            <button
              onClick={() => setFilter("past")}
              className={`px-4 py-2 font-medium transition-all ${
                filter === "past"
                  ? "bg-[#D4A373] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-[#FAEDCD] cursor-pointer"
              }`}
            >
              Passées
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 font-medium transition-all ${
                filter === "all"
                  ? "bg-[#D4A373] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-[#FAEDCD] cursor-pointer"
              }`}
            >
              Toutes
            </button>
          </div>

          {/* Liste des réservations */}
          {filteredBookings.length === 0 ? (
            <p className="text-center text-slate-600 py-8">Aucune réservation pour ce filtre</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Créneau</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Salle</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Client</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Prix</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Statut</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                        {formatDate(booking.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {SLOT_LABELS[booking.slot as Slot]}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {ROOM_LABELS[booking.room as Room]}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {booking.profiles?.prenom} {booking.profiles?.nom}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div>{booking.profiles?.email}</div>
                        <div className="text-xs">{booking.profiles?.telephone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#D4A373]">
                        {booking.price}€
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {booking.access_code && booking.nuki_code_status === 'active' ? (
                          <span className="font-mono font-semibold text-[#56862F]" title={`Auth ID: ${booking.nuki_auth_id || 'N/A'}`}>
                            {`${booking.access_code.slice(0, 3)} ${booking.access_code.slice(3)}`}
                          </span>
                        ) : booking.nuki_code_status === 'error' ? (
                          <span className="text-[#B12F2E]" title="Erreur lors de la création du code Nuki">⚠️ Erreur</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          booking.status === 'confirmed' 
                            ? 'bg-[#56862F] text-white'
                            : booking.status === 'pending_payment'
                            ? 'bg-yellow-100 text-yellow-800'
                            : booking.status === 'conflict' || booking.status === 'conflict_paid'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-[#B12F2E] text-white'
                        }`}>
                          {booking.status === 'confirmed' ? 'Validé' : 
                           booking.status === 'pending_payment' ? 'En attente' :
                           booking.status === 'conflict' || booking.status === 'conflict_paid' ? 'Conflit' :
                           'Annulée'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="text-[#d06264] hover:text-red-700 text-sm font-medium cursor-pointer"
                            title="Supprimer"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section Validation de comptes */}
        <div className="bg-white p-6 shadow-md mb-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <h2 className={`text-xl sm:text-2xl font-bold text-[#D4A373] leading-tight sm:leading-normal sm:whitespace-nowrap ${garamond.className}`}>
                ▸ Comptes en attente de validation
              </h2>
              <button
                onClick={fetchPendingValidations}
                disabled={membersLoading}
                className={`w-full sm:w-auto bg-slate-200 text-slate-700 px-3 py-2 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  membersLoading ? 'cursor-wait opacity-70' : 'hover:bg-slate-300 cursor-pointer'
                }`}
                title="Rafraîchir les comptes en attente"
              >
                <svg className={`w-4 h-4 ${membersLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {membersLoading ? 'Rafraîchissement...' : 'Rafraîchir'}
              </button>
            </div>
            {pendingValidations.length > 0 && (
              <span className="inline-flex w-fit bg-[#A97244] text-white px-3 py-1 text-sm font-semibold">
                {pendingValidations.length} en attente
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : pendingValidations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Aucun compte en attente de validation
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAEDCD]">
                  <tr>
                    <th className="px-2 py-3 text-left font-semibold text-slate-700">Statut</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Prénom</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Nom</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Activité</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingValidations.map((validation) => (
                    <tr key={validation.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-1 py-3">
                        {validation.account_status === 'pending' ? (
                          <span className="bg-[#A97244] text-white px-2 py-1 text-sm font-semibold">Documents manquants</span>
                        ) : (
                          <span className="bg-[#D4A373] text-white px-2 py-1 text-xs font-medium">En cours de validation</span>
                        )}



                      </td>
                      <td className="px-4 py-3">{validation.prenom}</td>
                      <td className="px-4 py-3">{validation.nom}</td>
                      <td className="px-4 py-3">{validation.activite_exercee || '-'}</td>
                      <td className="px-4 py-3">
                        <p className="mb-2 text-xs font-medium text-slate-500">
                          {
                            [
                              validation.carte_identite_status,
                              validation.kbis_status,
                              validation.rc_pro_status,
                            ].filter((status) => status === 'approved' || status === 'rejected').length
                          }/3 documents revus
                        </p>
                        <div className="flex flex-col gap-2">
                          {/* Carte d'identité */}
                          {validation.carte_identite_url ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`/api/admin/view-document?userId=${validation.id}&fileType=carte`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#D4A373] hover:text-[#c49363] text-sm underline"
                              >
                                Carte ID
                              </a>
                              {validation.carte_identite_status === 'pending' && (
                                <>
                                  <span className="bg-[#A97244] text-white px-2 py-1 text-xs font-semibold">En attente</span>
                                  <button
                                    onClick={() => handleValidateDocument(validation.id, 'carte', 'approve')}
                                    className="bg-[#56862F] hover:bg-[#456d25] text-white px-2 py-0.5 text-xs cursor-pointer"
                                    title="Valider"
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() => handleValidateDocument(validation.id, 'carte', 'reject')}
                                    className="bg-[#B12F2E] hover:bg-[#8e2424] text-white px-2 py-0.5 text-xs cursor-pointer"
                                    title="Rejeter"
                                  >
                                    X
                                  </button>
                                </>
                              )}
                              {validation.carte_identite_status === 'approved' && (
                                <span className="bg-[#56862F] text-white px-2 py-0.5 text-xs">Validé</span>
                              )}
                              {validation.carte_identite_status === 'rejected' && (
                                <span className="bg-[#B12F2E] text-white px-2 py-0.5 text-xs">X Refusé</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">Pas de carte ID</span>
                          )}

                          {/* KBIS */}
                          {validation.kbis_url ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`/api/admin/view-document?userId=${validation.id}&fileType=kbis`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#D4A373] hover:text-[#c49363] text-sm underline"
                              >
                                KBIS
                              </a>
                              {validation.kbis_status === 'pending' && (
                                <>
                                  <span className="bg-[#A97244] text-white px-2 py-1 text-xs font-semibold">En attente</span>
                                  <button
                                    onClick={() => handleValidateDocument(validation.id, 'kbis', 'approve')}
                                    className="bg-[#56862F] hover:bg-[#456d25] text-white px-2 py-0.5 text-xs cursor-pointer"
                                    title="Valider"
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() => handleValidateDocument(validation.id, 'kbis', 'reject')}
                                    className="bg-[#B12F2E] hover:bg-[#8e2424] text-white px-2 py-0.5 text-xs cursor-pointer"
                                    title="Rejeter"
                                  >
                                    X
                                  </button>
                                </>
                              )}
                              {validation.kbis_status === 'approved' && (
                                <span className="bg-[#56862F] text-white px-2 py-0.5 text-xs">Validé</span>
                              )}
                              {validation.kbis_status === 'rejected' && (
                                <span className="bg-[#B12F2E] text-white px-2 py-0.5 text-xs">X Refusé</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">Pas de KBIS</span>
                          )}

                          {/* RC Pro */}
                          {validation.rc_pro_url ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`/api/admin/view-document?userId=${validation.id}&fileType=rc_pro`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#D4A373] hover:text-[#c49363] text-sm underline"
                              >
                                RC Pro
                              </a>
                              {validation.rc_pro_status === 'pending' && (
                                <>
                                  <span className="bg-[#A97244] text-white px-2 py-1 text-xs font-semibold">En attente</span>
                                  <button
                                    onClick={() => handleValidateDocument(validation.id, 'rc_pro', 'approve')}
                                    className="bg-[#56862F] hover:bg-[#456d25] text-white px-2 py-0.5 text-xs cursor-pointer"
                                    title="Valider"
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() => handleValidateDocument(validation.id, 'rc_pro', 'reject')}
                                    className="bg-[#B12F2E] hover:bg-[#8e2424] text-white px-2 py-0.5 text-xs cursor-pointer"
                                    title="Rejeter"
                                  >
                                    X
                                  </button>
                                </>
                              )}
                              {validation.rc_pro_status === 'approved' && (
                                <span className="bg-[#56862F] text-white px-2 py-0.5 text-xs">Validé</span>
                              )}
                              {validation.rc_pro_status === 'rejected' && (
                                <span className="bg-[#B12F2E] text-white px-2 py-0.5 text-xs">X Refusé</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">Pas de RC Pro</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section Membres */}
        <div className="bg-white p-6 shadow-md mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className={`text-2xl font-bold text-[#D4A373] ${garamond.className}`}>
                ▸ Membres inscrits
              </h2>
              <button
                onClick={fetchMembers}
                disabled={membersLoading}
                className={`bg-slate-200 text-slate-700 px-3 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2 ${
                  membersLoading ? 'cursor-wait opacity-70' : 'hover:bg-slate-300 cursor-pointer'
                }`}
                title="Rafraîchir les membres"
              >
                <svg className={`w-4 h-4 ${membersLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {membersLoading ? 'Rafraîchissement...' : 'Rafraîchir'}
              </button>
            </div>
          </div>

          {/* Liste des membres */}
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Aucun membre inscrit
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAEDCD]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Prénom</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Nom</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Téléphone</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Statut</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Date d&apos;inscription</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-4 py-3">{member.prenom}</td>
                      <td className="px-4 py-3">{member.nom}</td>
                      <td className="px-4 py-3">{member.email || '-'}</td>
                      <td className="px-4 py-3">{member.telephone || '-'}</td>
                      <td className="px-4 py-3">
                        {member.account_status === 'approved' && (
                          <span className="bg-[#56862F] text-white px-2 py-1 text-xs font-medium">Validé</span>
                        )}
                        {member.account_status === 'pending' && (
                          <span className="bg-[#A97244] text-white px-2 py-1 text-xs font-medium">En attente</span>
                        )}
                        {member.account_status === 'documents_submitted' && (
                          <span className="bg-[#D4A373] text-white px-2 py-1 text-xs font-medium">À valider</span>
                        )}
                        {member.account_status === 'rejected' && (
                          <span className="bg-[#B12F2E] text-white px-2 py-1 text-xs font-medium">Rejeté</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(member.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-[#D4A373] hover:text-[#c49363] text-sm font-medium cursor-pointer"
                            title="Modifier"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-[#B12F2E] hover:text-[#8e2424] text-sm font-medium cursor-pointer"
                            title="Supprimer"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'ajout de réservation */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`${garamond.className} text-2xl font-semibold text-[#D4A373]`}>
                Ajouter une réservation
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Sélection du client */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Client *
                </label>
                <select
                  value={newBooking.userId}
                  onChange={(e) => setNewBooking({ ...newBooking, userId: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                >
                  <option value="">-- Sélectionnez un client --</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} {user.telephone ? `(${user.telephone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Créneau */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Créneau *
                </label>
                <select
                  value={newBooking.slot}
                  onChange={(e) => {
                    const slot = e.target.value as Slot;
                    const room = newBooking.room as Room;
                    setNewBooking({ ...newBooking, slot, price: getPrice(slot, room) });
                  }}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                >
                  <option value="morning">Matin (7h30-13h)</option>
                  <option value="afternoon">Après-midi (13h30-20h30)</option>
                  <option value="fullday">Journée complète (7h30-20h30)</option>
                </select>
              </div>

              {/* Salle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Salle *
                </label>
                <select
                  value={newBooking.room}
                  onChange={(e) => {
                    const room = e.target.value as Room;
                    const slot = newBooking.slot as Slot;
                    setNewBooking({ ...newBooking, room, price: getPrice(slot, room) });
                  }}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                >
                  <option value="room1">Athéna</option>
                  <option value="room2">Gaïa</option>
                  <option value="large">Grande salle</option>
                </select>
              </div>

              {/* Prix */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Prix (€) *
                </label>
                <input
                  type="number"
                  value={newBooking.price}
                  onChange={(e) => setNewBooking({ ...newBooking, price: parseFloat(e.target.value) })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                  min="0"
                  step="1"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddBooking}
                  className="flex-1 bg-[#D4A373] hover:bg-[#c49363] text-white px-6 py-2 font-medium transition-colors cursor-pointer"
                >
                  Créer la réservation
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-[#FAEDCD] text-slate-700 px-6 py-2 font-medium transition-colors cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition de membre */}
      {showEditMemberModal && editingMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
          <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center">
            <div className="flex w-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Fiche membre
                  </p>
                  <h3 className={`text-2xl font-bold text-[#D4A373] ${garamond.className}`}>
                    Modifier {editingMember.prenom} {editingMember.nom}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {editingMember.account_status === 'approved' && (
                      <span className="bg-[#56862F] text-white px-2 py-1 font-medium">Compte validé</span>
                    )}
                    {editingMember.account_status === 'pending' && (
                      <span className="bg-[#A97244] text-white px-2 py-1 font-medium">Documents manquants</span>
                    )}
                    {editingMember.account_status === 'documents_submitted' && (
                      <span className="bg-[#D4A373] text-white px-2 py-1 font-medium">Documents en validation</span>
                    )}
                    {editingMember.account_status === 'rejected' && (
                      <span className="bg-[#B12F2E] text-white px-2 py-1 font-medium">Compte rejeté</span>
                    )}
                    <span className="bg-white px-2 py-1 text-slate-600 border border-slate-200">
                      Inscrit le {new Date(editingMember.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeEditMemberModal}
                  className="h-9 w-9 rounded-full bg-white text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                  title="Fermer"
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-8">
                  {memberModalFeedback && (
                    <div
                      className={`rounded-lg border px-4 py-3 text-sm ${
                        memberModalFeedback.type === 'success'
                          ? 'border-[#56862F] bg-green-50 text-[#2f4d1a]'
                          : 'border-[#B12F2E] bg-red-50 text-[#7f2120]'
                      }`}
                    >
                      {memberModalFeedback.message}
                    </div>
                  )}

                  <section className="rounded-xl border border-slate-200 p-5">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">Informations du membre</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Prénom *</label>
                        <input
                          type="text"
                          value={editingMember.prenom}
                          onChange={(e) => setEditingMember({ ...editingMember, prenom: e.target.value })}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Nom *</label>
                        <input
                          type="text"
                          value={editingMember.nom}
                          onChange={(e) => setEditingMember({ ...editingMember, nom: e.target.value })}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                        <input
                          type="email"
                          value={editingMember.email || ''}
                          readOnly
                          className="w-full rounded border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Téléphone</label>
                        <input
                          type="tel"
                          value={editingMember.telephone || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, telephone: e.target.value })}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                          placeholder="06 12 34 56 78"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Activité exercée</label>
                        <input
                          type="text"
                          value={editingMember.activite_exercee || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, activite_exercee: e.target.value })}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                          placeholder="Psychologue, ostéopathe, sophrologue..."
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">SIRET</label>
                        <input
                          type="text"
                          value={editingMember.siret || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, siret: e.target.value })}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                          placeholder="14 chiffres"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Adresse professionnelle</label>
                        <textarea
                          value={editingMember.adresse || ''}
                          onChange={(e) => setEditingMember({ ...editingMember, adresse: e.target.value })}
                          rows={3}
                          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                          placeholder="Adresse complète"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-slate-200 p-5">
                    <h4 className="text-lg font-semibold text-slate-800 mb-4">Documents du compte</h4>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      {MEMBER_DOCUMENTS.map((document) => {
                        const documentUrl = getMemberDocumentUrl(editingMember, document.type);
                        const documentStatus = getDocumentStatusDisplay(
                          getMemberDocumentStatus(editingMember, document.type)
                        );
                        const documentNotes = getMemberDocumentNotes(editingMember, document.type);
                        const isLoading = memberDocumentLoading[document.type];
                        const selectedFile = memberDocumentFiles[document.type];

                        return (
                          <div key={document.type} className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">{document.label}</p>
                              <span className={`px-2 py-1 text-xs font-semibold ${documentStatus.className}`}>
                                {documentStatus.label}
                              </span>
                            </div>

                            {documentNotes && (
                              <p className="mb-3 text-xs text-[#B12F2E]">
                                Motif du refus: {documentNotes}
                              </p>
                            )}

                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleOpenMemberDocument(document.type)}
                                  disabled={!documentUrl || isLoading}
                                  className="rounded bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                >
                                  Voir
                                </button>

                                <label className="rounded bg-[#FAEDCD] px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-[#f2dfb2] cursor-pointer">
                                  Choisir un fichier
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept={document.accept}
                                    onChange={(e) => handleSelectMemberDocument(document.type, e.target.files?.[0] || null)}
                                  />
                                </label>
                              </div>

                              <p className="text-xs text-slate-500 truncate" title={selectedFile?.name || ''}>
                                {selectedFile ? selectedFile.name : 'Aucun nouveau fichier sélectionné'}
                              </p>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleUploadMemberDocument(document.type)}
                                  disabled={!selectedFile || isLoading}
                                  className="rounded bg-[#D4A373] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#c49363] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                >
                                  {isLoading ? 'En cours...' : documentUrl ? 'Remplacer' : 'Uploader'}
                                </button>
                                <button
                                  onClick={() => handleDeleteMemberDocument(document.type)}
                                  disabled={!documentUrl || isLoading}
                                  className="rounded bg-[#B12F2E] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#8e2424] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {editingMember.validation_notes && (
                    <section className="rounded-xl border border-[#f1d4d3] bg-red-50 p-4">
                      <h4 className="text-sm font-semibold text-[#7f2120] mb-1">Notes de validation</h4>
                      <p className="text-sm text-[#7f2120]">{editingMember.validation_notes}</p>
                    </section>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                <button
                  onClick={closeEditMemberModal}
                  className="rounded bg-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={handleSaveMember}
                  disabled={memberSaveLoading}
                  className="rounded bg-[#D4A373] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c49363] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {memberSaveLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
