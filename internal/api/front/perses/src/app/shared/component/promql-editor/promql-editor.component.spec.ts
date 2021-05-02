import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { PromqlEditorComponent } from './promql-editor.component';
import { ThemeService } from '../../service/theme.service';

describe('PromqlEditorCodemirrorComponent', () => {
  let component: PromqlEditorComponent;
  let fixture: ComponentFixture<PromqlEditorComponent>;

  const mockThemeService = new ThemeService();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PromqlEditorComponent],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
      ],
    }).compileComponents();
  });

  /**
   * Having the component instantiation inside the fakeAsync + a tick of the same time as the debounceTime value is making sure that the
   * debounceTime will not be blocking the test.
   * -> Sources:
   * Angular github issue: https://github.com/angular/angular/issues/25457
   * StackOverflow example: https://stackoverflow.com/questions/41641995/angular2-testing-call-with-a-debouncetime/41658320#41658320
   */
  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(PromqlEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick(300);
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
