import * as vscode from 'vscode';

function getConfig() : vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('compiler-explorer');
}

export function getCompilerExplorerHost() : string {
    const config: vscode.WorkspaceConfiguration = getConfig();
    return config.get<string>('url');
}

export function getCompilerCode() : string {
    const config: vscode.WorkspaceConfiguration = getConfig();
    return config.get<string>('compiler');
}

export function getCompilerOptions() : string {
    const config: vscode.WorkspaceConfiguration = getConfig();
    return config.get<string>('options');
}
