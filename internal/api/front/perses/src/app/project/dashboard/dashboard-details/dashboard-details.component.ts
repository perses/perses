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

import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../service/dashboard.service';
import { ToastService } from '../../../shared/service/toast.service';
import { ProjectService } from '../../project.service';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DashboardModel } from '../model/dashboard.model';

@UntilDestroy()
@Component({
  selector: 'app-dashboard-details',
  templateUrl: './dashboard-details.component.html',
  styleUrls: ['./dashboard-details.component.scss']
})
export class DashboardDetailsComponent implements OnInit {
  private readonly dashboardNameParam = 'dashboard';
  isLoading = false;
  dashboardName = '';
  dashboard: DashboardModel = {} as DashboardModel;
  currentProject = '';
  // selectedVariable is the map of the current value of each variable.
  // This map is shared between the dashboard-variable and the dashboard-section.
  selectedVariable: Record<string, string> = {};

  constructor(private readonly service: DashboardService,
              private readonly toastService: ToastService,
              private readonly projectService: ProjectService,
              private readonly route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.isLoading = true;

    this.route.params.subscribe(params => {
      this.dashboardName = params[this.dashboardNameParam];
    });

    this.projectService.getCurrent().pipe(untilDestroyed(this)).subscribe(
      res => {
        this.currentProject = res;
        this.getDashboard();
      }
    );
  }

  private getDashboard(): void {
    this.service.get(this.dashboardName, this.currentProject).pipe(untilDestroyed(this)).subscribe(
      res => {
        this.dashboard = res;
        this.isLoading = false;
      },
      error => {
        this.toastService.error(error);
        this.isLoading = false;
      },
    );
  }
}
