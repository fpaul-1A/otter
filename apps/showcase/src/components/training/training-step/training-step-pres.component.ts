import {ChangeDetectionStrategy, Component, inject, Input, output, viewChild} from '@angular/core';
import {MarkdownModule, MarkdownService} from 'ngx-markdown';
import {CodeEditorViewComponent, EditorMode, TrainingProject} from '../code-editor-view';

@Component({
  selector: 'o3r-training-step-pres',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeEditorViewComponent, MarkdownModule],
  templateUrl: './training-step-pres.component.html',
  styleUrl: './training-step-pres.component.scss'
})
export class TrainingStepPresComponent {
  /**
   * Description of the coding project to load in the code view editor
   */
  @Input() public project?: TrainingProject;
  /**
   * Whether to allow the user to modify the project files in the editor
   */
  @Input() public editorMode?: EditorMode;
  /**
   * Training step title
   */
  @Input() public title?: string;
  /**
   * Training instructions to do the exercise
   */
  @Input() public instructions?: string;

  private readonly codeEditor = viewChild(CodeEditorViewComponent);

  public readonly focusExercise = output<string>();

  private readonly markdownService = inject(MarkdownService);

  constructor() {
    const originalLinkRendered = this.markdownService.renderer.link.bind(this.markdownService.renderer);
    this.markdownService.renderer.link = (href: string, title: string | null | undefined, text: string) => {
      if (/^training:\/\//.test(href)) {
        // TODO if needed to override HTML
        return originalLinkRendered(href, title, text);
      } else {
        return originalLinkRendered(href, title, text);
      }
    };
  }

  onCopyToClipboard() {
    // TODO snackbar
  }

  markdownClick(event: any) {
    const target = event.target;
    console.log(target);
    const internalLinkMatcher = /training:\/\/(exercise|solution)\/(.*)/;
    if (target.tagName === 'A' && internalLinkMatcher.test(target.href)) {
      console.log(`Caught event: `, event);
      event.preventDefault();
      event.stopPropagation();
      const [,type,path] = target.href.match(internalLinkMatcher);
      if (type === 'exercise') {
        // TODO switch to exercise panel
        this.codeEditor()!.onClickFile(path);
      } else if (type === 'solution') {
        // TODO switch to solution panel
        this.codeEditor()!.onClickFile(path);
      }
    } else {
      console.log('all clean');
    }
  }
}
