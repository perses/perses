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
import { DashboardModel } from '../model/dashboard.model';
import { ToastService } from '../../../shared/service/toast.service';
import { ProjectService } from '../../project.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard-list.component.html',
  styleUrls: ['./dashboard-list.component.scss']
})
export class DashboardListComponent implements OnInit {

  isLoading = false;
  dashboards: DashboardModel[] = [];
  currentProject = '';

  constructor(private readonly service: DashboardService,
              private readonly toastService: ToastService,
              private readonly projectService: ProjectService) {
  }

  ngOnInit(): void {
    this.projectService.getCurrent().subscribe(
      res => {
        this.currentProject = res;
        this.getDashboards();
      }
    );
  }

  private getDashboards(): void {
    this.isLoading = true;
    this.service.list(this.currentProject).subscribe(
      responses => {
        this.dashboards = responses;
        this.isLoading = false;
      },
      error => {
        this.toastService.error(error);
        this.isLoading = false;
      },
    );
  }

  onGoToDashboard(dashboard: DashboardModel): void {
    this.service.currentDashboard = dashboard;
  }
}
