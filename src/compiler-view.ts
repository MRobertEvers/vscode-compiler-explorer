import * as vscode from 'vscode';
import * as logger from './logger';
import CompilerExplorer from './compiler-explorer';
import CompilerExplorerSourceProvider from './compiler-source-provider';
import { GodboltLabel } from './compiler-explorer-types';
import {getSyntaxHighlightDecorations, DecorationSpecification, getSyntaxHighlightDecorationTypes} from './assembler-syntax-highlight';
import { getCompilerExplorerHost } from './config';
import fetch from 'node-fetch';

const highlightDecorationType: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
    borderWidth: '1px',
    borderStyle: 'solid',
    isWholeLine: true,
    overviewRulerColor: 'blue',
    overviewRulerLane: vscode.OverviewRulerLane.Full,
    // this color will be used in dark color themes
    backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
    borderColor: '#373737'
});

export default class CompilerView {
    private currentMnemonicsEditor: vscode.TextEditor | null;
    private currentSourceEditor: vscode.TextEditor | null;

    private currentMnemonicsDecorations: Array<DecorationSpecification> = [];
    private currentLabels: Array<GodboltLabel[]> = [];
    private compilerExplorer: CompilerExplorer = new CompilerExplorer();
    private compilerSourceProvider: CompilerExplorerSourceProvider = new CompilerExplorerSourceProvider(this.compilerExplorer);

