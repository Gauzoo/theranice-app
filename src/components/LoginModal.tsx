'use client';

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseAuthError } from "@/lib/supabase/authErrors";
import { useRouter } from "next/navigation";


interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function LoginModal({ isOpen, onClose, buttonRef }: LoginModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [modalStyle, setModalStyle] = useState({
    top: '80px',
    right: '24px',
    trianglePosition: '64px' // Position du triangle depuis la droite
  });

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef?.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        
        // Position de la modal : alignée à droite avec le bouton
        const modalRight = windowWidth - buttonRect.right;
        
        // Position du triangle : au centre du bouton
        const buttonCenter = buttonRect.left + (buttonRect.width / 2);
        const modalRightEdge = buttonRect.right;
        const triangleFromRight = modalRightEdge - buttonCenter - 70;
        
        setModalStyle({
          top: `${buttonRect.bottom + 13}px`,
          right: `${modalRight - 16}px`,
          trianglePosition: `${triangleFromRight}px`
        });
      }
    };

    updatePosition();
    
    // Écoute les changements de taille de fenêtre
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, buttonRef]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError(translateSupabaseAuthError(err, "Email ou mot de passe incorrect"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      {/* Overlay transparent pour fermer au clic */}
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Fermer la fenêtre de connexion"
      />

      {/* Modal alignée avec le bouton Mon compte */}
      <div
        style={{
          top: modalStyle.top,
          right: modalStyle.right
        }}
        className="absolute z-[101] w-full max-w-xs animate-slideDown rounded-md bg-white/90 p-4 shadow-2xl backdrop-blur-sm"
      >
        {/* Triangle pointant vers le centre du bouton Mon compte */}
        <div
          style={{ right: modalStyle.trianglePosition }}
          className="absolute -top-3 h-0 w-0 border-r-[12px] border-r-transparent border-b-[12px] border-b-white/90 border-l-[12px] border-l-transparent"
          aria-hidden="true"
        />

        {/* Bouton fermer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-4 cursor-pointer text-[#333333] transition-colors hover:text-slate-600"
          aria-label="Fermer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Titre */}
        <h2 id="login-modal-title" className="text-1xl mb-4 font-semibold text-slate-900">
          MON COMPTE
        </h2>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Email */}
          <div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
              placeholder="e-mail *"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
              placeholder="Mot de passe *"
            />
          </div>

          {/* Bouton Connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer bg-[#D4A373] py-2 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Connexion"}
          </button>

          {/* Bouton Créer un compte */}
          <Link
            href="/compte"
            onClick={onClose}
            className="block w-full border-1 border-[#D4A373] text-center font-semibold text-[#D4A373] py-2 uppercase tracking-wide transition-colors hover:bg-[#D4A373] hover:text-white"
          >
            Créer un compte
          </Link>

          {/* Mot de passe oublié */}
          <div className="pt-2 text-center">
            <Link
              href="/mot-de-passe-oublie"
              onClick={onClose}
              className="text-sm text-slate-600 transition-colors hover:text-[#D4A373]"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
