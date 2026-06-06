// cypress/e2e/b2b_promo.spec.js
describe('B2B Promo Flow & Payment Method Restrictions', () => {
  beforeEach(() => {
    // 1. Visit login page and login as cashier
    cy.visit('/login');
    
    // Fill credentials
    cy.get('input[placeholder="Username"]').type('haaland');
    cy.get('input[placeholder="••••••••"]').type('robot9');
    
    cy.contains('AUTHORIZE ACCESS').click();
    
    // Verify redirect to dashboard/home page
    cy.url().should('include', '/');
  });

  it('should auto-apply B2B billing and hide manual B2B button when promo code ABC20 is checked', () => {
    cy.visit('/kasir');

    // Click on a menu item card to open ItemCustomizationModal
    cy.get('.group.cursor-pointer.bg-card').first().click();

    // Confirm customization modal to add item to cart (button contains 'Tambah')
    cy.contains('Tambah').click();

    // Click checkout/bayar button to open checkout modal
    cy.contains('Lanjutkan Pembayaran').click();

    // Verify payment methods in the checkout modal
    // B2B Billing should not be in the payment methods grid by default
    cy.contains('B2B Billing').should('not.exist');

    // Enter promo code "ABC20"
    cy.get('input[placeholder="KODE PROMO"]').type('ABC20');
    cy.contains('Cek').click();

    // Promo validation success check
    cy.contains('B2B Kupon ABC20 berhasil digunakan').should('be.visible');

    // Verify payment method has automatically switched to B2B Billing
    // And selected partner PT ABC is active
    cy.get('select').should('contain', 'PT ABC');
    cy.contains('Selesaikan Pembayaran').should('be.visible');
  });

  it('should not display internal payment methods on the guest menu page', () => {
    // Visit Guest Menu page (using the seeded tenant ID fba884db-967a-4e9f-bad8-79211f6b2cc6)
    cy.visit('/guest/fba884db-967a-4e9f-bad8-79211f6b2cc6/table/5');

    // Click a menu card plus button to open customization modal
    cy.get('button[id^="btn-tambah-"]').first().click();
    
    // Confirm add to cart
    cy.contains('Tambah').click();

    // Open cart drawer
    cy.get('#btn-buka-keranjang').click();
    
    // Go to checkout form
    cy.contains('Checkout Sekarang').click();

    // Verify internal billing options are absent
    cy.contains('B2B Billing').should('not.exist');
    cy.contains('Complimentary').should('not.exist');
    cy.contains('Staff Benefit').should('not.exist');

    // Only public billing methods should exist
    cy.contains('Tunai').should('be.visible');
    cy.contains('QRIS').should('be.visible');
  });
});
