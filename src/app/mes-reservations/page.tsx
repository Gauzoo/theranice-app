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

type BookingStatus = "confirmed" | "cancelled" | "pending_payment" | "conflict" | "conflict_paid";
type Room = "room1" | "room2" | "large";
type Slot = "morning" | "afternoon" | "fullday";

interface Booking {
  id: string;
  date: string;
  slot: Slot;
  room: Room;
  price: number;
  status: BookingStatus;
  created_at: string;
  access_code: string | null;
  nuki_code_status: string | null;
}

const ROOM_LABELS = {
  room1: "Salle 1 (35m²)",
  room2: "Salle 2 (35m²)",
  large: "Grande salle (70m²)",
};

const SLOT_LABELS = {
  morning: "Matin (8h-12h)",
  afternoon: "Après-midi (13h-17h)",
  fullday: "Journée complète (8h-17h)",
};

const SLOT_ACCESS_TIMES = {
  morning: "7h30 – 12h30",
  afternoon: "12h30 – 17h30",
  fullday: "7h30 – 17h30",
};

export default function MesReservationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "cancelled">("upcoming");
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push("/connexion");
      return;
    }
    
    fetchBookings(user.id);
  }, [user, authLoading, router]);

  const fetchBookings = async (userId: string) => {
    const supabase = createClient();
    setLoading(true);
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching bookings:', error);
    } else if (data) {
      setBookings(data);
    }
    
    setLoading(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
      return;
    }

    setCancellingId(bookingId);
    
    try {
      // Appelle l'API serveur qui gère l'annulation + révocation du code Nuki
      const response = await fetch('/api/cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || "Erreur lors de l'annulation");
      } else {
        // Récupère les infos pour l'email d'annulation
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('nom, prenom')
          .eq('id', user?.id)
          .single();

        // Envoie l'email d'annulation
        try {
          await fetch('/api/send-cancellation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user?.email,
              nom: profile?.nom || '',
              prenom: profile?.prenom || '',
              date: result.booking?.date,
              slot: result.booking?.slot,
              room: result.booking?.room,
            })
          });
        } catch (emailError) {
          console.error('Erreur envoi email:', emailError);
        }

        // Rafraîchir la liste
        if (user) {
          fetchBookings(user.id);
        }
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert("Erreur lors de l'annulation de la réservation");
    }
    
    setCancellingId(null);
  };

  const canCancelBooking = (booking: Booking): boolean => {
    if (booking.status === 'cancelled') return false;
    
    const bookingDate = new Date(booking.date + 'T00:00:00');
    const now = new Date();
    const daysDiff = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    
    // Ne peut pas annuler si la réservation est dans moins de 7 jours
    return daysDiff > 7;
  };

  const getFilteredBookings = (): Booking[] => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (filter) {
      case "upcoming":
        return bookings.filter(b => {
          const bookingDate = new Date(b.date + 'T00:00:00');
          // Inclut confirmé et en attente de paiement
          return (b.status === 'confirmed' || b.status === 'pending_payment') && bookingDate >= now;
        });
      case "past":
        return bookings.filter(b => {
          const bookingDate = new Date(b.date + 'T00:00:00');
          // Les réservations passées ou annulées ou en conflit sont ignorées ici ? 
          // Généralement on veut voir l'historique des confirmées passées
          return b.status === 'confirmed' && bookingDate < now;
        });
      case "cancelled":
        return bookings.filter(b => b.status === 'cancelled' || b.status === 'conflict' || b.status === 'conflict_paid');
      default:
        // Trie par ordre décroissant de date pour 'all'
        return bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  };

  const formatDate = (dateString: string): string => {
    // Ajoute 'T00:00:00' pour forcer l'interprétation en heure locale
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredBookings = getFilteredBookings();

  if (!user) {
    return null;
  }

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
            Mes réservations
          </h1>
          <p className="text-lg text-slate-100">
            Gérez vos réservations et consultez votre historique
          </p>
        </div>
      </section>

      {/* Section liste des réservations */}
      <section className="bg-[#FFFFFF] py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className={`${garamond.className} text-4xl font-semibold mb-8 text-[#D4A373]`}>
            ▸ Vos réservations
          </h2>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 font-medium transition-all cursor-pointer ${
              filter === "upcoming"
                ? "bg-[#D4A373] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-[#FAEDCD]"
            }`}
          >
            À venir
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-4 py-2 font-medium transition-all cursor-pointer ${
              filter === "past"
                ? "bg-[#D4A373] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-[#FAEDCD]"
            }`}
          >
            Passées
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 font-medium transition-all cursor-pointer ${
              filter === "cancelled"
                ? "bg-[#D4A373] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-[#FAEDCD]"
            }`}
          >
            Annulées
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-medium transition-all cursor-pointer ${
              filter === "all"
                ? "bg-[#D4A373] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-[#FAEDCD]"
            }`}
          >
            Toutes
          </button>
        </div>

        {/* Liste des réservations */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#D4A373] border-t-transparent"></div>
            <p className="mt-4 text-slate-600">Chargement...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Aucune réservation
            </h3>
            <p className="text-slate-600 mb-6">
              {filter === "upcoming" && "Vous n'avez pas de réservation à venir."}
              {filter === "past" && "Vous n'avez pas de réservation passée."}
              {filter === "cancelled" && "Vous n'avez pas de réservation annulée."}
              {filter === "all" && "Vous n'avez pas encore effectué de réservation."}
            </p>
            <button
              onClick={() => router.push("/reservation")}
              className="bg-[#D4A373] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#c39363] transition-colors cursor-pointer"
            >
              Faire une réservation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const isPast = new Date(booking.date + 'T00:00:00') < new Date();
              const isCancelled = booking.status === 'cancelled' || booking.status === 'conflict' || booking.status === 'conflict_paid';
              const isPending = booking.status === 'pending_payment';
              const canCancel = canCancelBooking(booking) && !isPending;

              return (
                <div
                  key={booking.id}
                  className={`bg-white shadow-md p-6 transition-all hover:shadow-lg ${
                    isCancelled ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Informations de la réservation */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-[#333333]">
                          {ROOM_LABELS[booking.room]}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            isCancelled
                              ? 'bg-[#B12F2E] text-white'
                              : isPending
                              ? 'bg-yellow-100 text-yellow-800'
                              : isPast
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-[#56862F] text-white'
                          }`}
                        >
                          {isCancelled ? 'Annulée' : isPending ? 'Paiement en attente' : isPast ? 'Terminée' : 'Confirmée'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span>📅</span>
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span>🕐</span>
                          <span>{SLOT_LABELS[booking.slot]}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span>💰</span>
                          <span>{booking.price}€</span>
                        </div>
                      </div>

                      {/* Code d'accès Nuki */}
                      {booking.status === 'confirmed' && !isPast && booking.access_code && booking.nuki_code_status === 'active' && (
                        <div className="mt-4 bg-[#FEFAE0] border border-[#D4A373] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🔐</span>
                            <span className="font-semibold text-[#333333]">Code d&apos;accès</span>
                          </div>
                          <div className="text-2xl font-bold tracking-[0.2em] text-[#D4A373] text-center py-2">
                            {`${booking.access_code.slice(0, 3)} ${booking.access_code.slice(3)}`}
                          </div>
                          <p className="text-sm text-[#333333] text-center mt-2 font-medium">
                            ⏰ Valide le {formatDate(booking.date)} de {SLOT_ACCESS_TIMES[booking.slot]}
                          </p>
                          <p className="text-xs text-slate-500 text-center mt-1">
                            Tapez ce code sur le clavier à l&apos;entrée du local
                          </p>
                        </div>
                      )}
                      {booking.status === 'confirmed' && !isPast && booking.nuki_code_status === 'error' && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-700">
                            ⚠️ Le code d&apos;accès n&apos;a pas pu être généré. Veuillez nous contacter.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {canCancel && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="px-6 py-2.5 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          style={{ 
                            backgroundColor: cancellingId === booking.id ? 'oklch(0.53 0.14 20.66)' : 'oklch(0.63 0.14 20.66)',
                          }}
                          onMouseEnter={(e) => {
                            if (cancellingId !== booking.id) {
                              e.currentTarget.style.backgroundColor = 'oklch(0.53 0.14 20.66)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (cancellingId !== booking.id) {
                              e.currentTarget.style.backgroundColor = 'oklch(0.63 0.14 20.66)';
                            }
                          }}
                        >
                          {cancellingId === booking.id ? 'Annulation...' : 'Annuler'}
                        </button>
                      )}
                      {!canCancel && !isCancelled && isPast && (
                        <div className="text-sm text-slate-500 text-center">
                          Réservation terminée
                        </div>
                      )}
                      {!canCancel && !isCancelled && !isPast && (
                        <div className="text-sm text-slate-500 text-center max-w-[200px]">
                          Annulation possible jusqu&apos;à 7 jours avant
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bouton nouvelle réservation */}
        {filteredBookings.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push("/reservation")}
              className="bg-[#D4A373] text-white px-8 py-3  font-medium hover:bg-[#c39363] transition-colors cursor-pointer"
            >
              Nouvelle réservation
            </button>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
