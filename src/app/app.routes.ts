import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  standalone: true,
  template: '<h1 style="color: blue;">ROUTING WORKS!</h1>',
})
export class TestComponent {}

import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';
import { Login } from './pages/auth/login/login';

export const routes: Routes = [
    { path: 'test', component: TestComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full'},
    {
        path: 'login',
        component: Login
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'categories',
        loadComponent: () => import('./pages/categories/categories-list/categories-list').then(m => m.CategoriesList),
        canActivate: [roleGuard],
        data: { role: 'Administrador' }
    },
    {
        path: 'suppliers',
        loadComponent: () => import('./pages/suppliers/suppliers-list/suppliers-list').then(m => m.SuppliersList),
        canActivate: [roleGuard],
        data: { role: 'Administrador' }
    },
    {
        path: 'products',
        loadComponent: () => import('./pages/products/products-list/products-list').then(m => m.ProductsList),
        canActivate: [authGuard]
    },
    {
        path: 'users',
        loadComponent: () => import('./pages/users/users-list/users-list').then(m => m.UsersList),
        canActivate: [roleGuard],
        data: { role: 'Administrador' }
    },
    {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent),
        canActivate: [authGuard]
    },
    {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings').then(m => m.SettingsComponent),
        canActivate: [roleGuard],
        data: { role: 'Administrador' }
    },
    {
        path: '**', redirectTo: 'login'
    }
];
