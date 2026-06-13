export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  auth: {
    tenantId: 'b158173c-91f6-4f99-b5e9-aa9bcb463863',
    clientId: '',
    authority: 'https://login.microsoftonline.com/b158173c-91f6-4f99-b5e9-aa9bcb463863',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',
    scopes: ['openid', 'profile', 'email'],
    allowedDomain: '@MngEnvMCAP829495.onmicrosoft.com'
  }
};
