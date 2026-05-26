// cypress/e2e/login.spec.js
describe('Login Page', () => {
  it('should load and allow login', () => {
    cy.visit('/login');
    // Assuming the login form has inputs with data-testids
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('Password123');
    cy.get('[data-testid="login-button"]').click();
    // Verify redirect to dashboard
    cy.url().should('include', '/');
    cy.contains('Dashboard').should('be.visible');
  });
});
