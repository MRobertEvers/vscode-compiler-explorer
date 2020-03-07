import * as vscode from 'vscode';

const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('compiler-explorer');

export function getCompilerExplorerHost() : string {
    return config.get<string>('url');
}

export function getCompilerCode() : string {
    return config.get<string>('compiler');
}

export function getCompilerOptions() : string {
    return config.get<string>('options');
}
