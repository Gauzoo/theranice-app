'use client';

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
      const error = err as Error;
      setError(error.message || "Email ou mot de passe incorrect");
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
    <>
      {/* Overlay transparent pour fermer au clic */}
      <div
        className="fixed inset-0 z-[100]"
        onClick={onClose}
      >
        {/* Modal alignée avec le bouton Mon compte */}
        <div
          style={{
            top: modalStyle.top,
            right: modalStyle.right
          }}
          className="absolute bg-white/90 backdrop-blur-sm rounded-md shadow-2xl w-full max-w-xs p-4 animate-slideDown"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Triangle pointant vers le centre du bouton Mon compte */}
          <div 
            style={{ right: modalStyle.trianglePosition }}
            className="absolute -top-3 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-white/90 "
          ></div>
          
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-[#333333] hover:text-slate-600 transition-colors cursor-pointer"
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
          <h2 className="text-1xl font-semibold text-slate-900 mb-4">
            MON COMPTE
          </h2>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-3 py-2 rounded text-sm mb-2">
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
              className="w-full bg-[#D4A373] text-white font-semibold py-2 cursor-pointer hover:bg-[#c49363] transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Connexion"}
            </button>

            {/* Bouton Créer un compte */}
            <Link
              href="/compte"
              onClick={onClose}
              className="block w-full text-center border-1 border-[#D4A373]  text-[#D4A373] font-semibold py-2 hover:bg-[#D4A373] hover:text-white transition-colors uppercase tracking-wide"
            >
              Créer un compte
            </Link>

            {/* Mot de passe oublié */}
            <div className="text-center pt-2">
              <a
                href="#"
                className="text-sm text-slate-600 hover:text-[#D4A373] transition-colors"
              >
                Mot de passe oublié ?
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
