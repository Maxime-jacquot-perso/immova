import Link from 'next/link';
import { PilotApplicationForm } from '../components/pilot-application-form';
import { SiteShell } from '../components/site-shell';
import styles from '../components/marketing-ui.module.css';
import {
  clientPilotFaq,
  clientPilotSignals,
  clientPilotSteps,
} from '../content/marketing-content';
import { buildMetadata } from '../seo';

export const metadata = buildMetadata({
  title: 'Client pilote',
  description:
    'Programme client pilote Axelys pour investisseurs immobiliers actifs, marchands de biens et petites structures multi-projets.',
  path: '/client-pilote',
  keywords: ['client pilote immobilier', 'programme pilote saas immobilier', 'outil décision immobilier'],
});

export default function ClientPilotePage() {
  return (
    <SiteShell currentPath="/client-pilote" ctaHref="#pilot-form" ctaTarget="#pilot-form" ctaTrackingLabel="jump_to_pilot_form">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>Programme client pilote</div>
              <h1 className={styles.heroTitle}>Tester Axelys sur vos vrais dossiers, dans un cadre clair.</h1>
              <p className={styles.heroLead}>
                Client pilote est la seule offre accessible aujourd’hui. Elle s’adresse aux
                profils qui veulent décider avant achat et piloter après acquisition sur des
                cas réels.
              </p>
              <ul className={styles.highlightList}>
                {clientPilotSignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
              <div className={styles.actionRow}>
                <Link className={styles.buttonPrimary} href="#pilot-form">
                  Candidater maintenant
                </Link>
                <Link className={styles.buttonSecondary} href="/pricing">
                  Voir les offres
                </Link>
              </div>
            </div>
            <aside className={styles.heroPanel}>
              <p className={styles.kicker}>Cadre</p>
              <h2 className={styles.panelTitle}>Sobre, crédible, sans faux raccourci.</h2>
              <ul className={styles.panelList}>
                <li>Accès sur sélection</li>
                <li>Tarif pilote affiché clairement</li>
                <li>Usage réservé aux contextes pertinents</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>Fonctionnement</div>
            <h2 className={styles.sectionTitle}>Comment le programme se déroule</h2>
          </div>
          <div className={styles.cardGrid}>
            {clientPilotSteps.map((step, index) => (
              <article
                className={`${styles.card} ${index === 0 ? styles.cardEmphasis : ''}`.trim()}
                key={step.title}
              >
                <h3 className={styles.cardTitle}>{step.title}</h3>
                <p className={styles.cardText}>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="pilot-form">
          <div className={styles.formGrid}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>Demande d’accès</div>
              <h2 className={styles.sectionTitle}>Présentez votre contexte.</h2>
              <p className={styles.sectionLead}>
                On cherche à comprendre si Axelys peut déjà vous aider à arbitrer et à
                piloter sur des opérations réelles.
              </p>
              <ul className={styles.signalList}>
                <li>Tarif pilote à 15 € / mois pour les profils retenus</li>
                <li>Simple et Pro restent à venir</li>
                <li>Accès ouvert seulement si l’usage est pertinent maintenant</li>
              </ul>
            </div>
            <PilotApplicationForm
              submitLabel="Envoyer ma demande"
              successTitle="Demande reçue"
              successDescription="Si le contexte correspond au programme client pilote, nous reviendrons vers vous avec la suite."
              successNote="Le parcours reste volontairement sélectif pour garder un vrai accompagnement et un produit utile."
              returnHref="/client-pilote"
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div className={styles.eyebrow}>FAQ</div>
            <h2 className={styles.sectionTitle}>Les questions les plus fréquentes</h2>
          </div>
          <div className={styles.faqGrid}>
            {clientPilotFaq.map((item) => (
              <details className={styles.faqItem} key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
