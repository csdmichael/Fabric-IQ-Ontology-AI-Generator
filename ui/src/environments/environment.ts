export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  generateTimeoutMs: 60000,
  auth: {
    tenantId: 'b158173c-91f6-4f99-b5e9-aa9bcb463863',
    clientId: '',
    authority: 'https://login.microsoftonline.com/b158173c-91f6-4f99-b5e9-aa9bcb463863',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',
    scopes: ['openid', 'profile', 'email'],
    allowedDomain: '@mngenvmcap829495.onmicrosoft.com',
    internalDomains: ['mngenvmcap829495.onmicrosoft.com', 'microsoft.com']
  },
  branding: {
    systemName: 'Fabric IQ Ontology AI Generator',
    shortName: 'Fabric IQ',
    tagline: 'Design, bind, and ship business ontologies for Microsoft Fabric.',
    supportEmail: 'myaacoub@microsoft.com'
  }
};
