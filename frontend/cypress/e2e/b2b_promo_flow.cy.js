// frontend/cypress/e2e/b2b_promo_flow.cy.js
/// <reference types="cypress" />

describe('B2B Promo Flow and UI Restrictions', () => {
  const promoCode = 'ABC20';

  it('Guest should not see B2B payment option', () => {
    // Visit guest menu page
    cy.visit('/guest'); // Adjust path as needed
    // Verify B2B toggle/button is absent for guest users
    cy.get('button').contains('B2B Payment').should('not.exist');
  });

  it('Apply B2B promo code as logged-in B2B partner and verify discount', () => {
    // Login as a test B2B partner (using preset credentials)
    cy.visit('/login');
    cy.get('input[name="email"]').type('partner@example.com');
    cy.get('input[name="password"]').type('password123'); // Use test password
    cy.get('button[type="submit"]').click();

    // Ensure login succeeded and dashboard loads
    cy.url().should('include', '/dashboard');

    // Navigate to POS checkout page
    cy.visit('/pos');

    // Add an item to cart (assumes a menu item with data-test-id="menu-item-1")
    cy.get('[data-test-id="menu-item-1"]').click();

    // Open checkout dialog
    cy.get('button').contains('Checkout').click();

    // Apply promo code
    cy.get('input[name="promo_code"]').type(promoCode);
    cy.get('button').contains('Apply').click();

    // Verify discount applied (assuming total price element with data-test-id="total-price")
    cy.get('[data-test-id="total-price"]').should(($price) => {
      const text = $price.text();
      // Expect the price to be reduced by 20,000 (Rp 20.000)
      // This is a simple check; adapt to currency format if needed
      const numeric = parseInt(text.replace(/[^0-9]/g, ''), 10);
      expect(numeric).to.be.lessThan(100000); // Example: original price 120,000
    });

    // Verify B2B payment method appears after applying promo
    cy.get('button').contains('B2B Payment').should('exist');
    cy.get('button').contains('B2B Payment').click();

    // Complete payment
    cy.get('button').contains('Confirm Payment').click();
    cy.contains('Payment successful').should('be.visible');
  });
});
