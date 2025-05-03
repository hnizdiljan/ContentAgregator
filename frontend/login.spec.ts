import { test, expect } from '@playwright/test';

test('Login flow works and redirects to home', async ({ page }) => {
  // Log all network requests and responses
  page.on('request', request => {
    console.log('>>', request.method(), request.url());
  });
  page.on('response', response => {
    console.log('<<', response.status(), response.url());
  });

  // Go to login page
  await page.goto('http://localhost:5173/login');

  // Fill in credentials
  await page.getByRole('textbox', { name: 'Email' }).fill('jan.hnizdil@softim.cz');
  await page.getByRole('textbox', { name: 'Password' }).fill('KNT@KX3M&4fL6iLb');

  // Click login and wait for navigation or home page content
  await Promise.all([
    page.waitForURL('**/', { timeout: 5000 }), // Wait for redirect to home
    page.getByRole('button', { name: 'Log in' }).click(),
  ]);

  // Check that we are on the home page
  await expect(page).toHaveURL('http://localhost:5173/');
  await expect(page.getByText('Your RSS Feeds')).toBeVisible();

  // Optionally, check that token is in localStorage
  const token = await page.evaluate(() => localStorage.getItem('auth-storage'));
  console.log('Token in localStorage:', token);
}); 