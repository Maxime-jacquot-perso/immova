import { expect, test, type Page } from '@playwright/test';

async function loginAsDemoAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Mot de passe').fill('admin123');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
}

test('admin can invite a user from the admin users screen', async ({ page }) => {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const email = `invite-${suffix}@example.com`;

  await loginAsDemoAdmin(page);
  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: 'Utilisateurs' })).toBeVisible();

  await page.getByLabel('Email').last().fill(email);
  await page
    .getByLabel('Organisation')
    .selectOption({ label: 'Demo Invest · demo-org' });
  await page.getByLabel('Role membership').selectOption('MANAGER');
  await page.getByLabel('Motif').last().fill('Invitation depuis le back-office');
  await page.getByRole('button', { name: 'Inviter un utilisateur' }).click();

  await expect(page.getByText('Invitation envoyee')).toBeVisible();
  await page.getByLabel('Recherche').fill(email);
  await expect(page.locator('tbody tr', { hasText: email })).toBeVisible();
});

test('setup-password shows an invalid state when the token cannot be used', async ({
  page,
}) => {
  await page.route('**/api/auth/invitations/verify*', async (route) => {
    await route.fulfill({
      status: 410,
      contentType: 'application/json',
      body: JSON.stringify({
        message: "Cette invitation a expire",
      }),
    });
  });

  await page.goto('/setup-password?token=expired-token');

  await expect(page.getByText('Invitation indisponible')).toBeVisible();
  await expect(page.getByText('Cette invitation a expire')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Invitation invalide' })).toBeVisible();
});

test('setup-password lets the invitee define a password and redirects to login', async ({
  page,
}) => {
  await page.route('**/api/auth/invitations/verify*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        email: 'invitee@example.com',
        membershipRole: 'MANAGER',
        expiresAt: '2026-04-02T09:00:00.000Z',
        requiresPasswordSetup: true,
        organization: {
          id: 'org_demo',
          name: 'Demo Invest',
          slug: 'demo-org',
        },
      }),
    });
  });

  await page.route('**/api/auth/invitations/accept', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        email: 'invitee@example.com',
        requiresPasswordSetup: true,
        organization: {
          id: 'org_demo',
          name: 'Demo Invest',
          slug: 'demo-org',
        },
      }),
    });
  });

  await page.goto('/setup-password?token=valid-token');

  await expect(page.getByRole('heading', { name: 'Definir votre mot de passe' })).toBeVisible();
  await page.locator('#setup-password').fill('invitation123');
  await page.locator('#setup-password-confirm').fill('invitation123');
  await page.getByRole('button', { name: 'Activer mon compte' }).click();

  await expect(page).toHaveURL(/\/login\?invitation=accepted/);
  await expect(page.getByText('Acces active')).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveValue('invitee@example.com');
});
