import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import {
  getSimulation,
  convertToProject,
  type SimulationDecision,
  type SimulationMetrics,
  type SimulationResultSummary,
} from "../api";
import { LoadingBlock } from "../../../shared/ui/loading-block";
import { ErrorState } from "../../../shared/ui/error-state";
import { formatCurrency, formatPercent } from "../../../shared/ui/formatters";
import { OpportunityJournal } from "../components/opportunity-journal";
import { ActiveValuesCard } from "../components/active-values-card";
import { LotsSection } from "../components/lots-section";
import { WorkItemsSection } from "../components/work-items-section";
import { ActiveOptionsSection } from "../components/active-options-section";
import { OptionActivationHistorySection } from "../components/option-activation-history-section";

type TabType =
  | "overview"
  | "lots"
  | "works"
  | "options"
  | "history"
  | "journal";

export function SimulationDetailPage() {
  const { simulationId } = useParams<{ simulationId: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const simulationQuery = useQuery({
    queryKey: ["simulation", simulationId],
    queryFn: () => getSimulation(session, simulationId!),
    enabled: !!simulationId,
  });

  const convertMutation = useMutation({
    mutationFn: () => convertToProject(session, simulationId!),
    onSuccess: (data: { projectId: string }) => {
      void queryClient.invalidateQueries({
        queryKey: ["simulation", simulationId],
      });
      alert("Simulation convertie en projet avec succès");
      navigate(`/projects/${data.projectId}`);
    },
    onError: (error: Error) => {
      alert(error.message || "Une erreur est survenue");
    },
  });

  if (simulationQuery.isLoading) {
    return <LoadingBlock />;
  }

  if (simulationQuery.isError) {
    return (
      <ErrorState
        error={simulationQuery.error}
        title="Simulation introuvable"
      />
    );
  }

  const simulation = simulationQuery.data!;
  const result = simulation.resultSummaryJson as SimulationResultSummary | null;
  const metrics = (result?.metrics ?? {}) as SimulationMetrics;
  const decision = result?.decision as SimulationDecision | undefined;
  const notaryFees =
    result?.notaryFees ?? simulation.notaryFeesBreakdown ?? null;
  const financingPlan = result?.financingPlan;

  const getDecisionColor = (status?: string) => {
    if (status === "GOOD") return "green";
    if (status === "REVIEW") return "orange";
    if (status === "RISKY") return "red";
    return "gray";
  };

  const propertyTypeLabel =
    simulation.propertyType === "NEUF_VEFA" ? "Neuf / VEFA" : "Ancien";

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>{simulation.name}</h1>
          <div className="page-subtitle">
            {simulation.strategy === "FLIP" ? "Revente" : "Locatif"} •{" "}
            {simulation.financingMode === "CASH" ? "Cash" : "Crédit"} •{" "}
            {propertyTypeLabel}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link
            className="button-secondary"
            to={`/simulations/folders/${simulation.folderId}`}
          >
            Retour au dossier
          </Link>
          {!simulation.convertedProjectId && (
            <>
              <Link
                className="button-secondary"
                to={`/simulations/${simulationId}/edit`}
              >
                Éditer
              </Link>
              <button
                className="button"
                onClick={() => convertMutation.mutate()}
                disabled={convertMutation.isPending}
              >
                {convertMutation.isPending
                  ? "Conversion..."
                  : "Convertir en projet"}
              </button>
            </>
          )}
        </div>
      </header>

      {simulation.convertedProjectId && (
        <section
          className="panel"
          style={{ background: "#e8f5e9", padding: "1rem" }}
        >
          <p>
            ✅ Cette simulation a été convertie en projet.{" "}
            <Link to={`/projects/${simulation.convertedProjectId}`}>
              Voir le projet
            </Link>
          </p>
        </section>
      )}

      {/* Tabs Navigation */}
      <div
        style={{
          borderBottom: "2px solid #e0e0e0",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            style={{
              padding: "0.75rem 1.5rem",
              background: activeTab === "overview" ? "#2196f3" : "transparent",
              color: activeTab === "overview" ? "white" : "#666",
              border: "none",
              borderBottom:
                activeTab === "overview"
                  ? "2px solid #2196f3"
                  : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === "overview" ? "bold" : "normal",
              transition: "all 0.2s",
            }}
          >
            Vue d'ensemble
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lots")}
            style={{
              padding: "0.75rem 1.5rem",
              background: activeTab === "lots" ? "#2196f3" : "transparent",
              color: activeTab === "lots" ? "white" : "#666",
              border: "none",
              borderBottom:
                activeTab === "lots"
                  ? "2px solid #2196f3"
                  : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === "lots" ? "bold" : "normal",
              transition: "all 0.2s",
            }}
          >
            Lots
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("works")}
            style={{
              padding: "0.75rem 1.5rem",
              background: activeTab === "works" ? "#2196f3" : "transparent",
              color: activeTab === "works" ? "white" : "#666",
              border: "none",
              borderBottom:
                activeTab === "works"
                  ? "2px solid #2196f3"
                  : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === "works" ? "bold" : "normal",
              transition: "all 0.2s",
            }}
          >
            Travaux
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("options")}
            style={{
              padding: "0.75rem 1.5rem",
              background: activeTab === "options" ? "#2196f3" : "transparent",
              color: activeTab === "options" ? "white" : "#666",
              border: "none",
              borderBottom:
                activeTab === "options"
                  ? "2px solid #2196f3"
                  : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === "options" ? "bold" : "normal",
              transition: "all 0.2s",
            }}
          >
            Options
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            style={{
              padding: "0.75rem 1.5rem",
              background: activeTab === "history" ? "#2196f3" : "transparent",
              color: activeTab === "history" ? "white" : "#666",
              border: "none",
              borderBottom:
                activeTab === "history"
                  ? "2px solid #2196f3"
                  : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === "history" ? "bold" : "normal",
              transition: "all 0.2s",
            }}
          >
            Historique
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("journal")}
            style={{
              padding: "0.75rem 1.5rem",
              background: activeTab === "journal" ? "#2196f3" : "transparent",
              color: activeTab === "journal" ? "white" : "#666",
              border: "none",
              borderBottom:
                activeTab === "journal"
                  ? "2px solid #2196f3"
                  : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === "journal" ? "bold" : "normal",
              transition: "all 0.2s",
            }}
          >
            Journal
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="stack">
          {/* Active Values Card */}
          {simulation.activeValues && (
            <ActiveValuesCard activeValues={simulation.activeValues} />
          )}

          <section className="panel">
            <h2>Résultats de la simulation</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <div>
                <div style={{ fontWeight: "bold" }}>Score décisionnel</div>
                <div
                  style={{
                    fontSize: "2rem",
                    color: getDecisionColor(decision?.status),
                  }}
                >
                  {decision?.score ?? "N/A"}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: "bold" }}>Recommandation</div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    color: getDecisionColor(decision?.status),
                  }}
                >
                  {decision?.recommendation ?? "N/A"}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: "bold" }}>Coût total projet</div>
                <div style={{ fontSize: "1.5rem" }}>
                  {formatCurrency(metrics.totalProjectCost ?? 0)}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: "bold" }}>Fonds propres requis</div>
                <div style={{ fontSize: "1.5rem" }}>
                  {formatCurrency(metrics.equityRequired ?? 0)}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: "bold" }}>
                  Frais de notaire estimés
                </div>
                <div style={{ fontSize: "1.5rem" }}>
                  {formatCurrency(notaryFees?.total ?? simulation.notaryFees)}
                </div>
              </div>
            </div>

            {simulation.strategy === "FLIP" && (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontWeight: "bold" }}>Marge brute</div>
                <div style={{ fontSize: "1.5rem" }}>
                  {metrics.grossMargin !== null &&
                  metrics.grossMargin !== undefined
                    ? formatCurrency(metrics.grossMargin)
                    : "N/A"}
                </div>
                {metrics.marginRate !== null &&
                  metrics.marginRate !== undefined && (
                    <div>Taux de marge : {metrics.marginRate.toFixed(2)}%</div>
                  )}
              </div>
            )}

            {simulation.strategy === "RENTAL" && (
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontWeight: "bold" }}>Rendement brut</div>
                <div style={{ fontSize: "1.5rem" }}>
                  {metrics.grossYield !== null &&
                  metrics.grossYield !== undefined
                    ? `${metrics.grossYield.toFixed(2)}%`
                    : "N/A"}
                </div>
                {metrics.monthlyCashDelta !== null &&
                  metrics.monthlyCashDelta !== undefined && (
                    <div>
                      Cash flow mensuel :{" "}
                      {formatCurrency(metrics.monthlyCashDelta)}
                    </div>
                  )}
              </div>
            )}

            {decision?.warnings && decision.warnings.length > 0 && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "#fff3cd",
                }}
              >
                <div style={{ fontWeight: "bold" }}>⚠️ Points d'attention</div>
                <ul style={{ marginTop: "0.5rem" }}>
                  {decision.warnings.map((warning: string, idx: number) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Frais de notaire estimés</h2>
            <p style={{ color: "#666", marginTop: "0.5rem" }}>
              Estimation indicative fondée sur le type de bien, le département,
              le mobilier déclaré et les débours saisis.
            </p>
            {notaryFees ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold" }}>Base taxable</div>
                  <div>{formatCurrency(notaryFees.taxableBase)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>
                    Droits / taxe de publicité foncière
                  </div>
                  <div>{formatCurrency(notaryFees.transferTaxes)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>
                    Contribution de sécurité immobilière
                  </div>
                  <div>{formatCurrency(notaryFees.securityContribution)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>
                    Émoluments du notaire
                  </div>
                  <div>{formatCurrency(notaryFees.notaryEmoluments)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>Débours estimés</div>
                  <div>{formatCurrency(notaryFees.disbursements)}</div>
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>Total estimé</div>
                  <div style={{ fontSize: "1.25rem" }}>
                    {formatCurrency(notaryFees.total)}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ marginTop: "1rem" }}>
                Le détail des frais n’est pas disponible pour cette simulation.
              </p>
            )}

            {notaryFees && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "#f6f8fa",
                }}
              >
                <div style={{ fontWeight: "bold" }}>Taux appliqués</div>
                <div style={{ marginTop: "0.5rem" }}>
                  Département {notaryFees.appliedRates.departmentCode} :{" "}
                  {formatPercent(
                    notaryFees.appliedRates.departmentTransferTaxRate,
                  )}
                </div>
                {notaryFees.appliedRates.municipalTransferTaxRate > 0 && (
                  <div>
                    Part communale :{" "}
                    {formatPercent(
                      notaryFees.appliedRates.municipalTransferTaxRate,
                    )}
                  </div>
                )}
                <div>
                  Frais d’assiette / recouvrement :{" "}
                  {formatPercent(notaryFees.appliedRates.collectionRate)}
                </div>
                <div>
                  CSI : {formatPercent(notaryFees.appliedRates.securityContributionRate)}{" "}
                  avec minimum de{" "}
                  {formatCurrency(
                    notaryFees.appliedRates.securityContributionMinimum,
                  )}
                </div>
                <div style={{ marginTop: "0.75rem", fontWeight: "bold" }}>
                  Barème des émoluments
                </div>
                <ul style={{ marginTop: "0.5rem" }}>
                  {notaryFees.appliedRates.emolumentBrackets.map((bracket) => (
                    <li key={`${bracket.from}-${bracket.to ?? "plus"}`}>
                      Tranche {formatCurrency(bracket.from)} -{" "}
                      {bracket.to === null
                        ? "au-delà"
                        : formatCurrency(bracket.to)}{" "}
                      : {formatCurrency(bracket.taxableAmount)} à{" "}
                      {formatPercent(bracket.rate)} ={" "}
                      {formatCurrency(bracket.amount)}
                    </li>
                  ))}
                </ul>
                {simulation.isFirstTimeBuyer && (
                  <div style={{ marginTop: "0.75rem", color: "#8a6d3b" }}>
                    Statut primo-accédant enregistré pour préparer la logique
                    réglementaire, sans modulation automatique appliquée pour le
                    moment.
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Plan de financement</h2>
            {financingPlan ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold" }}>Emplois</div>
                  <div>Prix d'achat : {formatCurrency(financingPlan.uses.purchasePrice)}</div>
                  <div>
                    Frais de notaire : {formatCurrency(financingPlan.uses.notaryFees)}
                  </div>
                  <div>Travaux : {formatCurrency(financingPlan.uses.worksBudget)}</div>
                  <div>Réserve : {formatCurrency(financingPlan.uses.bufferAmount)}</div>
                  <div style={{ marginTop: "0.5rem", fontWeight: "bold" }}>
                    Total emplois : {formatCurrency(financingPlan.uses.total)}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>Ressources prévues</div>
                  <div>Apport : {formatCurrency(financingPlan.resources.downPayment)}</div>
                  <div>Prêt : {formatCurrency(financingPlan.resources.loanAmount)}</div>
                  <div style={{ marginTop: "0.5rem", fontWeight: "bold" }}>
                    Total ressources :{" "}
                    {formatCurrency(financingPlan.resources.total)}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: "bold" }}>
                    Besoin de trésorerie estimé
                  </div>
                  <div style={{ fontSize: "1.5rem" }}>
                    {formatCurrency(financingPlan.requiredCash)}
                  </div>
                  <div style={{ marginTop: "0.75rem" }}>
                    Reste à couvrir :{" "}
                    {formatCurrency(financingPlan.remainingGap)}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ marginTop: "1rem" }}>
                Le plan de financement n’est pas disponible.
              </p>
            )}
          </section>

          <section className="panel">
            <h2>Détails</h2>
            <dl>
              <dt>Prix d'achat</dt>
              <dd>{formatCurrency(simulation.purchasePrice)}</dd>
              <dt>Type de bien</dt>
              <dd>{propertyTypeLabel}</dd>
              <dt>Département</dt>
              <dd>{simulation.departmentCode ?? "—"}</dd>
              <dt>Frais de notaire estimés</dt>
              <dd>{formatCurrency(notaryFees?.total ?? simulation.notaryFees)}</dd>
              <dt>Mobilier déduit</dt>
              <dd>{formatCurrency(simulation.furnitureValue)}</dd>
              <dt>Débours estimés</dt>
              <dd>{formatCurrency(simulation.estimatedDisbursements)}</dd>
              <dt>Primo-accédant</dt>
              <dd>{simulation.isFirstTimeBuyer ? "Oui" : "Non"}</dd>
              <dt>Budget travaux</dt>
              <dd>{formatCurrency(simulation.worksBudget)}</dd>
              {simulation.bufferAmount && (
                <>
                  <dt>Réserve de sécurité</dt>
                  <dd>{formatCurrency(simulation.bufferAmount)}</dd>
                </>
              )}
              {simulation.address && (
                <>
                  <dt>Adresse</dt>
                  <dd>{simulation.address}</dd>
                </>
              )}
              {simulation.notes && (
                <>
                  <dt>Notes</dt>
                  <dd>{simulation.notes}</dd>
                </>
              )}
            </dl>
          </section>
        </div>
      )}

      {activeTab === "lots" && <LotsSection simulationId={simulationId!} />}

      {activeTab === "works" && (
        <WorkItemsSection
          simulationId={simulationId!}
          workItems={simulation.workItems || []}
          worksBudget={simulation.worksBudget}
        />
      )}

      {activeTab === "options" && (
        <section className="panel">
          <h2>Options actives</h2>
          <ActiveOptionsSection
            simulationId={simulationId!}
            currentMetrics={metrics}
            currentDecisionScore={
              typeof decision?.score === "number" ? decision.score : null
            }
          />
        </section>
      )}

      {activeTab === "history" && (
        <section className="panel">
          <h2>Historique des activations</h2>
          <OptionActivationHistorySection simulationId={simulationId!} />
        </section>
      )}

      {activeTab === "journal" && (
        <section className="panel">
          <OpportunityJournal simulationId={simulationId!} />
        </section>
      )}
    </div>
  );
}
