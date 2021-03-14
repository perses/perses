import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectTemplateComponent } from './project-template/project-template.component';
import {ProjectRoutingModule} from "./project-routing.module";
import {MatSidenavModule} from "@angular/material/sidenav";



@NgModule({
  declarations: [ProjectTemplateComponent],
  imports: [
    CommonModule,
    ProjectRoutingModule,
    MatSidenavModule,
  ]
})
export class ProjectModule { }
