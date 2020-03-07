import * as vscode from 'vscode';
import * as logger from './logger';
import CompilerView from './compiler-view';

export function activate(context: vscode.ExtensionContext) {
    logger.info("Compiler Explorer Started");
    const compilerView = new CompilerView();
    compilerView.activate(context);
};
