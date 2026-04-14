import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function loginAsDemoAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Mot de passe').fill('admin123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
}

async function createProject(page: Page, suffix: string) {
  const projectName = `Projet Ops ${suffix}`;

  await page.getByRole('link', { name: 'Projects' }).click();
  await expect(page).toHaveURL(/\/projects$/);

  await page.getByRole('link', { name: 'Nouveau projet' }).click();
  await expect(page).toHaveURL(/\/projects\/new$/);

  await page.getByLabel('Nom').fill(projectName);
  await page.getByLabel('Reference').fill(`OPS-${suffix}`);
  await page.getByLabel('Ville').fill('Lyon');
  await page.getByLabel('Code postal').fill('69003');
  await page.getByLabel('Prix achat').fill('185000');
  await page.getByLabel('Budget travaux').fill('32000');
  await page.getByRole('button', { name: 'Creer le projet' }).click();

  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await expect(page.getByRole('heading', { name: projectName })).toBeVisible();

  const projectId = page.url().split('/').at(-1) ?? '';

  return { projectName, projectId };
}

async function createLot(page: Page, suffix: string) {
  const lotName = `Lot ${suffix}`;

  await page.getByRole('link', { name: 'Lots' }).click();
  await expect(page).toHaveURL(/\/lots$/);

  await page.locator('#lot-name').fill(lotName);
  await page.locator('#lot-reference').fill(`LOT-${suffix}`);
  await page.locator('#lot-status').selectOption('AVAILABLE');
  await page.locator('#lot-surface').fill('37');
  await page.locator('#lot-rent').fill('820');
  await page.getByRole('button', { name: 'Ajouter' }).click();

  await expect(page.getByText('Lot ajoute')).toBeVisible();
  await expect(page.locator('tbody tr', { hasText: lotName })).toBeVisible();

  return { lotName };
}

async function createExpense(page: Page, suffix: string) {
  const invoiceNumber = `FAC-PW-${suffix}`;

  await page.getByRole('link', { name: 'Depenses' }).click();
  await expect(page).toHaveURL(/\/expenses$/);

  await page.getByLabel('Numero facture').fill(invoiceNumber);
  await page.getByLabel('Date').fill('2026-03-31');
  await page.getByLabel('Prestataire').fill(`Artisan ${suffix}`);
  await page.getByLabel('Montant HT').fill('1000');
  await page.getByLabel('TVA').fill('200');
  await page.getByLabel('Montant TTC').fill('1200');
  await page.getByLabel('Commentaire').fill('Test Playwright');
  await page.getByLabel('Justificatif').setInputFiles({
    name: `invoice-${suffix}.txt`,
    mimeType: 'text/plain',
    buffer: Buffer.from(`facture ${invoiceNumber}`),
  });
  await page.getByRole('button', { name: 'Ajouter' }).click();

  await expect(page.getByText('Depense ajoutee')).toBeVisible();
  await expect(page.getByText(invoiceNumber)).toBeVisible();
  await expect(page.getByText(`Artisan ${suffix}`)).toBeVisible();

  return { invoiceNumber };
}

test('admin can create a lot inside a project', async ({ page }) => {
  const suffix = uniqueSuffix();

  await loginAsDemoAdmin(page);
  await createProject(page, suffix);
  const { lotName } = await createLot(page, suffix);

  const lotRow = page.locator('tbody tr', { hasText: lotName });
  await expect(lotRow).toBeVisible();
  await expect(lotRow).toContainText('Disponible');
});

