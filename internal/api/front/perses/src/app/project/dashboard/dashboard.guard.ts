// Copyright 2021 Amadeus s.a.s
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ProjectService } from '../project.service';
import { catchError, concatMap, map, tap } from 'rxjs/operators';
import { ToastService } from '../../shared/service/toast.service';
import { CustomError } from '../../shared/model/error.model';
import { DashboardService } from './service/dashboard.service';
import { CanActivateReturnType } from '../../shared/utils/types.utils';

@Injectable({
  providedIn: 'root'
})
export class DashboardGuard implements CanActivate {
  constructor(private readonly dashboardService: DashboardService,
              private readonly projectService: ProjectService,
              private readonly toastService: ToastService,
              private readonly router: Router) {
  }

  /**
   * This guard is used to trigger the load of the list of available dashboards
   * for the current project into the cache as soon as the dashboard module is
   * reached.
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): CanActivateReturnType {
    let currentProject: string | undefined;
    return (this.projectService.getCurrent() || of()).pipe(
      tap(project => currentProject = project),
      concatMap(project => this.dashboardService.list(project)),
      catchError((err: CustomError): Observable<boolean> => {
        this.toastService.error(err);
        // If there is an error, that means the resource doesn't exist or we don't have access.
        // So we should simply stop the navigation and go back to the project page.
        // Note that the case "currentProject is undefined" should not happen because the project guard should
        // always be resolved before this guard
        const commands = currentProject ? ['/projects', currentProject] : ['/'];
        this.router.navigate(commands).then();
        return of(false);
      }),
      map(() => {
        return true;
      }),
    );
  }
}
