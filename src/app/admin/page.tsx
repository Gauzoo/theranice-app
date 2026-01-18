"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { EB_Garamond } from "next/font/google";
import Image from "next/image";

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
}

interface PendingValidation extends Member {
  account_status: 'pending' | 'documents_submitted' | 'approved' | 'rejected';
  activite_exercee?: string;
  carte_identite_url?: string;
  kbis_url?: string;
  carte_identite_status?: string | null;
  kbis_status?: string | null;
  carte_identite_rejection_notes?: string;
  kbis_rejection_notes?: string;
  documents_submitted_at?: string;
  validation_notes?: string;
}

const ROOM_LABELS: Record<string, string> = {
  room1: "Salle 1",
  room2: "Salle 2",
  large: "Grande salle",
};

const SLOT_LABELS: Record<string, string> = {
  morning: "Matin (8h-12h)",
  afternoon: "Après-midi (13h-17h)",
  fullday: "Journée complète (8h-17h)",
};

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "past">("upcoming");
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<Array<{id: string, nom: string, prenom: string, telephone?: string}>>([]);
  
  // Section Membres
  const [members, setMembers] = useState<Member[]>([]);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  
  // Section Validation de comptes
  const [pendingValidations, setPendingValidations] = useState<PendingValidation[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedValidation, setSelectedValidation] = useState<PendingValidation | null>(null);
  const [validationNotes, setValidationNotes] = useState('');
  
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
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/connexion');
      return;
    }

    // Vérifier si l'utilisateur est admin (email spécifique)
    // TODO: Remplacer par l'email de ta cliente
    const adminEmails = ['gauthier.guerin@gmail.com'];
    
    if (!adminEmails.includes(user.email || '')) {
      alert('Accès non autorisé');
      router.push('/');
      return;
    }

    fetchBookings();
    fetchUsers();
    fetchMembers();
    fetchPendingValidations();
  };

  const fetchPendingValidations = async () => {
    try {
      const response = await fetch('/api/admin/members');
      const result = await response.json();
      
      if (result.members) {
        // Filtrer les comptes qui ont des documents à valider
        const pending = result.members.filter((m: PendingValidation) => {
          // Exclure les comptes rejetés ou complètement approuvés
          if (m.account_status === 'rejected' || m.account_status === 'approved') {
            return false;
          }
          
          // Vérifier si au moins un document est en attente de validation
          const hasDocumentsToValidate = 
            m.carte_identite_status === 'pending' || 
            m.kbis_status === 'pending' ||
            m.account_status === 'documents_submitted' || 
            m.account_status === 'pending';
          return hasDocumentsToValidate;
        });
        setPendingValidations(pending);
      }
    } catch (error) {
      console.error('Error fetching pending validations:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/admin/members');
      const result = await response.json();
      
      if (result.members) {
        setMembers(result.members);
      } else {
        console.error('Error fetching members:', result.error);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchBookings = async () => {
    const supabase = createClient();
    setLoading(true);

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
      setLoading(false);
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
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .select();

      if (error) {
        alert('Erreur lors de la suppression : ' + error.message);
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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/members');
      const result = await response.json();
      
      if (result.members) {
        setUsers(result.members);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setShowEditMemberModal(true);
  };

  const handleSaveMember = async () => {
    if (!editingMember) return;

    const supabase = createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({
        nom: editingMember.nom,
        prenom: editingMember.prenom,
        telephone: editingMember.telephone,
      })
      .eq('id', editingMember.id);

    if (error) {
      alert('Erreur lors de la modification : ' + error.message);
    } else {
      alert('Membre modifié avec succès');
      setShowEditMemberModal(false);
      setEditingMember(null);
      fetchMembers();
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
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Erreur lors de la suppression du membre');
    }
  };

  const handleApproveAccount = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir approuver ce compte ?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/validate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'approve' }),
      });

      const result = await response.json();

      if (response.ok) {
        // TODO: Réactiver l'envoi d'email une fois Resend configuré
        /* const user = pendingValidations.find(v => v.id === userId);
        if (user && user.email) {
          try {
            await fetch('/api/emails/account-approved', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userEmail: user.email,
                userName: `${user.prenom} ${user.nom}`,
              }),
            });
          } catch (emailError) {
            console.error('Erreur lors de l\'envoi de l\'email:', emailError);
          }
        } */

        alert('Compte approuvé avec succès !');
        fetchPendingValidations();
        fetchMembers();
      } else {
        alert('Erreur : ' + result.error);
      }
    } catch (error) {
      alert('Erreur lors de l\'approbation du compte');
      console.error(error);
    }
  };

  const handleRejectAccount = async (userId: string, notes: string) => {
    if (!notes.trim()) {
      alert('Veuillez indiquer la raison du rejet');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir rejeter ce compte ?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/validate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reject', notes }),
      });

      const result = await response.json();

      if (response.ok) {
        // TODO: Réactiver l'envoi d'email une fois Resend configuré
        /* const user = pendingValidations.find(v => v.id === userId);
        if (user && user.email) {
          try {
            await fetch('/api/emails/account-rejected', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userEmail: user.email,
                userName: `${user.prenom} ${user.nom}`,
                rejectionNotes: notes,
              }),
            });
          } catch (emailError) {
            console.error('Erreur lors de l\'envoi de l\'email:', emailError);
          }
        } */

        alert('Compte rejeté');
        setShowValidationModal(false);
        setValidationNotes('');
        fetchPendingValidations();
        fetchMembers();
      } else {
        alert('Erreur : ' + result.error);
      }
    } catch (error) {
      alert('Erreur lors du rejet du compte');
      console.error(error);
    }
  };

  const openValidationModal = (validation: PendingValidation) => {
    setSelectedValidation(validation);
    setShowValidationModal(true);
  };

  const handleValidateDocument = async (userId: string, documentType: 'carte' | 'kbis', action: 'approve' | 'reject') => {
    const docName = documentType === 'carte' ? 'Carte d\'identité' : 'KBIS';
    
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
          alert(`${docName} rejeté avec succès`);
          fetchPendingValidations();
          fetchMembers();
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
          alert(`${docName} validé avec succès`);
          fetchPendingValidations();
          fetchMembers();
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
      const supabase = createClient();
      
      // Vérifie la disponibilité
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('slot, room')
        .eq('date', newBooking.date)
        .eq('status', 'confirmed');

      // Logique de vérification de disponibilité (même que dans le webhook)
      let isAvailable = true;
      if (newBooking.slot === 'fullday') {
        if (newBooking.room === 'large') {
          isAvailable = !existingBookings || existingBookings.length === 0;
        } else {
          const roomBooked = existingBookings?.some(b => b.room === newBooking.room);
          const largeBooked = existingBookings?.some(b => b.room === 'large');
          isAvailable = !roomBooked && !largeBooked;
        }
      } else {
        const fulldayBooked = existingBookings?.some(b => b.slot === 'fullday' && b.room === newBooking.room);
        const largeFulldayBooked = existingBookings?.some(b => b.slot === 'fullday' && b.room === 'large');
        
        if (fulldayBooked || largeFulldayBooked) {
          isAvailable = false;
        } else {
          const bookingsForSlot = existingBookings?.filter(b => b.slot === newBooking.slot);
          if (newBooking.room === 'large') {
            isAvailable = !bookingsForSlot || bookingsForSlot.length === 0;
          } else {
            const roomBooked = bookingsForSlot?.some(b => b.room === newBooking.room);
            const largeBooked = bookingsForSlot?.some(b => b.room === 'large');
            isAvailable = !roomBooked && !largeBooked;
          }
        }
      }

      if (!isAvailable) {
        alert('Ce créneau n\'est pas disponible');
        return;
      }

      // Crée la réservation
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: newBooking.userId,
          date: newBooking.date,
          slot: newBooking.slot,
          room: newBooking.room,
          price: newBooking.price,
          status: 'confirmed',
        });

      if (error) {
        alert('Erreur lors de la création : ' + error.message);
      } else {
        alert('Réservation créée avec succès');
        setShowAddModal(false);
        setNewBooking({
          userId: '',
          date: '',
          slot: 'morning',
          room: 'room1',
          price: 50,
        });
        fetchBookings();
      }
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

        {/* Filtres */}
        <div className="bg-white p-6 shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className={`${garamond.className} text-2xl font-semibold text-[#D4A373]`}>
                ▸ Réservations
              </h2>
              <button
                onClick={fetchBookings}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
                title="Rafraîchir les réservations"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rafraîchir
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#D4A373] hover:bg-[#c49363] text-white px-6 py-2 font-medium transition-colors cursor-pointer"
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
                        {SLOT_LABELS[booking.slot]}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {ROOM_LABELS[booking.room]}
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className={`text-2xl font-bold text-[#D4A373] ${garamond.className}`}>
                ▸ Comptes en attente de validation
              </h2>
              <button
                onClick={fetchPendingValidations}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
                title="Rafraîchir les comptes en attente"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rafraîchir
              </button>
            </div>
            {pendingValidations.length > 0 && (
              <span className="bg-orange-100 text-orange-800 px-3 py-1 text-sm font-semibold">
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
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingValidations.map((validation) => (
                    <tr key={validation.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-1 py-3">
                        {validation.account_status === 'pending' ? (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 text-sm font-semibold">Documents manquants</span>
                        ) : (
                          <span className="bg-[#D4A373] text-white px-2 py-1 text-xs font-medium">En cours de validation</span>
                        )}



                      </td>
                      <td className="px-4 py-3">{validation.prenom}</td>
                      <td className="px-4 py-3">{validation.nom}</td>
                      <td className="px-4 py-3">{validation.activite_exercee || '-'}</td>
                      <td className="px-4 py-3">
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
                                  <span className="bg-orange-100 text-orange-800 px-2 py-1 text-xs font-semibold">En attente</span>
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
                                  <span className="bg-orange-100 text-orange-800 px-2 py-1 text-xs font-semibold">En attente</span>
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
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openValidationModal(validation)}
                          className="bg-[#B12F2E] hover:bg-[#8e2424] text-white px-3 py-1 text-sm font-medium cursor-pointer"
                          title="Rejeter le compte"
                        >
                          Rejeter
                        </button>
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
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
                title="Rafraîchir les membres"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rafraîchir
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
                          <span className="bg-yellow-500 text-white px-2 py-1 text-xs font-medium">En attente</span>
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
                  onChange={(e) => setNewBooking({ ...newBooking, slot: e.target.value as 'morning' | 'afternoon' | 'fullday' })}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                >
                  <option value="morning">Matin (8h-12h)</option>
                  <option value="afternoon">Après-midi (13h-17h)</option>
                  <option value="fullday">Journée complète (8h-17h)</option>
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
                    const room = e.target.value as 'room1' | 'room2' | 'large';
                    const slot = newBooking.slot;
                    let price = 50;
                    
                    if (slot === 'fullday') {
                      price = room === 'large' ? 140 : 90;
                    } else {
                      price = room === 'large' ? 80 : 50;
                    }
                    
                    setNewBooking({ ...newBooking, room, price });
                  }}
                  className="w-full border border-slate-300 rounded px-3 py-2"
                >
                  <option value="room1">Salle 1 (35m²)</option>
                  <option value="room2">Salle 2 (35m²)</option>
                  <option value="large">Grande salle (70m²)</option>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className={`text-2xl font-bold text-[#D4A373] mb-6 ${garamond.className}`}>
                Modifier le membre
              </h3>

              <div className="space-y-4">
                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={editingMember.prenom}
                    onChange={(e) => setEditingMember({ ...editingMember, prenom: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={editingMember.nom}
                    onChange={(e) => setEditingMember({ ...editingMember, nom: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={editingMember.telephone || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, telephone: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSaveMember}
                  className="flex-1 bg-[#D4A373] hover:bg-[#c49363] text-white px-6 py-2 font-medium transition-colors cursor-pointer"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => {
                    setShowEditMemberModal(false);
                    setEditingMember(null);
                  }}
                  className="flex-1 bg-slate-200 hover:bg-[#FAEDCD] text-slate-700 px-6 py-2 font-medium transition-colors cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rejet de compte */}
      {showValidationModal && selectedValidation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className={`text-2xl font-bold text-[#D4A373] mb-4 ${garamond.className}`}>
                Rejeter le compte de {selectedValidation.prenom} {selectedValidation.nom}
              </h3>

              {/* Informations du compte */}
              <div className="bg-slate-50 p-4 rounded mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold">Email:</span> {selectedValidation.email}
                  </div>
                  <div>
                    <span className="font-semibold">Téléphone:</span> {selectedValidation.telephone}
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold">Activité:</span> {selectedValidation.activite_exercee || 'Non renseignée'}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Documents soumis :</h4>
                <div className="flex gap-4">
                  {selectedValidation.carte_identite_url ? (
                    <a
                      href={`/api/admin/view-document?userId=${selectedValidation.id}&fileType=carte`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D4A373] hover:text-[#c49363] underline text-sm"
                    >
                      📄 Voir la carte d&apos;identité
                    </a>
                  ) : (
                    <span className="text-slate-400 text-sm">Pas de carte d&apos;identité</span>
                  )}
                  {selectedValidation.kbis_url ? (
                    <a
                      href={`/api/admin/view-document?userId=${selectedValidation.id}&fileType=kbis`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D4A373] hover:text-[#c49363] underline text-sm"
                    >
                      📄 Voir le KBIS
                    </a>
                  ) : (
                    <span className="text-slate-400 text-sm">Pas de KBIS</span>
                  )}
                </div>
              </div>

              {/* Raison du rejet */}
              <div className="mb-4">
                <label className="block font-semibold mb-2">
                  Raison du rejet <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="Ex: Documents illisibles, KBIS expiré, activité non conforme..."
                  rows={4}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleRejectAccount(selectedValidation.id, validationNotes)}
                  className="flex-1 bg-[#B12F2E] hover:bg-[#8e2424] text-white px-6 py-2 font-medium transition-colors cursor-pointer rounded"
                >
                  Confirmer le rejet
                </button>
                <button
                  onClick={() => {
                    setShowValidationModal(false);
                    setSelectedValidation(null);
                    setValidationNotes('');
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 font-medium transition-colors cursor-pointer rounded"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
