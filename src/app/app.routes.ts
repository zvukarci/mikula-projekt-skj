import { Routes } from '@angular/router';
import { AuthGuard } from '@/app/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'chats',
    loadComponent: () =>
      import('./components/chats/chats.component').then(
        (m) => m.ChatsComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
];
