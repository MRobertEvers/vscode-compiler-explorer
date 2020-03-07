import * as vscode from 'vscode';

function getConfig() : vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('compiler-explorer');
}

function resolveFilepath(base: string) : string {
    const workspacePath = vscode.workspace.rootPath;
    return base.replace('${workspaceFolder}', workspacePath);
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

export function getCompilerIncludes() : string[] {
    const config: vscode.WorkspaceConfiguration = getConfig();
    let includes: string[] = config.get<string[]>('include');
    return includes.map(resolveFilepath);
}