test('dashboard highlights portfolio drifts with the main issues to review first', async ({
  page,
}) => {
  await page.route(new RegExp('/api/dashboard/drifts$'), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalProjects: 3,
        projectsWithDrift: 1,
        projectsWithWatch: 1,
        projectsWithoutForecastReference: 1,
        criticalProjects: [
          {
            projectId: 'project-drift',
            name: 'Projet Budget en derive',
            status: 'drift',
            driftScore: 178,
            mainIssues: [
              {
                metricKey: 'worksBudget',
                label: 'Budget travaux',
                status: 'drift',
                deltaPercent: 200,
                deltaValue: 20000,
              },
              {
                metricKey: 'grossYield',
                label: 'Rendement brut',
                status: 'drift',
                deltaPercent: -24.5,
                deltaValue: -1.47,
              },
            ],
          },
          {
            projectId: 'project-watch',
            name: 'Projet Loyer a surveiller',
            status: 'watch',
            driftScore: 51,
            mainIssues: [
              {
                metricKey: 'monthlyRent',
                label: 'Loyer mensuel',
                status: 'watch',
                deltaPercent: -11,
                deltaValue: -110,
              },
            ],
          },
        ],
      }),
    });
  });

  await page.route(new RegExp('/api/dashboard$'), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: {
          activeProjectsCount: 3,
          archivedProjectsCount: 0,
          nonArchivedLotsCount: 4,
          totalExpensesAmount: 30000,
          estimatedMonthlyRentTotal: 1720,
        },
        alerts: [],
        watchlist: [],
        comparison: [
          {
            id: 'project-drift',
            name: 'Projet Budget en derive',
            status: 'WORKS',
            totalCostToDate: 220000,
            estimatedRentTotal: 830,
            grossYieldEstimated: 4.53,
            completeness: {
              score: 100,
              level: 'info',
              label: 'Projet suffisamment renseigne',
              missingItems: [],
              completedCriteriaCount: 8,
              totalCriteriaCount: 8,
            },
            decisionStatus: {
              level: 'warning',
              label: 'A surveiller',
            },
            href: '/projects/project-drift',
          },
        ],
        recentActivity: [],
      }),
    });
  });

  await loginAsDemoAdmin(page);

  const driftPanel = page.locator('.panel').filter({
    has: page.getByRole('heading', { name: 'Derives portefeuille' }),
  });

  await expect(driftPanel).toBeVisible();
  await expect(driftPanel).toContainText('Projets lus');
  await expect(driftPanel).toContainText('Projet Budget en derive');
  await expect(driftPanel).toContainText(/\+20.?000 \u20ac \(\+200 ?%\)/);
  await expect(driftPanel).toContainText('Projet Loyer a surveiller');
  await expect(driftPanel).toContainText(/-110 \u20ac \(-11 ?%\)/);
});

test('new project shows helpful empty states across MVP screens', async ({
  page,
}) => {
  const suffix = uniqueSuffix();

  await loginAsDemoAdmin(page);
  await createProject(page, suffix);
  await expect(page.getByText('Le projet est encore vide')).toBeVisible();
  await expect(page.getByText('Resume de pilotage')).toBeVisible();
  await expect(page.getByText('Statut decisionnel')).toBeVisible();
  await expect(page.getByText('Problematique').first()).toBeVisible();
  await expect(page.getByText('Projet incomplet').first()).toBeVisible();
  await expect(page.getByText('Aucun lot renseigne a ce jour.')).toBeVisible();
  await expect(page.getByText('Aucune depense enregistree a ce jour.')).toBeVisible();
  await expect(page.getByText('Aucun document enregistre')).toBeVisible();
  await expect(page.getByText('Actions recommandees')).toBeVisible();
  await expect(
    page.getByText('Ajoute les premiers lots pour structurer la lecture du projet.'),
  ).toBeVisible();
  await expect(
    page.getByText('Ajoute les premieres depenses pour suivre le cout reel du projet.'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Lots' }).click();
  await expect(page.getByText('Aucun lot enregistre pour ce projet')).toBeVisible();

  await page.getByRole('link', { name: 'Depenses' }).click();
  await expect(page.getByText('Aucune depense enregistree pour ce projet')).toBeVisible();

  await page.getByRole('link', { name: 'Documents' }).click();
  await expect(page.getByText('Aucun document enregistre pour ce projet')).toBeVisible();

  await page.getByRole('link', { name: 'Export CSV' }).click();
  await expect(page.getByText('Aucune depense a exporter')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Exporter les depenses en CSV' }),
  ).toBeDisabled();
});

test('project overview shows a clean empty state when no forecast comparison is available', async ({
  page,
}) => {
  const suffix = uniqueSuffix();

  await loginAsDemoAdmin(page);
  const { projectId } = await createProject(page, suffix);

  await page.route(new RegExp(`/api/projects/${projectId}/overview$`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        project: {
          id: projectId,
          name: `Projet Ops ${suffix}`,
          country: 'FR',
          type: 'OTHER',
          status: 'DRAFT',
        },
        kpis: {
          acquisitionCost: 185000,
          worksBudget: 32000,
          worksExpenses: 0,
          totalExpenses: 0,
          totalCostToDate: 185000,
          worksBudgetDelta: 32000,
          lotsCount: 1,
          totalSurface: 52,
          estimatedRentTotal: 900,
          grossYieldEstimated: 5.4,
        },
        completeness: {
          score: 75,
          level: 'warning',
          label: 'Projet partiellement renseigne',
          missingItems: [],
          completedCriteriaCount: 6,
          totalCriteriaCount: 8,
        },
        decisionStatus: {
          level: 'warning',
          label: 'A surveiller',
        },
        alerts: [],
        suggestions: [],
        forecastComparison: {
          available: false,
          reason:
            "Aucun snapshot previsionnel n'est disponible pour ce projet.",
          metrics: [],
          alerts: [],
          unavailableMetrics: [],
          snapshotLots: [],
        },
        recentExpenses: [],
        recentDocuments: [],
      }),
    });
  });

  await page.goto(`/projects/${projectId}`);

  await expect(page.getByText('Comparaison indisponible')).toBeVisible();
  await expect(
    page.getByText("Aucun snapshot previsionnel n'est disponible pour ce projet."),
  ).toBeVisible();
});

