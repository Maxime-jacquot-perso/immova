import { expect, test } from '@playwright/test';

test('login links to forgot-password and the request stays neutral', async ({
  page,
}) => {
  await page.route('**/api/auth/forgot-password', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message:
          'Si un compte existe pour cet email, vous allez recevoir un lien de réinitialisation.',
      }),
    });
  });

  await page.goto('/login');
  await page.getByRole('link', { name: 'Mot de passe oublié ?' }).click();

  await expect(page).toHaveURL(/\/forgot-password$/);
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByRole('button', { name: 'Recevoir un lien' }).click();

  await expect(page.getByText('Demande envoyée')).toBeVisible();
  await expect(
    page.getByText(
      'Si un compte existe pour cet email, vous allez recevoir un lien de réinitialisation.',
    ),
  ).toBeVisible();
});

test('reset-password shows an unavailable state when the token is expired', async ({
  page,
}) => {
  await page.route('**/api/auth/reset-password/verify*', async (route) => {
    await route.fulfill({
      status: 410,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Ce lien de réinitialisation a expiré',
      }),
    });
  });

  await page.goto('/reset-password?token=expired-token');

  await expect(page.getByText('Lien indisponible')).toBeVisible();
  await expect(
    page.getByText('Ce lien de réinitialisation a expiré'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Recevoir un nouveau lien' }),
  ).toBeVisible();
});

test('reset-password updates the password and redirects back to login', async ({
  page,
}) => {
  await page.route('**/api/auth/reset-password/verify*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        expiresAt: '2026-04-17T15:00:00.000Z',
      }),
    });
  });

  await page.route('**/api/auth/reset-password', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
      }),
    });
  });

  await page.goto('/reset-password?token=valid-token-12345');

  await expect(
    page.getByRole('heading', { name: 'Définir un nouveau mot de passe' }),
  ).toBeVisible();
  await page.getByLabel('Nouveau mot de passe').fill('reset123');
  await page.getByLabel('Confirmer le mot de passe').fill('reset123');
  await page
    .getByRole('button', { name: 'Mettre à jour mon mot de passe' })
    .click();

  await expect(page.getByText('Mot de passe mis à jour')).toBeVisible();
  await expect(page).toHaveURL(/\/login\?passwordReset=success/, {
    timeout: 5_000,
  });
  await expect(page.getByText('Mot de passe réinitialisé')).toBeVisible();
});
