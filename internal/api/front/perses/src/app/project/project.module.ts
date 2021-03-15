import { NgModule } from '@angular/core';
import { ProjectTemplateComponent } from './project-template/project-template.component';
import { ProjectRoutingModule } from './project-routing.module';
import { MatSidenavModule } from '@angular/material/sidenav';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [ProjectTemplateComponent],
  imports: [
    SharedModule,
    ProjectRoutingModule,
    MatSidenavModule
  ]
})
export class ProjectModule {
}
