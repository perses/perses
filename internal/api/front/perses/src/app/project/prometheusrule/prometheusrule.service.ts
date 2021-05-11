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
import { BehaviorSubject, Observable } from 'rxjs';
import { PrometheusRuleModel } from './prometheusrule.model';
import { UrlBuilderUtil } from '../../shared/utils/url-builder.util';
import { ErrorHandlingService } from '../../shared/service/error-handling.service';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PrometheusRuleService {
  private readonly resource = 'prometheusrules';
  private readonly currentSubject = new BehaviorSubject<string | undefined>(undefined);

  constructor(private readonly http: HttpClient, private readonly errorHandler: ErrorHandlingService) {
  }

  getCurrent(): Observable<string | undefined> {
    return this.currentSubject.asObservable();
  }

  setCurrent(name: string | undefined): void {
    this.currentSubject.next(name);
  }

  list(project: string): Observable<PrometheusRuleModel[]> {
    const url = new UrlBuilderUtil()
      .setResource(this.resource)
      .setProject(project);

    return this.http.get<PrometheusRuleModel[]>(url.build()).pipe(catchError(this.errorHandler.handleHTTPError));
  }

  get(name: string, project: string): Observable<PrometheusRuleModel> {
    const url = new UrlBuilderUtil()
      .setResource(this.resource)
      .setProject(project)
      .setName(name);
    return this.http.get<PrometheusRuleModel>(url.build()).pipe(catchError(this.errorHandler.handleHTTPError));
  }
}