test('project overview renders null delta percent and unavailable metrics without misleading output', async ({
  page,
}) => {
  const suffix = uniqueSuffix();

  await loginAsDemoAdmin(page);
  const { projectId } = await createProject(page, suffix);

  await page.route(new RegExp(`/api/projects/${projectId}/overview$`), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        project: {
          id: projectId,
          name: `Projet Ops ${suffix}`,
          country: 'FR',
          type: 'OTHER',
          status: 'DRAFT',
        },
        kpis: {
          acquisitionCost: 185000,
          worksBudget: 32000,
          worksExpenses: 0,
          totalExpenses: 0,
          totalCostToDate: 185000,
          worksBudgetDelta: 32000,
          lotsCount: 1,
          totalSurface: 52,
          estimatedRentTotal: 900,
          grossYieldEstimated: 5.4,
        },
        completeness: {
          score: 75,
          level: 'warning',
          label: 'Projet partiellement renseigne',
          missingItems: [],
          completedCriteriaCount: 6,
          totalCriteriaCount: 8,
        },
        decisionStatus: {
          level: 'warning',
          label: 'A surveiller',
        },
        alerts: [],
        suggestions: [],
        forecastComparison: {
          available: true,
          reference: {
            conversionDate: '2026-04-03T10:00:00.000Z',
            simulationId: 'sim_mock',
            simulationName: 'Simulation mock',
            strategy: 'RENTAL',
            recommendation: 'interessant',
            decisionScore: 72,
            decisionStatus: 'GOOD',
          },
          metrics: [
            {
              key: 'lotsCount',
              label: 'Nombre de lots',
              unit: 'count',
              forecastValue: 0,
              actualValue: 1,
              deltaValue: 1,
              deltaPercent: null,
              status: 'watch',
              actualLabel: 'Lots non archives du projet',
            },
            {
              key: 'grossYield',
              label: 'Rendement brut',
              unit: 'percent',
              forecastValue: 5.4,
              actualValue: null,
              deltaValue: null,
              deltaPercent: null,
              status: 'unavailable',
              actualLabel: 'Rendement recalcule',
              note:
                'Le rendement comparable reste indisponible tant que cout total actuel et loyers saisis sont insuffisants.',
            },
          ],
          alerts: [],
          unavailableMetrics: [
            {
              key: 'equityRequired',
              label: 'Capital mobilise reel',
              reason: "Le financement reel n'est pas encore structure dans le modele Project V1.",
            },
          ],
          snapshotLots: [],
        },
        recentExpenses: [],
        recentDocuments: [],
      }),
    });
  });

  await page.goto(`/projects/${projectId}`);

  const lotsCard = page
    .locator('.card.kpi-card')
    .filter({
      has: page.locator('.kpi-card__label', {
        hasText: /^Nombre de lots$/,
      }),
    });
  await expect(lotsCard).toContainText('A surveiller');
  await expect(lotsCard).toContainText('Lots non archives du projet');
  await expect(lotsCard).toContainText('+1');
  await expect(lotsCard).not.toContainText('NaN');
  await expect(lotsCard).not.toContainText('undefined');

  const yieldCard = page
    .locator('.card.kpi-card')
    .filter({
      has: page.locator('.kpi-card__label', {
        hasText: /^Rendement brut$/,
      }),
    });
  await expect(yieldCard).toContainText('Non disponible');
  await expect(yieldCard).toContainText(
    'Le rendement comparable reste indisponible tant que cout total actuel et loyers saisis sont insuffisants.',
  );
  await expect(yieldCard).not.toContainText('NaN');
  await expect(yieldCard).not.toContainText('undefined');
});

