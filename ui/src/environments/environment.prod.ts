export const environment = {
  production: true,
  apiUrl: '',
  auth: {
    tenantId: 'b158173c-91f6-4f99-b5e9-aa9bcb463863',
    clientId: '',
    authority: 'https://login.microsoftonline.com/b158173c-91f6-4f99-b5e9-aa9bcb463863',
    redirectUri: 'https://ui-fabriciq-b3.azurewebsites.net',
    postLogoutRedirectUri: 'https://ui-fabriciq-b3.azurewebsites.net',
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
