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
import { ScreenSizeService } from '../../shared/service/screen-size.service';
import { ProjectService } from '../project.service';
import { ProjectModel } from '../project.model';
import { ToastService } from '../../shared/service/toast.service';

@Component({
  selector: 'app-project-template',
  templateUrl: './project-template.component.html',
  styleUrls: ['./project-template.component.scss']
})
export class ProjectTemplateComponent implements OnInit {
  sidebarLinks = [
    {url: 'dashboards', icon: 'insert_chart', label: 'Dashboards'}
  ];

  projectList: ProjectModel[] = [];

  constructor(public screenSize: ScreenSizeService,
              public projectService: ProjectService,
              private toastService: ToastService) {
  }

  ngOnInit(): void {
    this.getProjectList();
  }

  private getProjectList(): void {
    this.projectService.list().subscribe(
      result => {
        this.projectList = result;
      },
      error => {
        this.toastService.error(error);
      }
    );
  }
}
