import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/auth-context";
import {
  getOptionActivationHistory,
  type OptionActivationHistoryEntry,
  type SimulationOptionGroupType,
} from "../api";
import { LoadingBlock } from "../../../shared/ui/loading-block";
import {
  formatCount,
  formatCurrency,
  formatDateTime,
} from "../../../shared/ui/formatters";

type Props = {
  simulationId: string;
};

const GROUP_TYPE_LABELS: Record<SimulationOptionGroupType, string> = {
  PURCHASE_PRICE: "Prix d'achat",
  WORK_BUDGET: "Travaux",
  FINANCING: "Financement",
};

function getDeltaPresentation(
  value: number,
  options: {
    currency?: boolean;
    higherIsBetter: boolean;
    suffix?: string;
  },
) {
  if (value === 0) {
    return {
      text: options.currency ? "0 €" : "0",
      color: "var(--muted)",
    };
  }

  const sign = value > 0 ? "+" : "-";
  const absoluteValue = Math.abs(value);
  const text = options.currency
    ? `${sign}${formatCurrency(absoluteValue)}`
    : `${sign}${formatCount(absoluteValue)}${options.suffix ?? ""}`;
  const isPositiveOutcome = options.higherIsBetter ? value > 0 : value < 0;

  return {
    text,
    color: isPositiveOutcome ? "#2e7d32" : "#c62828",
  };
}

function buildDeltaItems(entry: OptionActivationHistoryEntry) {
  return [
    {
      key: "margin",
      label: "Marge",
      value: entry.delta.margin,
      ...getDeltaPresentation(entry.delta.margin, {
        currency: true,
        higherIsBetter: true,
      }),
    },
    {
      key: "monthlyPayment",
      label: "Mensualité",
      value: entry.delta.monthlyPayment,
      ...getDeltaPresentation(entry.delta.monthlyPayment, {
        currency: true,
        higherIsBetter: false,
      }),
    },
    {
      key: "totalProjectCost",
      label: "Coût total",
      value: entry.delta.totalProjectCost,
      ...getDeltaPresentation(entry.delta.totalProjectCost, {
        currency: true,
        higherIsBetter: false,
      }),
    },
    {
      key: "projectDurationMonths",
      label: "Durée",
      value: entry.delta.projectDurationMonths,
      ...getDeltaPresentation(entry.delta.projectDurationMonths, {
        higherIsBetter: false,
        suffix: " mois",
      }),
    },
    {
      key: "score",
      label: "Score",
      value: entry.delta.score,
      ...getDeltaPresentation(entry.delta.score, {
        higherIsBetter: true,
        suffix: " pts",
      }),
    },
  ].filter((item) => item.value !== 0);
}

export function OptionActivationHistorySection({ simulationId }: Props) {
  const { session } = useAuth();

  const historyQuery = useQuery({
    queryKey: ["option-activation-history", simulationId],
    queryFn: () => getOptionActivationHistory(session, simulationId),
  });

  if (historyQuery.isLoading) {
    return <LoadingBlock />;
  }

  if (historyQuery.isError) {
    return (
      <div className="panel error-state">
        <p>Erreur lors du chargement de l'historique des décisions.</p>
      </div>
    );
  }

  const history = historyQuery.data ?? [];

  if (history.length === 0) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Aucune activation enregistrée pour le moment.
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-tertiary)",
            marginTop: "0.5rem",
          }}
        >
          Chaque changement d'option sera tracé ici pour expliquer les
          arbitrages.
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div
        className="panel"
        style={{ background: "#f4f7fb", border: "1px solid #d8e2ef" }}
      >
        <p style={{ margin: 0, color: "#37516b", fontSize: "0.95rem" }}>
          L'historique garde une trace lisible des changements d'hypothèses pour
          pouvoir justifier une décision face à un associé ou un financeur.
        </p>
      </div>

      <div className="stack" style={{ gap: "1rem" }}>
        {history.map((entry) => {
          const deltaItems = buildDeltaItems(entry);

          return (
            <section
              key={`${entry.createdAt}-${entry.user.id}-${entry.next}`}
              className="panel"
              style={{
                borderLeft: "4px solid #1f6feb",
                paddingLeft: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {GROUP_TYPE_LABELS[entry.groupType]}
                  </div>
                  <div
                    style={{
                      color: "var(--color-text-tertiary)",
                      fontSize: "0.875rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    {entry.user.displayName} • {formatDateTime(entry.createdAt)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "0.85rem",
                  display: "grid",
                  gap: "0.35rem",
                }}
              >
                <div style={{ color: "var(--color-text-secondary)" }}>
                  Avant
                </div>
                <div style={{ fontWeight: 600 }}>{entry.previous}</div>
                <div style={{ color: "var(--color-text-secondary)" }}>
                  Après
                </div>
                <div style={{ fontWeight: 600 }}>{entry.next}</div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  marginTop: "1rem",
                }}
              >
                {deltaItems.length > 0 ? (
                  deltaItems.map((item) => (
                    <span
                      key={item.key}
                      style={{
                        display: "inline-flex",
                        gap: "0.35rem",
                        alignItems: "center",
                        borderRadius: "999px",
                        padding: "0.35rem 0.7rem",
                        background: "#f7f7f8",
                        color: item.color,
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        {item.label}
                      </span>
                      <span>{item.text}</span>
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      color: "var(--color-text-tertiary)",
                      fontSize: "0.875rem",
                    }}
                  >
                    Aucun impact chiffré notable sur les indicateurs suivis.
                  </span>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
