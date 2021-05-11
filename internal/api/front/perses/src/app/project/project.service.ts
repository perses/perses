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
import { HttpClient } from '@angular/common/http';
import { ErrorHandlingService } from '../shared/service/error-handling.service';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { UrlBuilderUtil } from '../shared/utils/url-builder.util';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ProjectModel } from './project.model';
import LRUCache from 'lru-cache';
import { CustomError } from '../shared/model/error.model';

class Cache {
  private static maxAge = 15 * 60 * 1000; // 15min
  private projectList: LRUCache<string, ProjectModel>;

  constructor() {
    this.projectList = new LRUCache<string, ProjectModel>(Cache.maxAge);
  }

  setProjectList(projects: ProjectModel[]): void {
    for (const project of projects) {
      this.projectList.set(project.metadata.name, project);
    }
  }

  getProjectList(): ProjectModel[] {
    return this.projectList.values();
  }

  getProject(name: string): ProjectModel | undefined {
    return this.projectList.get(name);
  }

}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly projectResource = 'projects';
  private readonly currentProjectSubject = new BehaviorSubject<string>('');
  private readonly cache = new Cache();

  constructor(private readonly http: HttpClient, private readonly errorHandler: ErrorHandlingService) {
  }

  public getCurrent(): Observable<string> {
    return this.currentProjectSubject.asObservable();
  }

  setCurrent(project: string): void {
    this.currentProjectSubject.next(project);
  }

  list(): Observable<ProjectModel[]> {
    const projectList = this.cache.getProjectList();
    if (projectList.length > 0) {
      return of(projectList);
    }
    const url = new UrlBuilderUtil()
      .setResource(this.projectResource);

    return this.http.get<ProjectModel[]>(url.build())
      .pipe(
        catchError(this.errorHandler.handleHTTPError),
        map((result: ProjectModel[]) => {
          this.cache.setProjectList(result);
          return result;
        })
      );
  }

  get(name: string): Observable<ProjectModel> {
    const project = this.cache.getProject(name);
    if (project) {
      return of(project);
    }

    return this.list().pipe(
      mergeMap(() => {
        const result = this.cache.getProject(name);
        if (!result) {
          const error = {
            status: 404,
            statusText: 'Not found',
            message: `project '${name}' doesn't exist or you don't have the right to access it`
          } as CustomError;
          return throwError(error);
        }
        return of(result);
      }),
    );

  }
}
