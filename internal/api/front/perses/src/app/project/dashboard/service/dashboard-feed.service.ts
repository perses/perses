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
import { ErrorHandlingService } from '../../../shared/service/error-handling.service';
import {
  SectionFeedRequest,
  SectionFeedResponse,
  VariableFeedRequest,
  VariableFeedResponse
} from '../model/dashboard-feed.model';
import { Observable } from 'rxjs';
import { UrlBuilderUtil } from '../../../shared/utils/url-builder.util';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DashboardFeedService {
  private readonly resource = 'feed';

  constructor(private readonly http: HttpClient, private readonly errorHandler: ErrorHandlingService) {
  }

  feedSections(request: SectionFeedRequest): Observable<SectionFeedResponse[]> {
    const url = new UrlBuilderUtil()
      .setResource(`${this.resource}/sections`);

    return this.http.post<SectionFeedResponse[]>(url.build(), request).pipe(catchError(this.errorHandler.handleHTTPError));
  }

  feedVariables(request: VariableFeedRequest): Observable<VariableFeedResponse[]> {
    const url = new UrlBuilderUtil().setResource(`${this.resource}/variables`);
    return this.http.post<VariableFeedResponse[]>(url.build(), request).pipe(catchError(this.errorHandler.handleHTTPError));
  }
}
