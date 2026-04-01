'use client';

import { useState } from 'react';
import { siteName } from '../site-config';
import Image from 'next/image';
import Link from 'next/link';

export default function ApplyPage() {
  const [formData, setFormData] = useState({
    firstname: '',
    email: '',
    projectCount: '',
    profileType: '',
    problemDescription: '',
    acknowledgement: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/pilot-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l&apos;envoi du formulaire');
      }

      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue. Réessayez dans quelques instants.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="landing-shell">
        <div className="landing-orb landing-orb--left" />
        <div className="landing-orb landing-orb--right" />

        <header className="site-header">
          <Link className="site-brand" href="/">
            <Image src="/logo-text-bleu.svg" alt={siteName} width={250} height={50} />
          </Link>
        </header>

        <main className="apply-container">
          <div className="apply-success">
            <div className="apply-success__icon">✓</div>
            <h1>Demande reçue</h1>
            <p>
              On revient vers vous rapidement si votre profil correspond au programme
              client pilote.
            </p>
            <p className="apply-success__note">
              Pas de &ldquo;merci pour votre intérêt incroyable&rdquo;. On filtre. Si
              ça match, vous aurez une réponse sous 48h.
            </p>
            <Link className="button" href="/">
              Retour à l&apos;accueil
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="landing-shell">
      <div className="landing-orb landing-orb--left" />
      <div className="landing-orb landing-orb--right" />

      <header className="site-header">
        <Link className="site-brand" href="/">
          <Image src="/logo-text-bleu.svg" alt={siteName} width={250} height={50} />
        </Link>
      </header>

      <main className="apply-container">
        <div className="apply-form-wrapper">
          <div className="apply-header">
            <h1>Demande d&apos;accès client pilote</h1>
            <p>
              On sélectionne 15 clients pilotes. Ce formulaire nous permet de comprendre
              si {siteName} est pertinent pour vous.
            </p>
          </div>

          <form className="apply-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="firstname">
                Prénom <span className="required">*</span>
              </label>
              <input
                type="text"
                id="firstname"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="projectCount">
                Nombre de projets en cours <span className="required">*</span>
              </label>
              <select
                id="projectCount"
                name="projectCount"
                value={formData.projectCount}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez</option>
                <option value="1">1</option>
                <option value="2-5">2–5</option>
                <option value="6-10">6–10</option>
                <option value="10+">10+</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="profileType">
                Type de profil <span className="required">*</span>
              </label>
              <select
                id="profileType"
                name="profileType"
                value={formData.profileType}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez</option>
                <option value="Investisseur immobilier">Investisseur immobilier</option>
                <option value="Marchand de biens">Marchand de biens</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="problemDescription">
                Qu&apos;est-ce qui vous pose problème aujourd&apos;hui dans le pilotage
                de vos projets ? <span className="required">*</span>
              </label>
              <textarea
                id="problemDescription"
                name="problemDescription"
                value={formData.problemDescription}
                onChange={handleChange}
                rows={5}
                placeholder="Décrivez en quelques phrases le problème que vous rencontrez actuellement..."
                required
              />
            </div>

            <div className="form-group form-group--checkbox">
              <label htmlFor="acknowledgement">
                <input
                  type="checkbox"
                  id="acknowledgement"
                  name="acknowledgement"
                  checked={formData.acknowledgement}
                  onChange={handleChange}
                  required
                />
                <span>
                  Je comprends que le produit est en phase pilote (bugs possibles,
                  évolution rapide)
                </span>
              </label>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="button button--large button--full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer ma demande'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
