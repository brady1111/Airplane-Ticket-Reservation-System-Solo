import { Routes } from '@angular/router';
import { UserHomePage } from './user-home-page/user-home-page';
import { CreateAccount } from './create-account-page/create-account-page';

export const routes: Routes = [
  { path: '', component: UserHomePage },
  { path: 'create-account', component: CreateAccount }
];
