import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageComponent, PageContentComponent, PageSubContent } from './page';


@NgModule({
  declarations: [PageComponent, PageContentComponent, PageSubContent],
  exports: [PageComponent, PageContentComponent, PageSubContent],
  imports: [
    CommonModule
  ]
})
export class PageModule {
}
