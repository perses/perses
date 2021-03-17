import { ChangeDetectionStrategy, Component, Directive, ViewEncapsulation } from '@angular/core';

@Directive({
  selector: 'app-page-sub-content, [app-page-sub-content], [appPageSubContent]'
})
// tslint:disable-next-line:directive-class-suffix
export class PageSubContent {
}

@Component({
  selector: 'app-page',
  exportAs: 'appPage',
  templateUrl: 'page.html',
  styleUrls: ['page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageComponent {

}

@Component({
  selector: 'app-page-content',
  exportAs: 'appPageContent',
  templateUrl: 'page-content.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageContentComponent {
}
