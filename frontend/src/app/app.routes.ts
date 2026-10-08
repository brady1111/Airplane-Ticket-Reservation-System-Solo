import { Routes } from '@angular/router';
import { UserHomePage } from './user-home-page/user-home-page';
import { CreateAccount } from './create-account-page/create-account-page';
import { LoginPage } from './login-page/login-page';
import { CustomerHomePage } from './customer-home-page/customer-home-page';

export const routes: Routes = [
  { path: '', component: UserHomePage },
  { path: 'create-account', component: CreateAccount },
  { path: 'login', component: LoginPage },
  { path: 'customer-home-page', component: CustomerHomePage }
];
