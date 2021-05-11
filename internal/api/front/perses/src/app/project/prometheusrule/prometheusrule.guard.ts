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
import { PrometheusRuleService } from './prometheusrule.service';
import { CanActivateReturnType } from '../../shared/utils/types.utils';

@Injectable({
  providedIn: 'root'
})
export class PrometheusRuleGuard implements CanActivate {
  constructor(private readonly resourceService: PrometheusRuleService,
              private readonly projectService: ProjectService,
              private readonly toastService: ToastService,
              private readonly router: Router) {
  }

  /**
   * This guard is used on prometheus rules route to ensure that :
   * - the current prometheus rule (if in the route) is correctly set in the context of the service.
   * - the current prometheus rule (if in the route) is well existing in the backend.
   * Note that permission access will certainly be checked by another guard once the permission layer is available in the backend.
   * this assume that
   * - the guard is activated only for the prometheus rule module
   * - the project module is a parent of the prometheus rule module. Then project guard has been already activated,
   * and we can have access to the current project.
   * @param route (see {@link CanActivate interface})
   * @param state (see {@link CanActivate interface})
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): CanActivateReturnType {
    const current = route.queryParamMap.get('name');
    if (!current) {
      this.resourceService.setCurrent(undefined);
      // the route is accessible even if the name is not present
      return true;
    }
    let currentProject: string | undefined;
    return (this.projectService?.getCurrent() || of()).pipe(
      tap(project => currentProject = project),
      concatMap(project => this.resourceService.get(current, project)),
      catchError((err: CustomError): Observable<boolean> => {
        this.toastService.error(err);
        // If there is an error, that means the resource doesn't exist or we don't have access.
        // So we should simply stop the navigation and go back to the list page.
        // Note that the case "currentProject is undefined" should not happen because the project guard should
        // always be resolved before this guard
        const commands = currentProject ? ['/projects', currentProject, 'prometheusrules'] : ['/'];
        this.router.navigate(commands).then();
        return of(false);
      }),
      map(() => {
        this.resourceService.setCurrent(current);
        return true;
      }),
    );
  }
}
