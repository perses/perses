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
import { Observable } from 'rxjs';
import { DashboardSpec } from './dashboard.model';
import { DashboardFeedModel } from './dashboardfeed.model';
import { UrlBuilderUtil } from '../../shared/utils/url-builder.util';
import { ErrorHandlingService } from '../../shared/service/error-handling.service';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DashboardFeedService {
  private datapointsResource = 'feed/sections';

  constructor(private http: HttpClient, private errorHandler: ErrorHandlingService) {
  }

  get(spec: DashboardSpec): Observable<DashboardFeedModel[]> {
    const url = new UrlBuilderUtil()
      .setResource(this.datapointsResource);

    return this.http.post<DashboardFeedModel[]>(url.build(), spec).pipe(catchError(this.errorHandler.handleHTTPError));
  }
}