    private supportedCompilers = this.getSupportedCompilers();
    activate(context: vscode.ExtensionContext) {
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if( this.currentSourceEditor && this.currentMnemonicsEditor &&
                editor.document !== this.currentSourceEditor.document &&
                editor.document !== this.currentMnemonicsEditor.document ) {
                this.clearSyntaxHighlighting();
                vscode.commands.executeCommand('compiler-explorer.updateDisassembly');
            }
        });

        // vscode.window.onDidChangeTextEditorVisibleRanges(editor => {
        //     // Scroll in assembly.
        // });
    
        vscode.window.onDidChangeTextEditorSelection((event: vscode.TextEditorSelectionChangeEvent) => {            
            if( !this.currentSourceEditor ) {
                return;
            }
            
            this.syntaxHighlightMnemonics();
            
            if( event.textEditor.document === this.currentSourceEditor.document ) {
                // Update highlighted lines.
                this.clearHighlightedLines();
                this.highlightMnemonicsLines(event.textEditor.selection.active.line);
            }
            else if( event.textEditor.document === this.currentMnemonicsEditor.document ) {
                this.clearHighlightedLines();
                this.highlightSourceLines(event.textEditor.selection.active.line);
            }
        });

        vscode.workspace.onDidSaveTextDocument((doc: vscode.TextDocument) => {
            vscode.commands.executeCommand('compiler-explorer.updateDisassembly');
        });
        
        vscode.workspace.onDidCloseTextDocument((doc: vscode.TextDocument) => {
            if( this.currentMnemonicsEditor && doc === this.currentMnemonicsEditor.document ) {
                this.setCurrentMnemonicsEditor(null);
            }
        });
    
        vscode.workspace.registerTextDocumentContentProvider('compiler-explorer', this.compilerSourceProvider);
    
        vscode.commands.registerCommand('compiler-explorer.updateDisassembly', () => {this.updateCompilerExplorer();});
        vscode.commands.registerCommand('compiler-explorer.open', () => {this.showCompilerExplorer();});
    }

    private async showCompilerExplorer() {
        if( !this.canShowCompilerExplorer() ) {
			return; // no editor
        }

        const uri: vscode.Uri = vscode.Uri.parse('compiler-explorer:' + 'CompilerExplorer');

        // Calls back into the provider
        let newDocument: vscode.TextDocument = await vscode.workspace.openTextDocument(uri); 

        this.setCurrentSourceEditor(vscode.window.activeTextEditor);
        const result: vscode.TextEditor = await vscode.window.showTextDocument(newDocument, vscode.ViewColumn.Beside);
        this.setCurrentMnemonicsEditor(result);

        await vscode.commands.executeCommand('workbench.action.navigateBack');
    }

    private async updateCompilerExplorer() {
        if( !this.canShowCompilerExplorer() ) {
            return;
        }

        this.clearSyntaxHighlighting();
        this.clearHighlightedLines();

        // If the event is coming from the EditorChanged event, we need to update the editor.
        this.setCurrentSourceEditor(vscode.window.activeTextEditor);
        
        this.compilerSourceProvider.onDidChangeEmitter.fire(this.currentMnemonicsEditor.document.uri);
    }

    private setCurrentMnemonicsEditor(editor: vscode.TextEditor) {
        this.currentMnemonicsEditor = editor;
    }

    private setCurrentSourceEditor(editor: vscode.TextEditor) {
        this.currentSourceEditor = editor;
        this.clearHighlightedLines();
    }

    private canShowCompilerExplorer() : boolean {
        if( !vscode.window.activeTextEditor ) {
			return false; // no editor
        }
        const lang: string = vscode.window.activeTextEditor.document.languageId;
        if( lang == 'c' || lang == 'c++' || lang == 'cpp' ) {
            return true;
        }
        else if(lang == 'python'){
            return true;
        }
        else if(lang == 'java'){
            return true;
        }
        this.supportedCompilers.then(res => {
            if(res.includes(lang)){
                return true;
            }
          });
        //if some language is completely unsupported return false
        //for now this will always return true to enable the default lang usage
        return false;
    }

    private getBaseMnemonicsDecorations() : Array<DecorationSpecification> {
        if( this.currentMnemonicsDecorations.length == 0 ) {
            this.currentMnemonicsDecorations = getSyntaxHighlightDecorations(
                this.currentMnemonicsEditor, this.currentMnemonicsEditor.document.getText(), this.getCurrentLabels()
            );
        }

        return this.currentMnemonicsDecorations.slice(0);
    }

    private getCurrentLabels() : Array<GodboltLabel[]> {
        if( this.currentLabels.length == 0 ) {
            this.currentLabels = this.compilerExplorer.getAdditionalLabelInfo();
        }

        return this.currentLabels;
    }

    private syntaxHighlightMnemonics() : void {
        if( !this.currentMnemonicsEditor ) {
            return;
        }

        const decoratedRanges: Array<DecorationSpecification> = this.getBaseMnemonicsDecorations();

        for( let decoration of decoratedRanges ) {
            this.currentMnemonicsEditor.setDecorations(decoration.type, decoration.ranges);
        }
    }

    private getSourceLineRange(disassembledLine: number) : vscode.Range {
        let lineNum = this.compilerExplorer.getSourceLineRange(disassembledLine);
        if( !lineNum ) {
            return null;
        }

        const line = this.currentMnemonicsEditor.document.lineAt(lineNum);
        return new vscode.Range(line.range.start, line.range.end)
    }

    private getDisassembledLineRange(sourceLine: number) : vscode.Range {
        let result = this.compilerExplorer.getDisassembledLineRange(sourceLine);
        if( !result ) {
            return null;
        }

        const [startLine, endLine] = result;
        const startPosition = this.currentMnemonicsEditor.document.lineAt(startLine).range.start;
        const endPosition = this.currentMnemonicsEditor.document.lineAt(endLine).range.end;

        return new vscode.Range(startPosition, endPosition);
    }

    private clearSyntaxHighlighting() {
        if( !this.currentMnemonicsEditor ) {
            return;
        }
        let clearedSyntaxTypes = getSyntaxHighlightDecorationTypes();
        for( let type of Object.keys(clearedSyntaxTypes) ) {
            this.currentMnemonicsEditor.setDecorations(clearedSyntaxTypes[type], []);
        }
    }

    private clearHighlightedLines() {
        if( this.currentMnemonicsEditor ) {
            this.currentLabels = [];
            this.currentMnemonicsDecorations = [];
            this.currentMnemonicsEditor.setDecorations(highlightDecorationType, []);
        }
        if( this.currentSourceEditor ) {
            this.currentSourceEditor.setDecorations(highlightDecorationType, []);
        }
    }

    private highlightMnemonicsLines(sourceLine: number) : void {
        const highlightRange = this.getDisassembledLineRange(sourceLine);
        if( !highlightRange ) {
            this.clearHighlightedLines();
            return;
        }

        this.syntaxHighlightMnemonics();
        
        let highlightDecorations: vscode.DecorationOptions[] = [];
        highlightDecorations.push({
            range: highlightRange
        });

        this.currentMnemonicsEditor.setDecorations(highlightDecorationType, highlightDecorations);
    }

    private highlightSourceLines(disassembledLine: number) : void {
        const highlightRange = this.getSourceLineRange(disassembledLine);
        if( !highlightRange ) {
            this.clearHighlightedLines();
            return;
        }

        this.syntaxHighlightMnemonics();
        
        let highlightDecorations: vscode.DecorationOptions[] = [];
        highlightDecorations.push({
            range: highlightRange
        });

        this.currentSourceEditor.setDecorations(highlightDecorationType, highlightDecorations);
    }
    async getSupportedCompilers(){
        const apiHost = getCompilerExplorerHost();
        return await (await fetch(`${apiHost}/api/compilers`)).text();
    }
    /*
    private getLanguageIdentifier(lang : string) : string {
        switch (lang) {
            case 'go':
                return 'gc';
            case 'java':
                return 'jdk'
            default:
                break;
        }
    }*/
}