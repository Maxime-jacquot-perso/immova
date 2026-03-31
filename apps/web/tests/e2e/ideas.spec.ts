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

test('pilot admin can use the ideas page, see beta validation and vote', async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const ideaTitle = `Idee Playwright ${suffix}`;

  await loginAsDemoAdmin(page);

  await page.getByRole('link', { name: 'Idees produit' }).click();
  await expect(page).toHaveURL(/\/ideas$/);

  await expect(page.getByRole('heading', { name: 'Boite a idees' })).toBeVisible();
  await expect(page.getByText('Les votes nous aident a prioriser')).toBeVisible();
  await expect(page.getByText('Validation beta en cours')).toBeVisible();
  await expect(
    page
      .locator('section')
      .filter({ hasText: 'Validation beta en cours' })
      .getByRole('heading', {
        name: 'Checklist beta pour la validation avant release',
      }),
  ).toBeVisible();

  await page.getByLabel('Titre').fill(ideaTitle);
  await page.getByLabel('Description').fill(
    "Verifier rapidement la page idees sans alourdir l'application.",
  );
  await page.getByRole('button', { name: "Publier l'idee" }).click();

  await expect(page.getByText('Idee ajoutee')).toBeVisible();
  const createdIdeaCard = page.locator('.idea-card', { hasText: ideaTitle }).first();
  await expect(createdIdeaCard).toBeVisible();

  await createdIdeaCard.getByRole('button', { name: 'Voter' }).click();
  await expect(page.getByText('Vote ajoute')).toBeVisible();
  await expect(
    createdIdeaCard.getByRole('button', { name: 'Retirer mon vote' }),
  ).toBeVisible();
});
