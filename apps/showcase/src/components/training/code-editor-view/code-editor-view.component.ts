import {
  AsyncPipe,
} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  takeUntilDestroyed,
  toSignal,
} from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  LoggerService,
} from '@o3r/logger';
import {
  FileSystemTree,
} from '@webcontainer/api';
import {
  AngularSplitModule,
} from 'angular-split';
import type * as Monaco from 'monaco-editor';
import {
  MonacoEditorModule,
} from 'ngx-monaco-editor-v2';
import {
  MonacoTreeElement,
  NgxMonacoTreeComponent,
} from 'ngx-monaco-tree';
import {
  BehaviorSubject,
  combineLatestWith,
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  from,
  map,
  Observable,
  of,
  share,
  skip,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import {
  checkIfPathInMonacoTree,
} from '../../../helpers/monaco-tree.helper';
import {
  flattenTree,
  WebContainerService,
} from '../../../services';
import {
  CodeEditorControlComponent,
} from '../code-editor-control';

declare global {
  interface Window {
    monaco: typeof Monaco;
  }
}

/** ngx-monaco-editor options language - determined based on file extension */
const editorOptionsLanguage: Record<string, string> = {
  html: 'xml',
  json: 'json',
  md: 'markdown',
  ts: 'typescript',
  js: 'javascript'
};

/** Mode of Code Editor */
export type EditorMode = 'readonly' | 'interactive';

/** Project properties for the current exercise */
export interface TrainingProject {
  /** Starting file to be displayed in the project */
  startingFile: string;
  /** Files in the project */
  files: FileSystemTree;
  /** Commands to run in the project */
  commands: string[];
  /** Current working directory in project */
  cwd: string;
}

@Component({
  selector: 'code-editor-view',
  standalone: true,
  imports: [
    AsyncPipe,
    CodeEditorControlComponent,
    FormsModule,
    MonacoEditorModule,
    NgxMonacoTreeComponent,
    ReactiveFormsModule,
    AngularSplitModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './code-editor-view.component.html',
  styleUrl: './code-editor-view.component.scss'
})
export class CodeEditorViewComponent implements OnDestroy, OnChanges {
  /**
   * @see {FormBuilder}
   */
  private readonly formBuilder = inject(FormBuilder);
  /**
   * Stream of the working directory for this component to use it to compute the monaco tree from the
   * {@link WebContainerService} tree
   */
  private readonly cwd$ = new BehaviorSubject('');

  /**
   * Logger service that will manage which logger should be used
   */
  private readonly loggerService = inject(LoggerService);

  @ViewChild('monacoOverflowWidgets')
  private readonly monacoOverflowWidgets!: ElementRef;

  /**
   * Allow to edit the code in the monaco editor
   */
  @Input() public editorMode: EditorMode = 'readonly';
  /**
   * Project to load in the code editor.
   * It should describe the files to load, the starting file, the folder dedicated to the project as well as the
   * commands to initialize the project
   */
  @Input() public project?: TrainingProject;
  /**
   * Service to load files and run commands in the application instance of the webcontainer.
   */
  public readonly webContainerService = inject(WebContainerService);
  /**
   * File tree loaded in the project folder within the web container instance.
   */
  public cwdTree$: Observable<MonacoTreeElement[]> = this.cwd$.pipe(
    switchMap((cwd) =>
      cwd
        ? this.webContainerService.monacoTree$.pipe(
          map((tree) => tree.find((treeElement) => treeElement.name === cwd)?.content || [])
        )
        : of([])
    ),
    filter((tree) => tree.length > 0),
    share()
  );

  /**
   * Form with the selected file and its content which can be edited in the Monaco Editor
   */
  public form: FormGroup<{
    code: FormControl<string | null>;
    file: FormControl<string | null>;
  }> = this.formBuilder.group({
      code: '',
      file: ''
    });

  /**
   * Configuration for the Monaco Editor
   */
  public editorOptions$ = this.form.controls.file.valueChanges.pipe(
    startWith(''),
    filter((filePath): filePath is string => !!filePath),
    map((filePath) => ({
      theme: 'vs-dark',
      language: editorOptionsLanguage[filePath.split('.').pop() || 'ts'] || editorOptionsLanguage.ts,
      readOnly: (this.editorMode === 'readonly'),
      automaticLayout: true,
      scrollBeyondLastLine: false,
      overflowWidgetsDomNode: this.monacoOverflowWidgets.nativeElement
    }))
  );

  public monacoReady = new Subject<void>();
  public monacoPromise = firstValueFrom(this.monacoReady.pipe(
    map(() => window.monaco)
  ));

  private readonly fileContentLoaded$ = this.form.controls.file.valueChanges.pipe(
    combineLatestWith(this.cwdTree$),
    filter(([path, monacoTree]) => !!path && checkIfPathInMonacoTree(monacoTree, path.split('/'))),
    switchMap(([path]) => from(this.webContainerService.readFile(`${this.project!.cwd}/${path}`).catch(() => ''))),
    takeUntilDestroyed(),
    share()
  );

  private readonly fileContent = toSignal(this.fileContentLoaded$);
  public model = computed(() => {
    const value = this.fileContent();
    const monaco = window.monaco;
    if (!monaco) {
      return undefined;
    }
    const uri = monaco.Uri.from({ scheme: '', path: this.form.controls.file.value! });
    const language = editorOptionsLanguage[this.form.controls.file.value!.split('.').at(-1) || ''] || '';
    return {
      value,
      language,
      uri
    };
  });

  constructor() {
    this.form.controls.code.valueChanges.pipe(
      distinctUntilChanged(),
      skip(1),
      debounceTime(300),
      filter((text): text is string => !!text),
      takeUntilDestroyed()
    ).subscribe((text: string) => {
      if (!this.project) {
        this.loggerService.error('No project found');
        return;
      }
      const path = `${this.project.cwd}/${this.form.controls.file.value}`;
      this.loggerService.log('Writing file', path);
      void this.webContainerService.writeFile(path, text);
    });
    this.fileContentLoaded$.subscribe((content) => this.form.controls.code.setValue(content));

    void this.monacoPromise.then((monaco) => {
      monaco.editor.registerEditorOpener({
        openCodeEditor: (_source: Monaco.editor.ICodeEditor, resource: Monaco.Uri, selectionOrPosition?: Monaco.IRange | Monaco.IPosition) => {
          if (resource) {
            const filePath = resource.path.slice(1);
            this.form.controls.file.setValue(filePath);
            if (selectionOrPosition) {
              // TODO find a way to execute that after the new file is loaded
              if (monaco.Position.isIPosition(selectionOrPosition)) {
                monaco.editor.getEditors()[0].revealPosition(selectionOrPosition);
              } else {
                monaco.editor.getEditors()[0].revealRange(selectionOrPosition);
              }
            }
            return true;
          }
          return false;
        }
      });
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        skipLibCheck: true,
        target: 99,
        module: 99,
        moduleResolution: 2,
        lib: [
          'es2022',
          'dom'
        ],
        paths: {
          sdk: [
            'file:///libs/sdk/src/index'
          ]
        }
      });
    });
  }

  private async updateAllProject() {
    const monaco = await this.monacoPromise;
    const flatFiles = flattenTree(this.project?.files!);
    flatFiles.forEach(({ filePath, content }) => {
      const language = editorOptionsLanguage[filePath.split('.').at(-1) || ''] || '';
      monaco.editor.createModel(content, language, monaco.Uri.from({ scheme: '', path: filePath }));
    });
  }

  /**
   * @inheritDoc
   */
  public async onClickFile(filePath: string) {
    if (!this.project) {
      return;
    }
    const path = `${this.project.cwd}/${filePath}`;
    if (this.project && await this.webContainerService.isFile(path)) {
      this.form.controls.file.setValue(filePath);
    }
  }

  /**
   * @inheritDoc
   */
  public ngOnChanges(changes: SimpleChanges) {
    if ('project' in changes) {
      if (this.project?.files) {
        // Remove link between launch project and terminals
        void this.webContainerService.loadProject(this.project.files, this.project.commands, this.project.cwd);
      }
      void this.monacoPromise.then(async (monaco) => {
        monaco.editor.getModels().forEach((m) => m.dispose());
        await this.updateAllProject();
        if (this.project?.startingFile) {
          this.form.controls.file.setValue(this.project.startingFile);
        } else {
          this.form.controls.file.setValue('');
          this.form.controls.code.setValue('');
        }
      });
      this.cwd$.next(this.project?.cwd || '');
    }
  }

  /**
   * @inheritDoc
   */
  public ngOnDestroy() {
    this.webContainerService.runner.killContainer();
  }
}
