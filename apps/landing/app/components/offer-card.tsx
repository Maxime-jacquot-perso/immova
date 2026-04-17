import type { PricingPlan } from '../content/marketing-content';
import { LandingCtaLink } from './landing-cta-link';
import styles from './marketing-ui.module.css';

type OfferCardProps = {
  plan: PricingPlan;
};

export function OfferCard({ plan }: OfferCardProps) {
  const classes = [
    styles.pricingCard,
    plan.featured ? styles.pricingCardFeatured : '',
    plan.disabled ? styles.pricingCardMuted : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={classes}>
      <div className={styles.planHeader}>
        <div>
          <p className={styles.kicker}>Offre</p>
          <h3 className={styles.planName}>{plan.name}</h3>
        </div>
        <span
          className={`${styles.statusBadge} ${
            plan.statusTone === 'available'
              ? styles.statusAvailable
              : styles.statusPending
          }`.trim()}
        >
          {plan.status}
        </span>
      </div>

      <div>
        <div className={styles.priceLine}>
          <p className={styles.priceLabel}>{plan.priceLabel}</p>
        </div>
        <p className={styles.priceDetail}>{plan.priceDetail}</p>
      </div>

      <p className={styles.planDescription}>{plan.description}</p>

      <ul className={styles.featureList}>
        {plan.highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {plan.cta && !plan.disabled ? (
        <LandingCtaLink
          className={plan.featured ? styles.buttonPrimary : styles.buttonSecondary}
          href={plan.cta.href}
          location={plan.cta.location}
          label={plan.cta.trackingLabel}
          target={plan.cta.target ?? plan.cta.href}
        >
          {plan.cta.label}
        </LandingCtaLink>
      ) : (
        <span className={styles.buttonDisabled}>Bientôt disponible</span>
      )}

      <p className={styles.footnote}>{plan.footnote}</p>
    </article>
  );
}
