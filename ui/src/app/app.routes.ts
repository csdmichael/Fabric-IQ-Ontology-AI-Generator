import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage)
  },
  {
    path: 'ontologies',
    loadComponent: () => import('./pages/ontology-list/ontology-list.page').then((m) => m.OntologyListPage)
  },
  {
    path: 'ontologies/new',
    loadComponent: () => import('./pages/ontology-editor/ontology-editor.page').then((m) => m.OntologyEditorPage)
  },
  {
    path: 'ontologies/:id',
    loadComponent: () => import('./pages/ontology-editor/ontology-editor.page').then((m) => m.OntologyEditorPage)
  },
  {
    path: 'generate',
    loadComponent: () => import('./pages/generate/generate.page').then((m) => m.GeneratePage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
