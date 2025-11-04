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
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "past">("upcoming");
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  // Statistiques
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    monthRevenue: 0,
  });

  useEffect(() => {
    checkAuth();
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

    setUser(user);
    fetchBookings();
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

      console.log('Bookings récupérées:', bookingsWithProfiles.length);
      setBookings(bookingsWithProfiles as Booking[]);
      calculateStats(bookingsWithProfiles as Booking[]);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      alert('Erreur : ' + error.message);
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
          return bookingDate.getTime() === today.getTime() && b.status === 'confirmed';
        });
      case "upcoming":
        return bookings.filter(b => {
          const bookingDate = new Date(b.date + 'T00:00:00');
          return bookingDate >= now && b.status === 'confirmed';
        });
      case "past":
        return bookings.filter(b => {
          const bookingDate = new Date(b.date + 'T00:00:00');
          return bookingDate < now;
        });
      default:
        return bookings;
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
    console.log('Tentative de suppression de:', bookingId);
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      console.log('Suppression annulée par l\'utilisateur');
      return;
    }

    try {
      const supabase = createClient();
      console.log('Envoi de la requête de suppression...');
      
      const { data, error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .select();

      console.log('Résultat:', { data, error });

      if (error) {
        console.error('Erreur Supabase:', error);
        alert('Erreur lors de la suppression : ' + error.message);
      } else {
        // Suppression immédiate de la liste locale pour feedback instantané
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        alert('Réservation supprimée avec succès');
        // Recharge depuis Supabase pour être sûr
        setTimeout(() => fetchBookings(), 500);
      }
    } catch (err: any) {
      console.error('Erreur catch:', err);
      alert('Erreur : ' + err.message);
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
            <p className="text-3xl font-bold text-green-600">{stats.monthRevenue}€</p>
          </div>
          <div className="bg-white p-6 shadow-md">
            <p className="text-sm text-slate-600 mb-1">Réservations totales</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalBookings}</p>
          </div>
          <div className="bg-white p-6 shadow-md">
            <p className="text-sm text-slate-600 mb-1">À venir</p>
            <p className="text-3xl font-bold text-blue-600">{stats.upcomingBookings}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-6 shadow-md mb-8">


          <h2 className={`${garamond.className} text-4xl font-semibold mb-8 text-[#D4A373]`}>
            ▸ Réservations
          </h2>


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
                        <span className={`inline-block px-2 py-1 text-xs font-medium ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {booking.status === 'confirmed' ? 'Confirmée' : 'Annulée'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer"
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
    </div>
  );
}
