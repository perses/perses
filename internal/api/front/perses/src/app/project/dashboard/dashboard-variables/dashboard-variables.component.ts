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

import {Component, Input, OnInit} from '@angular/core';
import {DashboardModel} from '../dashboard.model';
import {DashboardFeedService} from '../dashboard-feed.service';
import {VariableFeedRequest} from '../dashboard-feed.model';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ToastService} from '../../../shared/service/toast.service';

@UntilDestroy()
@Component({
  selector: 'app-dashboard-variables',
  templateUrl: './dashboard-variables.component.html',
  styleUrls: ['./dashboard-variables.component.scss']
})
export class DashboardVariablesComponent implements OnInit {
  @Input()
  dashboard: DashboardModel = {} as DashboardModel;
  variableValues: Record<string, string[]> = {};
  selectedValue: Record<string, string> = {};
  isVariableDetailsExpended = false;

  constructor(private dashboardFeed: DashboardFeedService,
              private toastService: ToastService) {
  }

  ngOnInit(): void {
    this.feedVariable();
  }

  private feedVariable(): void {
    const feedRequest: VariableFeedRequest = {
      datasource: this.dashboard.spec.datasource,
      duration: this.dashboard.spec.duration,
      variables: this.dashboard.spec.variables
    };
    this.dashboardFeed.feedVariables(feedRequest).pipe(untilDestroyed(this)).subscribe(
      responses => {
        for (const response of responses) {
          if (response.err) {
            this.toastService.errorMessage(response.err);
          } else {
            this.variableValues[response.name] = response.values;
            this.selectedValue[response.name] = response.selected;
          }
        }
      },
      error => {
        this.toastService.error(error);
      },
    );
  }

}
