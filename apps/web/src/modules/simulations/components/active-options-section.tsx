import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../auth/auth-context";
import {
  activateOption,
  deleteOption,
  getOptionGroupComparison,
  getOptionGroups,
  getOptionImpact,
  type OptionGroupComparisonEntry,
  type SimulationMetrics,
  type SimulationOption,
  type SimulationOptionGroup,
  type SimulationOptionGroupType,
} from "../api";
import { LoadingBlock } from "../../../shared/ui/loading-block";
import { formatCount, formatCurrency } from "../../../shared/ui/formatters";

type Props = {
  simulationId: string;
  currentMetrics: SimulationMetrics;
  currentDecisionScore: number | null;
};

type ComparisonRow = {
  id: string;
  label: string;
  detail?: string;
  metrics: SimulationMetrics;
  score: number | null;
};

const GROUP_TYPE_LABELS: Record<SimulationOptionGroupType, string> = {
  PURCHASE_PRICE: "Prix d'achat",
  WORK_BUDGET: "Travaux",
  FINANCING: "Financement",
};

function formatOptionValue(
  type: SimulationOptionGroupType,
  valueJson: Record<string, unknown>,
): string {
  if (type === "PURCHASE_PRICE") {
    const price = valueJson.price ?? valueJson.value;
    return typeof price === "number" ? formatCurrency(price) : "N/A";
  }

  if (type === "WORK_BUDGET") {
    const parts: string[] = [];
    const cost = valueJson.cost ?? valueJson.value;

    if (typeof cost === "number") {
      parts.push(formatCurrency(cost));
    }

    if (typeof valueJson.durationMonths === "number") {
      parts.push(`${valueJson.durationMonths} mois`);
    }

    return parts.join(" • ") || "N/A";
  }

  if (type === "FINANCING") {
    const parts: string[] = [];

    if (valueJson.mode === "CASH") {
      parts.push("Cash");
    }

    if (valueJson.mode === "LOAN") {
      parts.push("Crédit");
    }

    if (typeof valueJson.rate === "number") {
      parts.push(`${valueJson.rate}%`);
    }

    if (typeof valueJson.durationMonths === "number") {
      parts.push(`${valueJson.durationMonths} mois`);
    }

    if (typeof valueJson.loanAmount === "number") {
      parts.push(formatCurrency(valueJson.loanAmount));
    }

    return parts.join(" • ") || "N/A";
  }

  return "N/A";
}

function formatDelta(
  value: number,
  options: {
    currency?: boolean;
    higherIsBetter: boolean;
    suffix?: string;
  },
): { text: string; color: string } {
  if (value === 0) {
    return {
      text: options.currency ? "0 €" : `0${options.suffix ?? ""}`,
      color: "#666",
    };
  }

  const sign = value > 0 ? "+" : "-";
  const absoluteValue = Math.abs(value);
  const text = options.currency
    ? `${sign}${formatCurrency(absoluteValue)}`
    : `${sign}${formatCount(absoluteValue)}${options.suffix ?? ""}`;

  return {
    text,
    color:
      (options.higherIsBetter && value > 0) ||
      (!options.higherIsBetter && value < 0)
        ? "#2e7d32"
        : "#c62828",
  };
}

