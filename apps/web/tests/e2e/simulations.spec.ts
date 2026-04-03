import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2,
  }).format(value)} €`;
}

async function loginAsDemoAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Mot de passe').fill('admin123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
}

async function getAuthHeaders(request: APIRequestContext) {
  const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
    data: {
      email: 'admin@example.com',
      password: 'admin123',
    },
  });

  expect(loginResponse.ok()).toBeTruthy();
  const session = (await loginResponse.json()) as {
    accessToken: string;
  };

  return {
    Authorization: `Bearer ${session.accessToken}`,
  };
}

async function createFolder(
  request: APIRequestContext,
  suffix: string,
) {
  const authHeaders = await getAuthHeaders(request);

  const folderResponse = await request.post(
    'http://localhost:3000/api/simulation-folders',
    {
      headers: authHeaders,
      data: {
        name: `Dossier Playwright ${suffix}`,
      },
    },
  );

  expect(folderResponse.ok()).toBeTruthy();
  return (await folderResponse.json()) as { id: string };
}

async function createSimulationWithPurchaseOption(
  request: APIRequestContext,
  suffix: string,
) {
  const authHeaders = await getAuthHeaders(request);
  const folder = await createFolder(request, suffix);

  const simulationName = `Simulation Playwright ${suffix}`;
  const simulationResponse = await request.post(
    'http://localhost:3000/api/simulations',
    {
      headers: authHeaders,
      data: {
        folderId: folder.id,
        name: simulationName,
        strategy: 'FLIP',
        propertyType: 'ANCIEN',
        departmentCode: '75',
        purchasePrice: 250000,
        worksBudget: 50000,
        financingMode: 'CASH',
        targetResalePrice: 360000,
      },
    },
  );

  expect(simulationResponse.ok()).toBeTruthy();
  const simulation = (await simulationResponse.json()) as { id: string };

  const groupResponse = await request.post(
    `http://localhost:3000/api/simulations/${simulation.id}/option-groups`,
    {
      headers: authHeaders,
      data: {
        type: 'PURCHASE_PRICE',
        label: "Prix d'achat",
      },
    },
  );

  expect(groupResponse.ok()).toBeTruthy();
  const group = (await groupResponse.json()) as { id: string };

  const optionLabel = 'Offre 240k';
  const optionResponse = await request.post(
    `http://localhost:3000/api/simulations/${simulation.id}/options`,
    {
      headers: authHeaders,
      data: {
        groupId: group.id,
        label: optionLabel,
        valueJson: {
          price: 240000,
        },
        source: 'MANUAL',
      },
    },
  );

  expect(optionResponse.ok()).toBeTruthy();

  return {
    simulationId: simulation.id,
    simulationName,
    optionLabel,
  };
}

async function createSimulationForConversion(
  request: APIRequestContext,
  suffix: string,
  options?: {
    archived?: boolean;
  },
) {
  const authHeaders = await getAuthHeaders(request);
  const folder = await createFolder(request, suffix);
  const simulationName = `Simulation conversion ${suffix}`;

  const simulationResponse = await request.post(
    'http://localhost:3000/api/simulations',
    {
      headers: authHeaders,
      data: {
        folderId: folder.id,
        name: simulationName,
        address: '18 rue de la Conversion',
        strategy: 'RENTAL',
        propertyType: 'ANCIEN',
        departmentCode: '68',
        purchasePrice: 185000,
        worksBudget: 24000,
        financingMode: 'LOAN',
        downPayment: 40000,
        loanAmount: 185000,
        interestRate: 3.5,
        loanDurationMonths: 240,
        targetMonthlyRent: 980,
      },
    },
  );

  expect(simulationResponse.ok()).toBeTruthy();
  const simulation = (await simulationResponse.json()) as { id: string };

  const lotResponse = await request.post(
    `http://localhost:3000/api/simulations/${simulation.id}/lots`,
    {
      headers: authHeaders,
      data: {
        name: `Lot conversion ${suffix}`,
        type: 'APARTMENT',
        surface: 52,
        estimatedRent: 980,
      },
    },
  );

  expect(lotResponse.ok()).toBeTruthy();

  if (options?.archived) {
    const archiveResponse = await request.post(
      `http://localhost:3000/api/simulations/${simulation.id}/archive`,
      {
        headers: authHeaders,
      },
    );

    expect(archiveResponse.ok()).toBeTruthy();
  }

  return {
    simulationId: simulation.id,
    simulationName,
    lotName: `Lot conversion ${suffix}`,
  };
}

