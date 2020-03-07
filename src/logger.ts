import * as vscode from 'vscode';

let output: vscode.OutputChannel = vscode.window.createOutputChannel('Compiler Explorer');

export function info(msg: string) {
    output.appendLine(msg);
};

export function debug(msg: string) {
    if (vscode.workspace.getConfiguration('compiler-explorer').get('debug', false)) {
        const message: string = 'Debug: ' + msg;
        output.appendLine(message);
    }
};
