import { useState } from 'react';
import { formatCurrency } from '../../../shared/ui/formatters';
import type { ActiveValues } from '../api';

interface ActiveValuesCardProps {
  activeValues: ActiveValues;
}

export function ActiveValuesCard({ activeValues }: ActiveValuesCardProps) {
  const [showWorksBreakdown, setShowWorksBreakdown] = useState(false);
  const [showRentBreakdown, setShowRentBreakdown] = useState(false);

  const hasWorksBreakdown =
    activeValues.worksCostBreakdown && activeValues.worksCostBreakdown.length > 0;

  // Pour le loyer, on vérifie si la source contient "LOTS"
  const hasRentFromLots = activeValues.activeMonthlyRentSource.includes('LOTS');

  return (
    <div
      className="panel"
      style={{
        background: 'linear-gradient(to right, #e3f2fd, #f5f5f5)',
        borderLeft: '4px solid #2196f3',
      }}
    >
      <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>📊</span>
        <span>Valeurs utilisées pour le calcul décisionnel</span>
      </h2>
      <p style={{ margin: '0.5rem 0 1.5rem 0', color: '#666', fontSize: '0.875rem' }}>
        Ces valeurs alimentent le score, les métriques et la recommandation de cette simulation.
      </p>

      <div className="stack" style={{ gap: '1.5rem' }}>
        {/* Prix d'achat */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Prix d'acquisition :
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {formatCurrency(activeValues.activePurchasePrice)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
            {activeValues.activePurchasePriceSource}
          </div>
        </div>

        {/* Budget travaux */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Coût des travaux :
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {formatCurrency(activeValues.activeWorksCost)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
            {activeValues.activeWorksCostSource}
          </div>

          {hasWorksBreakdown && (
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowWorksBreakdown(!showWorksBreakdown)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2196f3',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.875rem',
                  textDecoration: 'underline',
                }}
              >
                {showWorksBreakdown ? 'Masquer détail ▲' : 'Voir détail ▼'}
              </button>

              {showWorksBreakdown && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Décomposition par poste :
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {activeValues.worksCostBreakdown.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.5rem' }}>
                        <div><strong>{item.itemName}</strong></div>
                        <div style={{ color: '#666' }}>
                          {formatCurrency(item.cost)}
                          {item.source === 'option' && item.providerName && (
                            <span> • Option active : {item.providerName}</span>
                          )}
                          {item.source === 'initial' && (
                            <span> • Estimation initiale</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loyer mensuel */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Loyer mensuel total :
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {formatCurrency(activeValues.activeMonthlyRent)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
            {activeValues.activeMonthlyRentSource}
          </div>

          {hasRentFromLots && (
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowRentBreakdown(!showRentBreakdown)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2196f3',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.875rem',
                  textDecoration: 'underline',
                }}
              >
                {showRentBreakdown ? 'Masquer détail ▲' : 'Voir détail ▼'}
              </button>

              {showRentBreakdown && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    background: 'white',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ marginBottom: '0.5rem', color: '#666' }}>
                    Le loyer total est calculé à partir de la somme des loyers des lots définis.
                    Consultez l'onglet "Lots" pour voir le détail par lot et les loyers non renseignés.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Financement */}
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
            Financement :
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            {activeValues.activeFinancing.mode === 'CASH' && 'Cash'}
            {activeValues.activeFinancing.mode === 'LOAN' &&
              activeValues.activeFinancing.rate !== null &&
              activeValues.activeFinancing.durationMonths !== null &&
              `Crédit ${activeValues.activeFinancing.rate.toFixed(1)}% sur ${Math.floor(activeValues.activeFinancing.durationMonths / 12)} ans`}
            {activeValues.activeFinancing.mode === 'LOAN' &&
              (activeValues.activeFinancing.rate === null ||
                activeValues.activeFinancing.durationMonths === null) &&
              'Crédit (détails manquants)'}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
            Source : {activeValues.activeFinancing.source}
          </div>
          {activeValues.activeFinancing.mode === 'LOAN' &&
            activeValues.activeFinancing.loanAmount !== null && (
              <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                Montant emprunté : {formatCurrency(activeValues.activeFinancing.loanAmount)}
              </div>
            )}
        </div>
      </div>

      <div
        style={{
          marginTop: '1.5rem',
          padding: '0.75rem',
          background: 'white',
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#666',
          borderLeft: '3px solid #2196f3',
        }}
      >
        ℹ️ Ces valeurs alimentent directement le score décisionnel, les métriques financières
        (rendement, marge, mensualité) et la recommandation finale de cette simulation.
      </div>
    </div>
  );
}
