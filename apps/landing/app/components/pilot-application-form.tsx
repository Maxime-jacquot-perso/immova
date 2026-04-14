'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './pilot-application-form.module.css';

type PilotApplicationFormProps = {
  submitLabel: string;
  successTitle: string;
  successDescription: string;
  successNote: string;
  returnHref?: string;
};

const projectCountOptions = ['1', '2-5', '6-10', '10+'] as const;
const profileTypeOptions = [
  'Investisseur immobilier',
  'Marchand de biens',
  'Autre',
] as const;

type FormState = {
  firstname: string;
  email: string;
  projectCount: string;
  profileType: string;
  problemDescription: string;
  acknowledgement: boolean;
};

const initialState: FormState = {
  firstname: '',
  email: '',
  projectCount: '',
  profileType: '',
  problemDescription: '',
  acknowledgement: false,
};

export function PilotApplicationForm({
  submitLabel,
  successTitle,
  successDescription,
  successNote,
  returnHref,
}: PilotApplicationFormProps) {
  const [formData, setFormData] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === 'checkbox'
          ? (event.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      ...formData,
      firstname: formData.firstname.trim(),
      email: formData.email.trim(),
      problemDescription: formData.problemDescription.trim(),
    };

    try {
      const response = await fetch('/api/pilot-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(
          body?.error ??
            'Une erreur est survenue. Réessayez dans quelques instants.',
        );
      }

      setFormData(initialState);
      setIsSuccess(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Une erreur est survenue. Réessayez dans quelques instants.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.successCard} aria-live="polite">
        <div className={styles.successMark}>OK</div>
        <h3>{successTitle}</h3>
        <p>{successDescription}</p>
        <p className={styles.successNote}>{successNote}</p>
        {returnHref ? (
          <Link className={styles.successLink} href={returnHref}>
            Retourner à l’accueil
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form className={styles.formCard} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="firstname">
            Prénom <span>*</span>
          </label>
          <input
            type="text"
            id="firstname"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            placeholder="Maxime"
            required
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="email">
            Email <span>*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="vous@societe.fr"
            required
          />
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="profileType">
            Profil <span>*</span>
          </label>
          <select
            id="profileType"
            name="profileType"
            value={formData.profileType}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionnez</option>
            {profileTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="projectCount">
            Projets actifs <span>*</span>
          </label>
          <select
            id="projectCount"
            name="projectCount"
            value={formData.projectCount}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionnez</option>
            {projectCountOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="problemDescription">
          Message libre <span>*</span>
        </label>
        <textarea
          id="problemDescription"
          name="problemDescription"
          value={formData.problemDescription}
          onChange={handleChange}
          rows={6}
          placeholder="Expliquez en quelques lignes votre contexte, ce que vous pilotez aujourd’hui, ou ce que vous voulez éviter."
          required
        />
      </div>

      <label className={styles.checkbox} htmlFor="acknowledgement">
        <input
          type="checkbox"
          id="acknowledgement"
          name="acknowledgement"
          checked={formData.acknowledgement}
          onChange={handleChange}
          required
        />
        <span>
          Je comprends que le produit est en phase pilote et qu’il peut encore
          évoluer rapidement.
        </span>
      </label>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Envoi en cours…' : submitLabel}
      </button>

      <p className={styles.formFootnote}>
        On lit les demandes une par une. Pas d’inscription automatique.
      </p>
    </form>
  );
}
