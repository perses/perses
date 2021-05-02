import { AfterViewInit, Component, ElementRef, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { PromQLExtension } from 'codemirror-promql';
import { EditorView, highlightSpecialChars, keymap, placeholder, ViewUpdate } from '@codemirror/view';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { Compartment, EditorState, Extension } from '@codemirror/state';

import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { history, historyKeymap } from '@codemirror/history';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { indentOnInput } from '@codemirror/language';
import { lintKeymap } from '@codemirror/lint';
import { defaultKeymap } from '@codemirror/commands';
import { commentKeymap } from '@codemirror/comment';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { promQLDarkHighlightMaterialTheme, promQLLightHighlightMaterialTheme } from './promql-editor.theme';
import { booleanInput } from '../../utils/angular-input.util';
import { ThemeService } from '../../service/theme.service';

@UntilDestroy()
@Component({
  selector: 'app-promql-editor',
  templateUrl: './promql-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PromqlEditorComponent),
      multi: true,
    },
  ],
})
export class PromqlEditorComponent implements OnInit, ControlValueAccessor, AfterViewInit {
  @ViewChild('container') containerRef?: ElementRef<HTMLDivElement>;

  @Input()
  public set editable(editable: boolean | string) {
    this.$editable.next(booleanInput(editable));
  }

  @Input()
  public set activateLinter(activate: boolean | string) {
    this.$activateLinter.next(booleanInput(activate));
  }

  @Input()
  public set activateAutocomplete(activate: boolean | string) {
    this.$activateAutocomplete.next(booleanInput(activate));
  }

  private readonly $viewInitialized: Subject<void> = new Subject<void>();
  private readonly $expr: Subject<string> = new BehaviorSubject<string>('');
  private readonly $editable: Subject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly $activateLinter: Subject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly $activateAutocomplete: Subject<boolean> = new BehaviorSubject<boolean>(false);

  private readonly $aggregation: Observable<[string, boolean, boolean, boolean, boolean, void]> = combineLatest([
    this.$expr.asObservable(),
    this.$editable.asObservable(),
    this.$activateLinter.asObservable(),
    this.$activateAutocomplete.asObservable(),
    this.themeService.darkThemeEnable,
    this.$viewInitialized.asObservable(),
  ]);

  private readonly dynamicConfig = new Compartment();
  private editor?: EditorView;

  constructor(
    private readonly location: Location,
    private readonly themeService: ThemeService
  ) {}

  private static customizeCodemirrorTheme(isDarkTheme: boolean): Extension {
    return EditorView.theme(
      {
        $completionDetail: {
          marginLeft: '0.5em',
          float: 'right',
          color: '#9d4040',
        },
        $completionMatchedText: {
          color: '#83080a',
          fontWeight: 'bold',
        },
        '.cm-matchingBracket': {
          color: isDarkTheme ? 'white' : 'black',
          backgroundColor: 'rgba(81,190,215,0.25)',
          textDecoration: 'none',
        },
      },
      { dark: isDarkTheme }
    );
  }

  ngOnInit(): void {
    this.$aggregation
      .pipe(
        debounceTime(300), // Try to group changes occurring at the "same" time
        untilDestroyed(this)
      )
      .subscribe(([expr, editable, activateLinter, activateAutocomplete, isDarkTheme]) => {
        this.onChangeInput(expr, editable, activateLinter, activateAutocomplete, isDarkTheme);
      });
  }

  writeValue(obj: any): void {
    if (obj) {
      this.$expr.next(obj);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  ngAfterViewInit(): void {
    this.$viewInitialized.next();
  }

  private onChangeInput(
    expr: string,
    editable: boolean,
    activateLinter: boolean,
    activateAutocomplete: boolean,
    isDarkTheme: boolean
  ): void {
    // Configure the PromQL extension
    const promqlExtension = new PromQLExtension()
      .activateCompletion(activateAutocomplete)
      .activateLinter(activateLinter);

    // Build the dynamic part of the config.
    const dynamicConfig = [
      isDarkTheme ? promQLDarkHighlightMaterialTheme : promQLLightHighlightMaterialTheme,
      PromqlEditorComponent.customizeCodemirrorTheme(isDarkTheme),
      EditorView.editable.of(editable),
      promqlExtension.asExtension(),
    ];

    // Create or reconfigure the editor.
    if (this.editor === undefined) {
      if (this.containerRef === undefined) {
        throw new Error('expected CodeMirror container element to exist');
      }

      const startState = EditorState.create({
        doc: expr,
        extensions: [
          highlightSpecialChars(),
          history(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          highlightSelectionMatches(),
          EditorView.lineWrapping,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...commentKeymap,
            ...completionKeymap,
            ...lintKeymap,
          ]),
          placeholder('Expression (press Enter for newlines)'),
          this.dynamicConfig.of(dynamicConfig),
          EditorView.updateListener.of((update: ViewUpdate): void => {
            this.onChange(update.state.doc.toString());
          }),
        ],
      });

      this.editor = new EditorView({
        state: startState,
        parent: this.containerRef.nativeElement,
      });
    } else {
      this.editor.dispatch(
        this.editor.state.update({
          changes: {
            from: 0,
            to: this.editor.state.doc.length,
            insert: expr,
          },
          effects: this.dynamicConfig.reconfigure(dynamicConfig),
        })
      );
    }
  }

  private onChange = (_: string) => void 0;
  private onTouch = (_: string) => void 0;
}
