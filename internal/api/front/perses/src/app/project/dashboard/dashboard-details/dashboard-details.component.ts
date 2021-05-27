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
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DashboardModel } from '../dashboard.model';

@UntilDestroy()
@Component({
  selector: 'app-dashboard-details',
  templateUrl: './dashboard-details.component.html',
  styleUrls: ['./dashboard-details.component.scss']
})
export class DashboardDetailsComponent implements OnInit {
  isLoading = false;
  currentProject = '';
  dashboard: DashboardModel = {} as DashboardModel;

  constructor(private dashboardService: DashboardService,
              private readonly toastService: ToastService,
              private readonly projectService: ProjectService) {
    this.projectService.getCurrent().pipe(untilDestroyed(this)).subscribe(
      current => {
        this.currentProject = current;
        this.getDashboard();
      }
    );
  }

  ngOnInit(): void {
  }

  private getDashboard(): void {
    this.isLoading = true;
    this.dashboardService.get('SimpleLineChart', this.currentProject).pipe(untilDestroyed(this)).subscribe(
      response => {
        this.dashboard = response;
        this.isLoading = false;
      },
      error => {
        this.toastService.error(error);
        this.isLoading = false;
      },
    );
  }
}
