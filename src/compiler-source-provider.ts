import * as vscode from 'vscode';
import * as logger from './logger'
import CompilerExplorer from './compiler-explorer';


export default class CompilerExplorerSourceProvider implements vscode.TextDocumentContentProvider {

    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();

    private compilerExplorer: CompilerExplorer;
    
    get onDidChange() {
        return this.onDidChangeEmitter.event;
    }

    constructor(compilerExplorer: CompilerExplorer) {
        this.compilerExplorer = compilerExplorer;
    }

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) : vscode.ProviderResult<string> {
        const sourceCode = vscode.window.activeTextEditor.document.getText();
        const lang = vscode.window.activeTextEditor.document.languageId;
        return this.compilerExplorer.compile(lang, sourceCode);
    }
};