test('simulation form structures the input and lets the user switch loan amount mode', async ({
  page,
  request,
}) => {
  const suffix = uniqueSuffix();
  const folder = await createFolder(request, suffix);

  await loginAsDemoAdmin(page);
  await page.goto(`/simulations/new?folderId=${folder.id}`);

  await expect(page.getByRole('heading', { name: 'Bien & contexte' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Acquisition' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Financement' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Exploitation & securite' }),
  ).toBeVisible();

  await page.getByLabel('Nom').fill(`Simulation auto pret ${suffix}`);
  await page.getByLabel("Prix d'achat").fill('250000');
  await page.locator('#departmentCode').fill('67');
  await page.getByLabel('Budget travaux').fill('50000');
  await page.locator('#estimatedDisbursements').fill('1000');
  await page.getByLabel('Apport').fill('40000');

  const financingPanel = page.locator('.panel', { hasText: 'Financement' });
  const loanAmountInput = page.getByLabel('Montant du pret');

  await expect(loanAmountInput).toHaveValue('261000');
  await expect(financingPanel.getByText('Auto')).toBeVisible();

  await loanAmountInput.fill('210000');
  await expect(financingPanel.getByText('Manuel')).toBeVisible();

  await financingPanel.getByRole('button', { name: 'Recalculer' }).click();
  await expect(loanAmountInput).toHaveValue('261000');
  await expect(financingPanel.getByText('Auto')).toBeVisible();
});

test('activating an option refreshes the simulation overview', async ({
  page,
  request,
}) => {
  const suffix = uniqueSuffix();
  const simulation = await createSimulationWithPurchaseOption(request, suffix);

  await loginAsDemoAdmin(page);
  await page.goto(`/simulations/${simulation.simulationId}`);

  await expect(
    page.getByRole('heading', { name: simulation.simulationName }),
  ).toBeVisible();

  const activeValuesPanel = page.locator('.panel', {
    hasText: 'Valeurs utilisées pour le calcul décisionnel',
  });
  const resultsPanel = page.locator('.panel', {
    hasText: 'Résultats de la simulation',
  });

  await expect(activeValuesPanel).toContainText(formatCurrency(250000));
  await expect(activeValuesPanel).toContainText('INITIAL');
  await expect(resultsPanel).toContainText(formatCurrency(319441));

  await page.getByRole('button', { name: 'Options' }).click();
  await expect(page.getByRole('heading', { name: 'Options actives' })).toBeVisible();

  await page.locator('input[type="radio"]').first().click();
  await expect(page.getByText('Actuel')).toBeVisible();

  await page.getByRole('button', { name: "Vue d'ensemble" }).click();

  await expect(activeValuesPanel).toContainText(formatCurrency(240000));
  await expect(activeValuesPanel).toContainText(`OPTION: ${simulation.optionLabel}`);
  await expect(resultsPanel).toContainText(formatCurrency(308719.25));
});

test('conversion preview shows transferred data before creating the project', async ({
  page,
  request,
}) => {
  const suffix = uniqueSuffix();
  const simulation = await createSimulationForConversion(request, suffix);

  await loginAsDemoAdmin(page);
  await page.goto(`/simulations/${simulation.simulationId}`);

  await page.getByRole('button', { name: 'Prévisualiser la conversion' }).click();

  await expect(page.getByText('Preview de conversion')).toBeVisible();
  await expect(page.getByText('Champs transferes au projet')).toBeVisible();
  await expect(page.getByText('Snapshot previsionnel fige')).toBeVisible();
  await expect(page.getByText('Lots qui seront crees')).toBeVisible();
  await expect(page.getByText(simulation.lotName)).toBeVisible();

  await page.getByRole('button', { name: 'Confirmer la conversion' }).click();

  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await expect(page.getByText('Simulation convertie')).toBeVisible();
  await expect(page.getByText('Previsionnel vs reel')).toBeVisible();
  await expect(page.getByText('Simulation source')).toBeVisible();
});

test('conversion preview blocks archived simulations', async ({
  page,
  request,
}) => {
  const suffix = uniqueSuffix();
  const simulation = await createSimulationForConversion(request, suffix, {
    archived: true,
  });

  await loginAsDemoAdmin(page);
  await page.goto(`/simulations/${simulation.simulationId}`);

  await page.getByRole('button', { name: 'Prévisualiser la conversion' }).click();

  await expect(page.getByText('Blocage de conversion')).toBeVisible();
  await expect(
    page.getByText(
      'La simulation est archivee. Reactivez-la ou dupliquez-la avant de creer un projet.',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Confirmer la conversion' }),
  ).toBeDisabled();
});