function getCellTone(
  rows: ComparisonRow[],
  selector: (row: ComparisonRow) => number | null | undefined,
  higherIsBetter: boolean,
) {
  const comparableRows = rows
    .map((row) => ({
      id: row.id,
      value: selector(row),
    }))
    .filter(
      (item): item is { id: string; value: number } =>
        typeof item.value === "number" && Number.isFinite(item.value),
    );

  if (comparableRows.length < 2) {
    return new Map<string, "best" | "worst">();
  }

  const values = comparableRows.map((item) => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (minValue === maxValue) {
    return new Map<string, "best" | "worst">();
  }

  const bestValue = higherIsBetter ? maxValue : minValue;
  const worstValue = higherIsBetter ? minValue : maxValue;
  const toneByRow = new Map<string, "best" | "worst">();

  comparableRows.forEach((row) => {
    if (row.value === bestValue) {
      toneByRow.set(row.id, "best");
      return;
    }

    if (row.value === worstValue) {
      toneByRow.set(row.id, "worst");
    }
  });

  return toneByRow;
}

function ComparisonTable({
  group,
  entries,
  currentMetrics,
  currentDecisionScore,
}: {
  group: SimulationOptionGroup;
  entries: OptionGroupComparisonEntry[];
  currentMetrics: SimulationMetrics;
  currentDecisionScore: number | null;
}) {
  const currentLabel = group.activeOption
    ? group.activeOption.label
    : "Valeur initiale";
  const rows = useMemo<ComparisonRow[]>(() => {
    const alternativeRows = entries
      .filter((entry) => entry.optionId !== group.activeOptionId)
      .map((entry) => ({
        id: entry.optionId,
        label: entry.label,
        metrics: entry.metrics,
        score:
          typeof currentDecisionScore === "number"
            ? currentDecisionScore + entry.deltaVsActive.score
            : null,
      }));

    return [
      {
        id: "current",
        label: "Actuelle",
        detail: currentLabel,
        metrics: currentMetrics,
        score: currentDecisionScore,
      },
      ...alternativeRows,
    ];
  }, [
    currentDecisionScore,
    currentLabel,
    currentMetrics,
    entries,
    group.activeOptionId,
  ]);

  const costTone = getCellTone(
    rows,
    (row) => row.metrics.totalProjectCost,
    false,
  );
  const marginTone = getCellTone(rows, (row) => row.metrics.grossMargin, true);
  const paymentTone = getCellTone(
    rows,
    (row) => row.metrics.estimatedMonthlyPayment,
    false,
  );
  const durationTone = getCellTone(
    rows,
    (row) => row.metrics.projectDurationMonths,
    false,
  );
  const scoreTone = getCellTone(rows, (row) => row.score, true);

  const renderCell = (
    rowId: string,
    value: string,
    tone: "best" | "worst" | undefined,
  ) => (
    <td
      key={rowId}
      style={{
        background:
          tone === "best"
            ? "#ecf8ef"
            : tone === "worst"
              ? "#fff0f0"
              : undefined,
      }}
    >
      {value}
    </td>
  );

  return (
    <div className="panel" style={{ background: "#fbfcfd" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h4 style={{ margin: 0 }}>Comparaison des options</h4>
          <p
            style={{
              margin: "0.35rem 0 0",
              color: "var(--color-text-secondary)",
              fontSize: "0.9rem",
            }}
          >
            Lecture côte à côte des hypothèses du groupe, sans recommandation
            automatique.
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Option</th>
              <th>Coût</th>
              <th>Marge</th>
              <th>Mensualité</th>
              <th>Durée</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div style={{ fontWeight: row.id === "current" ? 600 : 500 }}>
                    {row.label}
                  </div>
                  {row.detail && (
                    <div
                      style={{
                        color: "var(--color-text-secondary)",
                        fontSize: "0.85rem",
                        marginTop: "0.2rem",
                      }}
                    >
                      {row.detail}
                    </div>
                  )}
                </td>
                {renderCell(
                  row.id,
                  formatCurrency(row.metrics.totalProjectCost),
                  costTone.get(row.id),
                )}
                {renderCell(
                  row.id,
                  formatCurrency(row.metrics.grossMargin),
                  marginTone.get(row.id),
                )}
                {renderCell(
                  row.id,
                  formatCurrency(row.metrics.estimatedMonthlyPayment),
                  paymentTone.get(row.id),
                )}
                {renderCell(
                  row.id,
                  row.metrics.projectDurationMonths !== null &&
                    row.metrics.projectDurationMonths !== undefined
                    ? `${formatCount(row.metrics.projectDurationMonths)} mois`
                    : "—",
                  durationTone.get(row.id),
                )}
                {renderCell(
                  row.id,
                  row.score !== null && row.score !== undefined
                    ? formatCount(row.score)
                    : "—",
                  scoreTone.get(row.id),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OptionCard({
  option,
  groupType,
  simulationId,
  onActivate,
  onDelete,
  isActivating,
  isDeleting,
}: {
  option: SimulationOption;
  groupType: SimulationOptionGroupType;
  simulationId: string;
  onActivate: (optionId: string) => void;
  onDelete: (optionId: string) => void;
  isActivating: boolean;
  isDeleting: boolean;
}) {
  const { session } = useAuth();
  const [showImpact, setShowImpact] = useState(false);

  const impactQuery = useQuery({
    queryKey: ["option-impact", simulationId, option.id],
    queryFn: () => getOptionImpact(session, simulationId, option.id),
    enabled: !option.isActive && showImpact,
    staleTime: 30000,
  });

  return (
    <div
      style={{
        padding: "0.75rem",
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        background: option.isActive ? "var(--color-surface-accent)" : "white",
      }}
      onMouseEnter={() => !option.isActive && setShowImpact(true)}
      onMouseLeave={() => setShowImpact(false)}
    >
      <div
        style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}
      >
        <input
          type="radio"
          checked={option.isActive}
          onChange={() => {
            if (!option.isActive) {
              onActivate(option.id);
            }
          }}
          disabled={isActivating}
          style={{ flexShrink: 0, marginTop: "0.25rem" }}
        />

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: option.isActive ? 600 : 400,
              marginBottom: "0.25rem",
            }}
          >
            {option.label}
            {option.isActive && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.125rem 0.5rem",
                  fontSize: "0.75rem",
                  background: "#2e7d32",
                  color: "white",
                  borderRadius: "3px",
                }}
              >
                Actuel
              </span>
            )}
            {!option.isActive && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.125rem 0.5rem",
                  fontSize: "0.75rem",
                  background: "#666",
                  color: "white",
                  borderRadius: "3px",
                }}
              >
                Alternative
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
              marginBottom: "0.25rem",
            }}
          >
            Valeur : {formatOptionValue(groupType, option.valueJson)}
          </div>

          <div
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-tertiary)",
            }}
          >
            Source : {option.source === "FROM_EVENT" ? "Événement" : "Manuel"}
            {option.sourceEvent && ` • ${option.sourceEvent.title}`}
          </div>

          {!option.isActive && showImpact && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                background: "#f5f5f5",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                Impact si sélectionnée
              </div>

              {impactQuery.isLoading && (
                <div style={{ fontSize: "0.875rem", color: "#666" }}>
                  Calcul en cours...
                </div>
              )}

              {impactQuery.isError && (
                <div style={{ fontSize: "0.875rem", color: "#c62828" }}>
                  Erreur lors du calcul
                </div>
              )}

              {impactQuery.data && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#666" }}>Coût total : </span>
                    <strong
                      style={{
                        color: formatDelta(
                          impactQuery.data.delta.totalProjectCost,
                          {
                            currency: true,
                            higherIsBetter: false,
                          },
                        ).color,
                      }}
                    >
                      {
                        formatDelta(impactQuery.data.delta.totalProjectCost, {
                          currency: true,
                          higherIsBetter: false,
                        }).text
                      }
                    </strong>
                  </div>

                  {impactQuery.data.delta.grossMargin !== 0 && (
                    <div>
                      <span style={{ color: "#666" }}>Marge : </span>
                      <strong
                        style={{
                          color: formatDelta(
                            impactQuery.data.delta.grossMargin,
                            {
                              currency: true,
                              higherIsBetter: true,
                            },
                          ).color,
                        }}
                      >
                        {
                          formatDelta(impactQuery.data.delta.grossMargin, {
                            currency: true,
                            higherIsBetter: true,
                          }).text
                        }
                      </strong>
                    </div>
                  )}

                  {impactQuery.data.delta.estimatedMonthlyPayment !== 0 && (
                    <div>
                      <span style={{ color: "#666" }}>Mensualité : </span>
                      <strong
                        style={{
                          color: formatDelta(
                            impactQuery.data.delta.estimatedMonthlyPayment,
                            {
                              currency: true,
                              higherIsBetter: false,
                            },
                          ).color,
                        }}
                      >
                        {
                          formatDelta(
                            impactQuery.data.delta.estimatedMonthlyPayment,
                            {
                              currency: true,
                              higherIsBetter: false,
                            },
                          ).text
                        }
                      </strong>
                    </div>
                  )}

                  {impactQuery.data.delta.projectDurationMonths !== 0 && (
                    <div>
                      <span style={{ color: "#666" }}>Durée : </span>
                      <strong
                        style={{
                          color: formatDelta(
                            impactQuery.data.delta.projectDurationMonths,
                            {
                              higherIsBetter: false,
                              suffix: " mois",
                            },
                          ).color,
                        }}
                      >
                        {
                          formatDelta(
                            impactQuery.data.delta.projectDurationMonths,
                            {
                              higherIsBetter: false,
                              suffix: " mois",
                            },
                          ).text
                        }
                      </strong>
                    </div>
                  )}

                  <div>
                    <span style={{ color: "#666" }}>Score : </span>
                    <strong
                      style={{
                        color: formatDelta(impactQuery.data.delta.score, {
                          higherIsBetter: true,
                          suffix: " pts",
                        }).color,
                      }}
                    >
                      {
                        formatDelta(impactQuery.data.delta.score, {
                          higherIsBetter: true,
                          suffix: " pts",
                        }).text
                      }
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!option.isActive && (
          <button
            className="button-danger-small"
            onClick={() => {
              if (confirm("Supprimer cette option ?")) {
                onDelete(option.id);
              }
            }}
            disabled={isDeleting}
            style={{ flexShrink: 0 }}
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

function OptionGroupCard({
  group,
  simulationId,
  currentMetrics,
  currentDecisionScore,
}: {
  group: SimulationOptionGroup;
  simulationId: string;
  currentMetrics: SimulationMetrics;
  currentDecisionScore: number | null;
}) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const activateMutation = useMutation({
    mutationFn: (optionId: string) =>
      activateOption(session, simulationId, optionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["option-groups", simulationId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["simulation", simulationId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["option-activation-history", simulationId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["option-group-comparison", simulationId],
      });
    },
    onError: (error: Error) => {
      alert(error.message || "Erreur lors de l'activation");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (optionId: string) =>
      deleteOption(session, simulationId, optionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["option-groups", simulationId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["simulation", simulationId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["option-group-comparison", simulationId],
      });
    },
    onError: (error: Error) => {
      alert(error.message || "Erreur lors de la suppression");
    },
  });

  const comparisonQuery = useQuery({
    queryKey: ["option-group-comparison", simulationId, group.id],
    queryFn: () => getOptionGroupComparison(session, simulationId, group.id),
    enabled: isComparisonOpen,
  });

  if (group.options.length === 0) {
    return null;
  }

  return (
    <div className="panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h3 style={{ marginBottom: "0.35rem" }}>
            {GROUP_TYPE_LABELS[group.type]}
          </h3>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-secondary)",
              fontSize: "0.9rem",
            }}
          >
            Hypothèse active : {group.activeOption?.label ?? "Valeur initiale"}
          </p>
        </div>

        {group.options.length > 0 && (
          <button
            type="button"
            className="button-secondary"
            onClick={() => setIsComparisonOpen((current) => !current)}
          >
            {isComparisonOpen
              ? "Masquer la comparaison"
              : "Comparer les options"}
          </button>
        )}
      </div>

      <div className="stack" style={{ gap: "0.75rem" }}>
        {group.options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            groupType={group.type}
            simulationId={simulationId}
            onActivate={(optionId) => activateMutation.mutate(optionId)}
            onDelete={(optionId) => deleteMutation.mutate(optionId)}
            isActivating={activateMutation.isPending}
            isDeleting={deleteMutation.isPending}
          />
        ))}
      </div>

      {isComparisonOpen && (
        <div style={{ marginTop: "1rem" }}>
          {comparisonQuery.isLoading && <LoadingBlock />}

          {comparisonQuery.isError && (
            <div className="panel error-state">
              <p>Impossible de charger la comparaison pour ce groupe.</p>
            </div>
          )}

          {comparisonQuery.data && (
            <ComparisonTable
              group={group}
              entries={comparisonQuery.data}
              currentMetrics={currentMetrics}
              currentDecisionScore={currentDecisionScore}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function ActiveOptionsSection({
  simulationId,
  currentMetrics,
  currentDecisionScore,
}: Props) {
  const { session } = useAuth();

  const optionGroupsQuery = useQuery({
    queryKey: ["option-groups", simulationId],
    queryFn: () => getOptionGroups(session, simulationId),
  });

  if (optionGroupsQuery.isLoading) {
    return <LoadingBlock />;
  }

  if (optionGroupsQuery.isError) {
    return (
      <div className="panel error-state">
        <p>Erreur lors du chargement des options</p>
      </div>
    );
  }

  const groups = optionGroupsQuery.data ?? [];
  const groupsWithOptions = groups.filter((group) => group.options.length > 0);

  if (groupsWithOptions.length === 0) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Aucune option disponible.
        </p>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-tertiary)",
            marginTop: "0.5rem",
          }}
        >
          Créez des options depuis le journal pour comparer différentes
          hypothèses de prix, travaux ou financement.
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div
        style={{
          marginBottom: "1rem",
          padding: "0.75rem",
          background: "#e3f2fd",
          borderRadius: "4px",
        }}
      >
        <p style={{ color: "#1565c0", fontSize: "0.875rem", margin: 0 }}>
          Le survol donne un aperçu rapide. La comparaison côte à côte permet de
          garder une lecture durable avant d'activer un choix.
        </p>
      </div>

      {groupsWithOptions.map((group) => (
        <OptionGroupCard
          key={group.id}
          group={group}
          simulationId={simulationId}
          currentMetrics={currentMetrics}
          currentDecisionScore={currentDecisionScore}
        />
      ))}
    </div>
  );
}
