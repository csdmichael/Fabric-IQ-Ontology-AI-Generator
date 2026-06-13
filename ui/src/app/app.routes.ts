import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage)
  },
  {
    path: 'ontologies',
    canActivate: [authGuard, roleGuard],
    data: { anyPermissions: ['ontology:read'] },
    loadComponent: () => import('./pages/ontology-list/ontology-list.page').then((m) => m.OntologyListPage)
  },
  {
    path: 'ontologies/new',
    canActivate: [authGuard, roleGuard],
    data: { anyPermissions: ['ontology:create'] },
    loadComponent: () => import('./pages/ontology-editor/ontology-editor.page').then((m) => m.OntologyEditorPage)
  },
  {
    path: 'ontologies/:id',
    canActivate: [authGuard, roleGuard],
    data: { anyPermissions: ['ontology:read'] },
    loadComponent: () => import('./pages/ontology-editor/ontology-editor.page').then((m) => m.OntologyEditorPage)
  },
  {
    path: 'generate',
    canActivate: [authGuard, roleGuard],
    data: { anyPermissions: ['agent:ontology-generator'] },
    loadComponent: () => import('./pages/generate/generate.page').then((m) => m.GeneratePage)
  },
  {
    path: 'settings',
    canActivate: [authGuard, roleGuard],
    data: { anyPermissions: ['datasource:read'] },
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage)
  },
  {
    path: 'architecture',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/architecture/architecture.page').then((m) => m.ArchitecturePage)
  },
  {
    path: 'users',
    canActivate: [authGuard, roleGuard],
    data: { minRole: 'app_owner' },
    loadComponent: () => import('./pages/users/users.page').then((m) => m.UsersPage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
