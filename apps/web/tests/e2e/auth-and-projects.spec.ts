import { expect, test, type Page } from '@playwright/test';

async function loginAsDemoAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Mot de passe').fill('admin123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
}

async function openProjects(page: Page) {
  await page.getByRole('link', { name: 'Projects' }).click();
  await expect(page).toHaveURL(/\/projects$/);
}

test('demo admin lands on dashboard and can open the seeded project', async ({ page }) => {
  await loginAsDemoAdmin(page);

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Projets actifs', { exact: true })).toBeVisible();
  await expect(page.getByText('Comparaison projets')).toBeVisible();

  const projectRow = page.locator('tbody tr', { hasText: 'Immeuble rue Victor Hugo' });
  await expect(projectRow).toBeVisible();
  await expect(projectRow).toContainText(
    /Problematique|A surveiller|OK/,
  );
  await expect(projectRow).toContainText(/%/);
  await projectRow.getByRole('link', { name: 'Voir' }).click();

  await expect(page).toHaveURL(/\/projects\/demo-project-seed-id$/);
  await expect(page.getByRole('heading', { name: 'Immeuble rue Victor Hugo' })).toBeVisible();
  await expect(page.getByText('Resume de pilotage')).toBeVisible();
  await expect(page.getByText('Statut decisionnel')).toBeVisible();

  await openProjects(page);
  const projectCard = page.locator('.project-card', { hasText: 'Immeuble rue Victor Hugo' });
  await expect(projectCard).toBeVisible();
  await expect(projectCard).toContainText(/Problematique|A surveiller|OK/);
});

test('projects empty state guides the user when no project exists yet', async ({ page }) => {
  await loginAsDemoAdmin(page);

  await page.route('**/api/projects', async (route, request) => {
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      });
      return;
    }

    await route.continue();
  });

  await openProjects(page);

  await expect(page.getByText('Aucun projet suivi pour le moment')).toBeVisible();
  await expect(
    page.getByText(
      'Creez votre premier projet pour suivre les lots, les depenses, les documents et les KPI fiables au meme endroit.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Creer mon premier projet' })).toBeVisible();
});

test('admin can create a project from the main flow', async ({ page }) => {
  await loginAsDemoAdmin(page);
  await openProjects(page);

  const suffix = Date.now();
  const projectName = `Projet Playwright ${suffix}`;

  await page.getByRole('link', { name: 'Nouveau projet' }).click();
  await expect(page).toHaveURL(/\/projects\/new$/);

  await page.getByLabel('Nom').fill(projectName);
  await page.getByLabel('Reference').fill(`PW-${suffix}`);
  await page.getByLabel('Ville').fill('Paris');
  await page.getByLabel('Code postal').fill('75011');
  await page.getByLabel('Prix achat').fill('210000');
  await page.getByLabel('Budget travaux').fill('25000');
  await page.getByRole('button', { name: 'Creer le projet' }).click();

  await expect(page).toHaveURL(/\/projects\/[^/]+$/);
  await expect(page.getByRole('heading', { name: projectName })).toBeVisible();
  await expect(page.getByText('Projet cree')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Editer le projet' })).toBeVisible();
});
