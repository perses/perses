import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ProjectService } from './project.service';
import { catchError, map } from 'rxjs/operators';
import { ToastService } from '../shared/service/toast.service';
import { CustomError } from '../shared/model/error.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectGuard implements CanActivate {
  constructor(private projectService: ProjectService,
              private toastService: ToastService,
              private router: Router) {
  }

  // canActivate will give the right to navigate to the sub module of the project module only if:
  // * the current user has the access to the project find in the route
  // * the project exists.
  // Note that permission access will certainly be checked by another guard once the permission layer is available in the backend.
  canActivate(
    route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | boolean {
    // this assume that the guard is activated only for child Module of the project module.
    const currentProject = route.parent?.paramMap.get('project');
    if (!currentProject) {
      return false;
    }
    return this.projectService.get(currentProject).pipe(
      catchError((err: CustomError): Observable<boolean> => {
        this.toastService.error(err);
        // if there is an error, that means the project doesn't exist or we don't have access.
        // So we should simply stop the navigation and go back to the home page.
        this.router.navigate(['/']);
        return of(false);
      }),
      map(() => {
        this.projectService.setCurrentProject(currentProject);
        return true;
      }),
    );
  }
}
