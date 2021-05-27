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
import { DashboardFeedService } from '../service/dashboard-feed.service';
import { DashboardFeedModel } from '../model/dashboard-feed.model';
import { NgxChartLineChartModel } from '../model/ngxcharts.model';
import { NgxChartPoint } from '../model/ngxcharts.model';
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
  chartDataMap = new Map<string, NgxChartLineChartModel[]>();
  currentProject = '';

  // TEMP static options data for graph display
  view: [number, number] = [600, 400];
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'Time';
  showYAxisLabel = true;
  yAxisLabel = 'Value';
  timeline = true;
  colorScheme = {
    domain: ['#9370DB', '#87CEFA', '#FA8072', '#FF7F50', '#90EE90', '#9370DB']
  };

  constructor(private readonly service: DashboardService,
              private readonly feedService: DashboardFeedService,
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

        if (Object.keys(this.service.currentDashboard).length !== 0
        && this.service.currentDashboard.metadata.name === this.dashboardName) {
          this.dashboard = this.service.currentDashboard;
          this.feedDashboard();
        } else {
          this.getDashboard();
        }
      }
    );
  }

  private getDashboard(): void {
    this.service.get(this.dashboardName, this.currentProject).pipe(untilDestroyed(this)).subscribe(
      res => {
        this.dashboard = res;
        this.feedDashboard();
      },
      error => {
        this.toastService.error(error);
        this.isLoading = false;
      },
    );
  }

  private feedDashboard(): void {
    this.feedService.feedSections(this.dashboard.spec).subscribe(
      responses => {
        this.convertDashboardFeeds(responses);
        this.isLoading = false;
      },
      error => {
        this.toastService.error(error);
        this.isLoading = false;
      },
    );
  }

  private convertDashboardFeeds(dashboardFeeds: DashboardFeedModel[]): void {
    for (const section of dashboardFeeds) {
      for (const panel of section.panels) {
        const ngxPanelData: NgxChartLineChartModel[] = [];
        for (const query of panel.results) {
          let i = 0;
          for (const serie of query.result) {
            const ngxSerieData: NgxChartLineChartModel = {
              name: serie.metric.__name__ + ' - ' + i,
              series: []
            };
            for (const [timestamp, value] of serie.values) {
              const datapoint: NgxChartPoint = {name: String(timestamp), value: Number(value)};
              ngxSerieData.series.push(datapoint);
            }
            ngxPanelData[i] = ngxSerieData;
            i++;
            this.chartDataMap.set(section.name + '_' +  panel.name, ngxPanelData);
          }
        }
      }
    }
  }

  public getChartData(sectionName: string, panelName: string) {
    return this.chartDataMap.get(`${sectionName}_${panelName}`)
  }
}
