'use client';

import { useState, type FormEvent } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    sujet: '',
    message: ''
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Ici, vous pourrez ajouter la logique d'envoi du formulaire
    console.log('Formulaire envoyé:', formData);
    // TODO: Implémenter l'envoi réel (API, email, etc.)
    alert('Message envoyé ! Nous vous répondrons dans les plus brefs délais.');
    
    // Réinitialiser le formulaire
    setFormData({
      nom: '',
      prenom: '',
      sujet: '',
      message: ''
    });
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
            required
            className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
            placeholder="Votre prénom"
          />
        </div>
      </div>

      {/* Sujet */}
      <div>
        <label htmlFor="sujet" className="block text-sm font-semibold text-slate-900">
          Sujet <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="sujet"
          name="sujet"
          value={formData.sujet}
          onChange={handleChange}
          required
          className="mt-2 w-full border border-slate-300 px-4 py-2 text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#D4A373] focus:outline-none focus:ring-1 focus:ring-[#D4A373]"
          placeholder="Objet de votre message"
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
          className="cursor-pointer bg-[#D4A373] px-8 py-3 font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#c49363]"
        >
          Envoyer
        </button>
      </div>
    </form>
  );
}
