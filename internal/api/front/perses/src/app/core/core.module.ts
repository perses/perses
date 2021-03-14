import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TemplateComponent} from './template/template.component';
import {MatToolbarModule} from "@angular/material/toolbar";
import {RouterModule} from "@angular/router";


@NgModule({
  declarations: [TemplateComponent],
  exports: [TemplateComponent],
  imports: [
    CommonModule,
    MatToolbarModule,
    RouterModule
  ]
})
export class CoreModule {
}