test('admin can create an expense with justificatif and see the linked document', async ({
  page,
}) => {
  const suffix = uniqueSuffix();

  await loginAsDemoAdmin(page);
  await createProject(page, suffix);
  const { invoiceNumber } = await createExpense(page, suffix);

  await page.getByRole('link', { name: 'Documents' }).click();
  await expect(page).toHaveURL(/\/documents$/);

  await page.getByLabel('Recherche').fill(invoiceNumber);
  await page.locator('#documents-type-filter').selectOption('INVOICE');
  await page.locator('#documents-expense-filter').selectOption({ label: invoiceNumber });
  await expect(page.getByText(`Filtre depense actif : ${invoiceNumber}`)).toBeVisible();
  await expect(page.locator('strong', { hasText: invoiceNumber })).toBeVisible();
  await expect(page.getByText(`invoice-${suffix}.txt`)).toBeVisible();
});

test('admin can upload a standalone document from the documents page', async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const documentTitle = `Photo chantier ${suffix}`;

  await loginAsDemoAdmin(page);
  await createProject(page, suffix);

  await page.getByRole('link', { name: 'Documents' }).click();
  await expect(page).toHaveURL(/\/documents$/);

  await page.getByLabel('Titre').fill(documentTitle);
  await page.getByLabel('Type').last().selectOption('PHOTO');
  await page.getByLabel('Fichier').setInputFiles({
    name: `photo-${suffix}.txt`,
    mimeType: 'text/plain',
    buffer: Buffer.from(`photo ${documentTitle}`),
  });
  await page.getByRole('button', { name: 'Uploader' }).click();

  await expect(page.getByText('Document ajoute')).toBeVisible();
  await page.getByLabel('Recherche').fill(documentTitle);
  await expect(page.locator('strong', { hasText: documentTitle })).toBeVisible();
  await expect(page.getByText(`photo-${suffix}.txt`)).toBeVisible();
});

