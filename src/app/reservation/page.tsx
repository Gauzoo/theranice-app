"use client";

import Image from "next/image";
import { EB_Garamond } from "next/font/google";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useAuth } from "@/contexts/AuthContext";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type Room = "room1" | "room2" | "large";
type Slot = "morning" | "afternoon" | "fullday";

interface Booking {
  date: string;
  slot: Slot;
  room: Room;
}

const ROOM_PRICES = {
  room1: 50,
  room2: 50,
  large: 80,
};

const FULLDAY_PRICES = {
  room1: 90,
  room2: 90,
  large: 140,
};

const ROOM_LABELS = {
  room1: "Salle 1 (35m²)",
  room2: "Salle 2 (35m²)",
  large: "Grande salle (70m²)",
};

type AccountStatus = 'pending' | 'documents_submitted' | 'approved' | 'rejected';

export default function ReservationPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fonction pour récupérer les réservations
  const fetchBookings = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('bookings')
      .select('date, slot, room')
      .eq('status', 'confirmed');
    
    if (data) {
      setExistingBookings(data);
    }
  };

  // Charge les réservations au montage
  useEffect(() => {
    fetchBookings();
  }, []);

  // Vérifie si un créneau est disponible
  const isSlotAvailable = (date: Date, slot: Slot, room: Room): boolean => {
    // Utilise la date locale au lieu de UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Trouve toutes les réservations pour cette date
    const bookingsForDate = existingBookings.filter(b => b.date === dateStr);

    // Si on veut réserver la journée complète
    if (slot === 'fullday') {
      // La journée est disponible si :
      // - Pour la grande salle : aucune réservation n'existe (ni matin, ni après-midi, ni journée)
      // - Pour les petites salles : cette salle n'est pas réservée ET la grande salle n'est pas réservée
      if (room === 'large') {
        return bookingsForDate.length === 0;
      } else {
        const roomBookedAnytime = bookingsForDate.some(b => b.room === room);
        const largeBookedAnytime = bookingsForDate.some(b => b.room === 'large');
        return !roomBookedAnytime && !largeBookedAnytime;
      }
    }

    // Si on veut réserver matin ou après-midi
    // Vérifie d'abord s'il y a une réservation journée sur cette salle
    const fulldayBooked = bookingsForDate.some(b => b.slot === 'fullday' && b.room === room);
    if (fulldayBooked) {
      return false; // La journée est réservée, donc matin et après-midi sont bloqués
    }

    // Vérifie si la grande salle est réservée en journée complète (bloque TOUTES les salles)
    const largeFulldayBooked = bookingsForDate.some(b => b.slot === 'fullday' && b.room === 'large');
    if (largeFulldayBooked) {
      return false; // Si grande salle réservée toute la journée, rien n'est disponible
    }
    
    // Trouve toutes les réservations pour ce créneau spécifique
    const bookingsForSlot = bookingsForDate.filter(b => b.slot === slot);

    // Si on veut réserver la grande salle
    if (room === 'large') {
      // La grande salle est disponible si aucune salle n'est réservée pour ce créneau
      return bookingsForSlot.length === 0;
    }

    // Si on veut réserver une petite salle
    // Elle est disponible si :
    // 1. Elle n'est pas déjà réservée pour ce créneau
    // 2. La grande salle n'est pas réservée pour ce créneau
    const roomBooked = bookingsForSlot.some(b => b.room === room);
    const largeBooked = bookingsForSlot.some(b => b.room === 'large');
    
    return !roomBooked && !largeBooked;
  };

  // Vérifie si une salle spécifique est disponible pour les dates sélectionnées (tous créneaux)
  const isRoomAvailableForDates = (room: Room): boolean => {
    if (selectedDates.length === 0) return true;
    
    // Pour chaque date sélectionnée, au moins un créneau doit être disponible
    return selectedDates.every(date => {
      const morningAvailable = isSlotAvailable(date, 'morning', room);
      const afternoonAvailable = isSlotAvailable(date, 'afternoon', room);
      return morningAvailable || afternoonAvailable;
    });
  };

  // Vérifie si un créneau spécifique est disponible pour les dates et salle sélectionnées
  const isSlotAvailableForSelection = (slot: Slot): boolean => {
    if (selectedDates.length === 0) return true;
    
    return selectedDates.every(date => {
      // Vérifie si le créneau est dans le passé (pour aujourd'hui uniquement)
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        const currentHour = now.getHours();
        // Bloque le matin si on est après 12h
        if (slot === 'morning' && currentHour >= 12) {
          return false;
        }
        // Bloque l'après-midi si on est après 17h
        if (slot === 'afternoon' && currentHour >= 17) {
          return false;
        }
      }
      
      // Si une salle est sélectionnée, vérifie uniquement cette salle
      if (selectedRoom) {
        return isSlotAvailable(date, slot, selectedRoom);
      }
      
      // Si aucune salle n'est sélectionnée, vérifie s'il existe AU MOINS UNE salle disponible pour ce créneau
      const allRooms: Room[] = ['room1', 'room2', 'large'];
      return allRooms.some(room => isSlotAvailable(date, slot, room));
    });
  };

  const handleDateClick = (value: Date) => {
    // Vérifie si la date est déjà sélectionnée
    const dateIndex = selectedDates.findIndex(d => d.toDateString() === value.toDateString());
    
    if (dateIndex >= 0) {
      // Si déjà sélectionnée, on la retire
      const newDates = [...selectedDates];
      newDates.splice(dateIndex, 1);
      setSelectedDates(newDates);
    } else {
      // Sinon on l'ajoute
      setSelectedDates([...selectedDates, value]);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push('/connexion');
      return;
    }

    if (selectedDates.length === 0 || !selectedRoom || !selectedSlot) {
      setError("Veuillez sélectionner au moins une date, une salle et un créneau");
      return;
    }

    // Vérifie la disponibilité pour toutes les dates
    const unavailableDate = selectedDates.find(date => !isSlotAvailable(date, selectedSlot, selectedRoom));
    if (unavailableDate) {
      setError(`Le créneau n'est plus disponible pour le ${unavailableDate.toLocaleDateString()}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Prépare les dates au format string YYYY-MM-DD
      const datesStr = selectedDates.map(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      });

      // Récupère les infos utilisateur pour le paiement
      // Le profil est déjà chargé dans le contexte
      
      // Calcule le prix unitaire en fonction du créneau
      const unitPrice = selectedSlot === 'fullday' ? FULLDAY_PRICES[selectedRoom] : ROOM_PRICES[selectedRoom];
      // Prix total = prix unitaire * nombre de dates
      const totalPrice = unitPrice * selectedDates.length;

      // Crée une session de paiement Stripe
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          dates: datesStr, // Envoie le tableau de dates
          slot: selectedSlot,
          room: selectedRoom,
          price: totalPrice, // Envoie le prix total
          email: user.email,
          nom: profile?.nom || '',
          prenom: profile?.prenom || '',
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirige vers Stripe Checkout (même fenêtre)
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Une erreur est survenue lors de la création du paiement");
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* Hero section */}
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
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Réservation
          </h1>
          <p className="text-lg text-[slate-100]">
            Choisissez votre date, salle et créneau
          </p>
        </div>
      </section>

      {/* Section formulaire de réservation */}
      <section className="bg-[#FFFFFF] py-16 min-h-[60vh]">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className={`${garamond.className} text-4xl font-semibold mb-8 text-[#D4A373]`}>
            ▸ Réserver un créneau
          </h2>

          {/* Chargement du statut */}
          {authLoading ? (
            <div className="text-center py-8">
              <p className="text-slate-600">Vérification de votre compte...</p>
            </div>
          ) : !user ? (
            /* Non connecté */
            <div className="mb-10 rounded-lg border border-[#D4A373] px-6 py-8 shadow-sm">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
                <div>
                  <h3 className="mb-3 text-xl font-semibold text-yellow-900">
                    Connexion requise
                  </h3>
                  <p className="text-yellow-900/90 text-justify">
                    Créez votre espace thérapeute ou connectez-vous pour accéder aux disponibilités, soumettre vos documents et réserver vos créneaux en quelques clics.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <button
                      onClick={() => router.push('/connexion')}
                      className="cursor-pointer bg-[#D4A373] px-6 py-3 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363]"
                    >
                      Se connecter
                    </button>
                    <button
                      onClick={() => router.push('/compte')}
                      className="cursor-pointer border border-[#D4A373] px-6 py-3 font-semibold uppercase tracking-wide text-[#D4A373] transition-colors hover:bg-[#D4A373] hover:text-white"
                    >
                      Créer un compte
                    </button>
                  </div>
                </div>
                <div className="rounded-md border border-yellow-200 bg-white/70 p-5">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-yellow-700">
                    Comment ça marche ?
                  </h4>
                  <ul className="space-y-3 text-sm text-yellow-800">
                    <li className="flex items-start gap-3">
                      <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D4A373]" aria-hidden />
                      <span>Complétez votre profil praticien et ajoutez vos documents réglementaires.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D4A373]" aria-hidden />
                      <span>Recevez la validation de l&apos;équipe Theranice.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#D4A373]" aria-hidden />
                      <span>Choisissez une salle, un créneau et réglez en ligne en toute sécurité. Recevez votre code d&apos;accès par email.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : !profile ? (
            /* Chargement du profil */
            <div className="text-center py-8">
              <p className="text-slate-600">Chargement de votre profil...</p>
            </div>
          ) : profile.account_status !== 'approved' ? (
            /* Compte non approuvé */
            <div className="mb-6">
              <div className="bg-[#B12F2E] text-white px-6 py-4 rounded mb-4">
                <h3 className="font-semibold text-lg mb-2">
                  {(!profile.account_status || profile.account_status === 'pending') && 'Documents manquants'}
                  {profile.account_status === 'documents_submitted' && 'Validation en cours'}
                  {profile.account_status === 'rejected' && 'Compte non validé'}
                </h3>
                <p>
                  {(!profile.account_status || profile.account_status === 'pending') && 'Merci de compléter vos documents (carte d\'identité, KBIS, activité exercée) dans votre profil avant de pouvoir réserver.'}
                  {profile.account_status === 'documents_submitted' && 'Vos documents sont en cours de vérification par l\'administrateur. Vous pourrez réserver une fois votre compte validé.'}
                  {profile.account_status === 'rejected' && 'Votre compte a été rejeté. Veuillez contacter l\'administrateur pour plus d\'informations.'}
                </p>
              </div>
              <button
                onClick={() => router.push('/profil')}
                className="bg-[#D4A373] text-white px-6 py-2 font-semibold uppercase tracking-wide hover:bg-[#c49363] transition-colors"
              >
                Aller à mon profil
              </button>
            </div>
          ) : (
            /* Compte approuvé - afficher le formulaire */
            <>
              {/* Messages */}
              {error && (
                <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Calendrier */}
            <div>
              <h3 className="text-xl font-semibold text-[#333333] mb-4">
                1. Choisissez vos dates
              </h3>
              <p className="text-sm text-slate-500 mb-2">Cliquez sur une date pour la sélectionner ou la désélectionner.</p>
              <div className="calendar-container">
                <Calendar
                  onClickDay={handleDateClick}
                  value={null} // On gère l'affichage via tileClassName
                  minDate={new Date()}
                  locale="fr-FR"
                  tileClassName={({ date }) => {
                    // Vérifie si la date est sélectionnée
                    const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
                    if (isSelected) return 'react-calendar__tile--active';

                    // Utilise la date locale au lieu de UTC
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    const bookingsForDate = existingBookings.filter(b => b.date === dateStr);
                    
                    if (bookingsForDate.length === 0) return null;
                    
                    // Vérifie si tous les créneaux/salles sont complets
                    // Pour chaque créneau, vérifie si toutes les salles sont indisponibles
                    const allRooms: Room[] = ['room1', 'room2', 'large'];
                    const allSlots: Slot[] = ['morning', 'afternoon'];
                    
                    let availableCount = 0;
                    for (const slot of allSlots) {
                      for (const room of allRooms) {
                        if (isSlotAvailable(date, slot, room)) {
                          availableCount++;
                        }
                      }
                    }
                    
                    // Complet = aucun créneau/salle n'est disponible
                    const isFull = availableCount === 0;
                    
                    if (isFull) return 'has-full-booking';
                    return 'has-booking';
                  }}
                />
              </div>
              
              {/* Légende */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#D4A373]"></div>
                  <span className="text-slate-600">Partiellement réservé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#d06264]"></div>
                  <span className="text-slate-600">Complet</span>
                </div>
       
              </div>
            </div>

            {/* Salle et créneau */}
            <div className="space-y-6">
              {/* Sélection de la salle */}
              <div>
                <h3 className="text-xl font-semibold text-[#333333] mb-4">
                  2. Choisissez une salle
                </h3>
                <div className="space-y-3">
                  {(Object.keys(ROOM_PRICES) as Room[]).map((room) => {
                    const isAvailable = isRoomAvailableForDates(room);
                    
                    return (
                      <label
                        key={room}
                        className={`flex items-center justify-between p-4 border-2 transition-colors ${
                          !isAvailable
                            ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200'
                            : selectedRoom === room
                            ? 'border-[#D4A373] bg-[#D4A373]/10 cursor-pointer'
                            : 'border-slate-300 hover:border-[#D4A373] cursor-pointer'
                        }`}
                        onClick={(e) => {
                          if (!isAvailable) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="room"
                            value={room}
                            checked={selectedRoom === room}
                            onChange={() => setSelectedRoom(room)}
                            disabled={!isAvailable}
                            className="w-4 h-4 text-[#D4A373] disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className="font-medium">
                            {ROOM_LABELS[room]}
                            {!isAvailable && <span className="ml-2 text-sm text-red-600">(Tous les créneaux indisponibles)</span>}
                          </span>
                        </div>
                        <span className={`font-semibold ${isAvailable ? 'text-[#D4A373]' : 'text-slate-400'}`}>
                          {ROOM_PRICES[room]}€
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Sélection du créneau */}
              <div>
                <h3 className="text-xl font-semibold text-[#333333] mb-4">
                  3. Choisissez un créneau
                </h3>
                <div className="space-y-3">
                  <label
                    className={`flex items-center justify-between p-4 border-2  transition-colors ${
                      !isSlotAvailableForSelection('morning')
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200'
                        : selectedSlot === 'morning'
                        ? 'border-[#D4A373] bg-[#D4A373]/10 cursor-pointer'
                        : 'border-slate-300 hover:border-[#D4A373] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="slot"
                        value="morning"
                        checked={selectedSlot === 'morning'}
                        onChange={() => setSelectedSlot('morning')}
                        disabled={!isSlotAvailableForSelection('morning')}
                        className="w-4 h-4 text-[#D4A373] disabled:opacity-50"
                      />
                      <span className="font-medium">
                        Matin (8h-12h)
                        {!isSlotAvailableForSelection('morning') && <span className="ml-2 text-sm text-red-600">(Indisponible)</span>}
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center justify-between p-4 border-2 transition-colors ${
                      !isSlotAvailableForSelection('afternoon')
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200'
                        : selectedSlot === 'afternoon'
                        ? 'border-[#D4A373] bg-[#D4A373]/10 cursor-pointer'
                        : 'border-slate-300 hover:border-[#D4A373] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="slot"
                        value="afternoon"
                        checked={selectedSlot === 'afternoon'}
                        onChange={() => setSelectedSlot('afternoon')}
                        disabled={!isSlotAvailableForSelection('afternoon')}
                        className="w-4 h-4 text-[#D4A373] disabled:opacity-50"
                      />
                      <span className="font-medium">
                        Après-midi (13h-17h)
                        {!isSlotAvailableForSelection('afternoon') && <span className="ml-2 text-sm text-red-600">(Indisponible)</span>}
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center justify-between p-4 border-2 transition-colors ${
                      !isSlotAvailableForSelection('fullday')
                        ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200'
                        : selectedSlot === 'fullday'
                        ? 'border-[#D4A373] bg-[#D4A373]/10 cursor-pointer'
                        : 'border-slate-300 hover:border-[#D4A373] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="slot"
                        value="fullday"
                        checked={selectedSlot === 'fullday'}
                        onChange={() => setSelectedSlot('fullday')}
                        disabled={!isSlotAvailableForSelection('fullday')}
                        className="w-4 h-4 text-[#D4A373] disabled:opacity-50"
                      />
                      <span className="font-medium">
                        Journée complète (8h-17h)
                        {!isSlotAvailableForSelection('fullday') && <span className="ml-2 text-sm text-red-600">(Indisponible)</span>}
                      </span>
                    </div>
                    <span className={`font-semibold ${isSlotAvailableForSelection('fullday') ? 'text-[#D4A373]' : 'text-slate-400'}`}>
                      {selectedRoom && FULLDAY_PRICES[selectedRoom]}€
                    </span>
                  </label>
                </div>
              </div>

              {/* Total et bouton */}
              {selectedRoom && (
                <div className="border-t-2 border-[#333333] pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                      <span className="text-xl font-semibold text-[#333333]">Total :</span>
                      {selectedDates.length > 1 && (
                        <span className="text-sm text-slate-500">
                          ({selectedDates.length} dates x {selectedSlot === 'fullday' ? FULLDAY_PRICES[selectedRoom] : ROOM_PRICES[selectedRoom]}€)
                        </span>
                      )}
                    </div>
                    <span className="text-3xl font-bold text-[#D4A373]">
                      {(selectedSlot === 'fullday' ? FULLDAY_PRICES[selectedRoom] : ROOM_PRICES[selectedRoom]) * (selectedDates.length || 0)}€
                    </span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading || selectedDates.length === 0 || !selectedRoom || !selectedSlot || selectedDates.some(date => !isSlotAvailable(date, selectedSlot, selectedRoom))}
                    className="w-full cursor-pointer bg-[#D4A373] px-8 py-3 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Réservation en cours..." : user ? "Réserver" : "Se connecter pour réserver"}
                  </button>
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      </section>
    </div>
  );
}
