import Image from 'next/image';
import Link from 'next/link';
import { PilotApplicationForm } from '../components/pilot-application-form';
import styles from './page.module.css';
import { siteName } from '../site-config';

export default function ApplyPage() {
  return (
    <div className={styles.shell}>
      <div className={styles.glowLeft} />
      <div className={styles.glowRight} />

      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <Image src="/logo-text-bleu.svg" alt={siteName} width={250} height={50} />
        </Link>

        <Link className={styles.backLink} href="/">
          Retour à l’accueil
        </Link>
      </header>

      <main className={styles.main}>
        <section className={styles.panel}>
          <div className={styles.copy}>
            <div className={styles.eyebrow}>Demande d’accès client pilote</div>
            <h1>Un formulaire simple pour vérifier la pertinence.</h1>
            <p>
              Cette page reprend exactement le même formulaire que la landing.
              Il sert à comprendre votre contexte, votre profil et votre niveau
              de besoin réel.
            </p>

            <ul className={styles.list}>
              <li>Le programme reste limité à un petit nombre de profils pertinents.</li>
              <li>Le tarif pilote reste à 15 € / mois pour les profils retenus.</li>
              <li>Il ne s’agit pas d’une inscription automatique.</li>
            </ul>
          </div>

          <PilotApplicationForm
            submitLabel="Envoyer ma demande"
            successTitle="Demande reçue"
            successDescription="Si votre contexte correspond au programme client pilote, on reviendra vers vous pour la suite."
            successNote="Le tri reste volontairement sélectif. On préfère être clairs plutôt que promettre un accès à tout le monde."
            returnHref="/"
          />
        </section>
      </main>
    </div>
  );
}