test('admin can edit and archive a project', async ({ page }) => {
  const suffix = uniqueSuffix();
  const { projectName } = await (async () => {
    await loginAsDemoAdmin(page);
    return createProject(page, suffix);
  })();
  const updatedName = `${projectName} modifie`;

  await page.getByRole('link', { name: 'Editer le projet' }).click();
  await expect(page).toHaveURL(/\/edit$/);

  await page.getByLabel('Nom').fill(updatedName);
  await page.getByLabel('Statut').selectOption('WORKS');
  await page.getByLabel('Budget travaux').fill('45000');
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();

  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await expect(page.getByText('Projet mis a jour')).toBeVisible();
  await expect(page.getByRole('heading', { name: updatedName })).toBeVisible();
  await expect(page.locator('.badge', { hasText: 'Travaux' })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Archiver' }).click();

  await expect(page.getByText('Projet archive')).toBeVisible();
  await expect(page.locator('.badge', { hasText: 'Archive' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Archiver' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Projects' }).click();
  await page.locator('#projects-hide-archived').uncheck();

  const archivedProjectCard = page.locator('.project-card', { hasText: updatedName });
  await expect(archivedProjectCard).toBeVisible();
  await expect(archivedProjectCard).toContainText('Archive');
});

test('admin can edit and archive a lot', async ({ page }) => {
  const suffix = uniqueSuffix();

  await loginAsDemoAdmin(page);
  await createProject(page, suffix);
  const { lotName } = await createLot(page, suffix);

  const lotRow = page.locator('tbody tr', { hasText: lotName });

  await lotRow.getByRole('button', { name: 'Editer' }).click();
  await expect(page.getByRole('heading', { name: 'Editer le lot' })).toBeVisible();
  await expect(page.locator('#lot-status')).toHaveValue('AVAILABLE');
  await expect(page.locator('#lot-rent')).toHaveValue('820');

  await page.locator('#lot-status').selectOption('RENTED');
  await page.locator('#lot-rent').fill('910');
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page.getByText('Lot mis a jour')).toBeVisible();
  await expect(lotRow).toContainText('Loue');
  await expect(lotRow).toContainText('910');

  page.once('dialog', (dialog) => dialog.accept());
  await lotRow.getByRole('button', { name: 'Archiver' }).click();

  await expect(page.locator('tbody tr', { hasText: lotName })).toHaveCount(0);

  await page.locator('#lots-hide-archived').uncheck();
  const archivedLotRow = page.locator('tbody tr', { hasText: lotName });
  await expect(archivedLotRow).toBeVisible();
  await expect(archivedLotRow).toContainText('Archive');
});

test('admin can edit an expense, see overview KPI and export CSV', async ({ page }) => {
  const suffix = uniqueSuffix();

  await loginAsDemoAdmin(page);
  await createProject(page, suffix);
  await createLot(page, suffix);
  const { invoiceNumber } = await createExpense(page, suffix);

  const expenseRow = page.locator('tbody tr', { hasText: invoiceNumber });
  await expenseRow.getByRole('button', { name: 'Editer' }).click();
  await expect(page.getByRole('heading', { name: 'Editer la depense' })).toBeVisible();
  await expect(page.locator('#expense-invoice')).toHaveValue(invoiceNumber);
  await expect(page.locator('#expense-status')).toHaveValue('PENDING');
  await expect(page.locator('#expense-vendor')).toHaveValue(`Artisan ${suffix}`);

  await page.locator('#expense-status').selectOption('PAID');
  await page.locator('#expense-vendor').fill(`Artisan final ${suffix}`);
  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await expect(page.getByText('Depense mise a jour')).toBeVisible();
  await page.locator('#expenses-payment-filter').selectOption('PAID');
  await page.locator('#expenses-search').fill(invoiceNumber);
  await expect(page.locator('tbody tr', { hasText: invoiceNumber })).toContainText(
    `Artisan final ${suffix}`,
  );

  await page.getByRole('link', { name: 'Vue projet' }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+$/);

  await expect(page.getByText('Statut decisionnel')).toBeVisible();
  await expect(page.getByText('OK').first()).toBeVisible();
  await expect(page.getByText('Projet suffisamment renseigne').first()).toBeVisible();
  await expect(
    page.getByText('Frais de notaire / acquisition non renseignes'),
  ).toBeVisible();
  await expect(page.getByText('Pas d\'action immediate')).toBeVisible();
  await expect(page.locator('.kpi-card', { hasText: 'Lots' })).toContainText('1');
  await expect(
    page.locator('.kpi-card', { hasText: 'Depenses enregistrees' }),
  ).toContainText(/1.?200/);
  await expect(
    page.locator('.summary-strip__item', { hasText: 'Loyer mensuel estime' }),
  ).toContainText(/820/);
  await expect(
    page.locator('.kpi-card', { hasText: 'Rendement brut estime' }),
  ).toContainText(/5,?28/);
  await expect(page.getByText(`Artisan final ${suffix}`)).toBeVisible();
  await expect(page.locator('strong', { hasText: invoiceNumber }).first()).toBeVisible();

  await page.getByRole('link', { name: 'Export CSV' }).click();
  await expect(page).toHaveURL(/\/export$/);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exporter les depenses en CSV' }).click(),
  ]);

  await expect(page.getByText('Export CSV lance')).toBeVisible();
  expect(download.suggestedFilename()).toContain('.csv');
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const content = await readFile(downloadPath!, 'utf8');
  expect(content).toContain(invoiceNumber);
  expect(content).toContain(`Artisan final ${suffix}`);
});

test('admin can view settings and add a member', async ({ page }) => {
  const suffix = uniqueSuffix();
  const email = `member-${suffix}@example.com`;

  await loginAsDemoAdmin(page);
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/settings$/);

  await expect(page.getByText('Noroit Invest')).toBeVisible();
  await expect(page.getByText('noroit-invest')).toBeVisible();

  await page.getByLabel('Email').fill(email);
  await page.locator('#member-first').fill('Marie');
  await page.locator('#member-last').fill(`Test ${suffix}`);
  await page.locator('#member-password').fill('member123');
  await page.locator('#member-role').selectOption('READER');
  await page.getByRole('button', { name: 'Ajouter' }).click();

  await expect(page.getByText('Membre ajoute')).toBeVisible();
  const memberRow = page.locator('tbody tr', { hasText: email });
  await expect(memberRow).toBeVisible();
  await expect(memberRow).toContainText('Lecture');
});
