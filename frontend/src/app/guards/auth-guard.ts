import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

//route guard to check whether a customer is logged in
export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  //check whether the customer has an active Django session
  return authService.checkLoginStatus().pipe(
    map((response) => {

      //allow access if the customer is logged in
      if (response.authenticated) {
        return true;
      }

      //redirect to login if the customer is not logged in
      return router.createUrlTree(['/login']);
    }),

    //handle errors, including 401 Unauthorized
    catchError((error) => {
      return of(router.createUrlTree(['/login']));
    })
  );
};
