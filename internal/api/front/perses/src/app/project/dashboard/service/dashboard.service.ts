// Copyright 2021 The Perses Authors
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
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { DashboardModel } from '../model/dashboard.model';
import { UrlBuilderUtil } from '../../../shared/utils/url-builder.util';
import { ErrorHandlingService } from '../../../shared/service/error-handling.service';
import LRUCache from 'lru-cache';
import { CustomError } from '../../../shared/model/error.model';

class Cache {
  private static maxAge = 15 * 60 * 1000; // 15min
  private dashboardList: LRUCache<string, DashboardModel>;

  constructor() {
    this.dashboardList = new LRUCache<string, DashboardModel>(Cache.maxAge);
  }

  setDashboardList(projects: DashboardModel[]): void {
    for (const project of projects) {
      this.dashboardList.set(project.metadata.name, project);
    }
  }

  getDashboardList(): DashboardModel[] {
    return this.dashboardList.values();
  }

  getDashboard(name: string): DashboardModel | undefined {
    return this.dashboardList.get(name);
  }
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly resource = 'dashboards';
  private readonly cache = new Cache();

  constructor(private readonly http: HttpClient, private readonly errorHandler: ErrorHandlingService) {
  }

  /*
   * list returns the list of available dashboards for the current project.
   * if the cache was already warmed up it returns the cached values, else
   * it queries the backend to fill the cache
   */
  list(project: string): Observable<DashboardModel[]> {
    const dashboardList = this.cache.getDashboardList();
    if (dashboardList.length > 0) {
      return of(dashboardList);
    }

    const url = new UrlBuilderUtil()
      .setResource(this.resource)
      .setProject(project);
    return this.http.get<DashboardModel[]>(url.build())
      .pipe(
        catchError(this.errorHandler.handleHTTPError),
        map((result: DashboardModel[]) => {
          this.cache.setDashboardList(result);
          return result;
        })
      );
  }

  /*
   * get returns the DashboardModel object corresponding to the provided
   * dashboard name & project.
   * If the value is available in the cache it returns it, otherwise it triggers
   * a cache reload. Throws an error if the dashboard model is still not found
   * after this.
   */
  get(name: string, project: string): Observable<DashboardModel> {
    const dashboard = this.cache.getDashboard(name);
    if (dashboard) {
      return of(dashboard);
    }

    return this.list(project).pipe(
      mergeMap(() => {
        const result = this.cache.getDashboard(name);
        if (!result) {
          const error = {
            status: 404,
            statusText: 'Not found',
            message: `dashboard '${name}' doesn't exist in project '${project}' or you don't have the right to access it`
          } as CustomError;
          return throwError(error);
        }
        return of(result);
      }),
    );

  }
}
