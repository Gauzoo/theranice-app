'use client';

import { useState, type FormEvent } from "react";
import { CONTACT_EMAIL } from '@/lib/constants';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setSubmittedEmail('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      setSubmittedEmail(formData.email);
      setStatus('success');
      setFormData({ nom: '', prenom: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {status === 'success' && (
        <div className="border border-green-200 bg-green-50 px-5 py-4 text-green-800">
          Message envoyé ! Nous vous répondrons à {submittedEmail} dans les plus brefs délais.
        </div>
      )}
      {status === 'error' && (
        <div className="border border-red-200 bg-red-50 px-5 py-4 text-red-800">
          Une erreur est survenue. Veuillez vérifier votre adresse email ou nous écrire directement à {CONTACT_EMAIL}.
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Nom */}
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
            autoComplete="family-name"
            required
            className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
            placeholder="Votre nom"
          />
        </div>

        {/* Prénom */}
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
            autoComplete="given-name"
            required
            className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
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
          onChange={handleChange}
          autoComplete="email"
          required
          className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
          placeholder="votre@email.fr"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-slate-900">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={6}
          className="mt-2 w-full resize-none border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
          placeholder="Votre message..."
        />
      </div>

      {/* Bouton Envoyer */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="cursor-pointer bg-[#D4A373] px-8 py-3 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Envoi en cours...' : 'Envoyer'}
        </button>
      </div>
    </form>
  );
}
