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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DashboardVariable } from '../../model/dashboard.model';
import { DashboardFeedService } from '../../service/dashboard-feed.service';
import { VariableFeedRequest } from '../../model/dashboard-feed.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastService } from '../../../../shared/service/toast.service';
import { EventFeedService } from '../../service/event-feed.service';
import { MatSelectChange } from '@angular/material/select';

@UntilDestroy()
@Component({
  selector: 'app-dashboard-variables',
  templateUrl: './dashboard-variables.component.html',
  styleUrls: ['./dashboard-variables.component.scss']
})
export class DashboardVariablesComponent implements OnInit {
  @Input()
  datasource = '';
  @Input()
  duration = '';
  @Input()
  variables: Record<string, DashboardVariable> = {};
  @Input()
  selectedValue: Record<string, string> = {};
  @Output()
  selectedValueChange = new EventEmitter<Record<string, string>>();
  previousSelectedValue: Record<string, string> = {};
  variableValues: Record<string, string[]> = {};
  isVariableDetailsExpended = false;
  isLoading = false;

  constructor(private dashboardFeed: DashboardFeedService,
              private eventFeed: EventFeedService,
              private toastService: ToastService) {
  }

  ngOnInit(): void {
    this.feedVariable();
  }

  selectValueChange(key: string, event: MatSelectChange): void {
    this.copySelectedValue();
    this.selectedValue[key] = event.value;
    this.selectedValueChange.emit(this.selectedValue);
    this.feedVariable();
  }

  private feedVariable(): void {
    this.isLoading = true;
    const feedRequest: VariableFeedRequest = {
      datasource: this.datasource,
      duration: this.duration,
      variables: this.variables,
      selected_variables: this.selectedValue,
      previous_selected_variables: this.previousSelectedValue,
    };
    this.dashboardFeed.feedVariables(feedRequest).pipe(untilDestroyed(this)).subscribe(
      responses => {
        let isError = false;
        for (const response of responses) {
          if (response.err) {
            isError = true;
            this.toastService.errorMessage(response.err);
          } else {
            this.variableValues[response.name] = response.values;
            this.selectedValue[response.name] = response.selected;
          }
        }
        if (!isError) {
          this.eventFeed.variableHasBeenChanged();
        }
        this.isLoading = false;
      },
      error => {
        this.toastService.error(error);
        this.isLoading = false;
      },
    );
  }

  private copySelectedValue(): void {
    this.previousSelectedValue = {};
    for (const [k, v] of Object.entries(this.selectedValue)) {
      this.previousSelectedValue[k] = v;
    }
  }

}
