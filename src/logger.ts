import * as vscode from 'vscode';
import * as config from './config';

let output: vscode.OutputChannel = vscode.window.createOutputChannel('Compiler Explorer');

export function info(msg: string) {
    output.appendLine(msg);
};

export function debug(msg: string) {
    if( config.getIsDebug() ) {
        const message: string = 'Debug: ' + msg;
        output.appendLine(message);
    }
};
