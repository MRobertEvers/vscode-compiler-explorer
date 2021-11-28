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

export function getCompilerCode(lang : string) : string {  // this should return the correct compiler based on the language
    const config: vscode.WorkspaceConfiguration = getConfig();
    return config.get<string>('compiler'+getUnifiedLanguageName(lang));
}

export function getUnifiedLanguageName(lang : string) : string {
    let text = 'Default';
    if( lang == 'c' || lang == 'c++' || lang == 'cpp' ) {
        text = 'Cpp';
    }
    else if(lang == 'python'){
        text = 'Python';
    }
    else if(lang == 'java')
    {
        text = 'Java';
    }
    return text;
}

export function getCompilerOptions(lang : string) : string {
    const config: vscode.WorkspaceConfiguration = getConfig();
    let res = config.get<string | string[]>('options'+getUnifiedLanguageName(lang));
    if( Array.isArray(res) ) {
        return res.join(' ');
    }
    else {
        return res;
    }
}

export function getIsDebug() : boolean {
    const config: vscode.WorkspaceConfiguration = getConfig();
    return config.get<boolean>('debug');
}


export function getCompilerIncludes() : string[] {
    const config: vscode.WorkspaceConfiguration = getConfig();
    let includes: string[] = config.get<string[]>('include');
    return includes.map(resolveFilepath);
}
