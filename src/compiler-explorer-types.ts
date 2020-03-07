export interface PrintoutLine {
    text: string;
}

export interface SourceInfo {
    file: string;
    line: number;
}

export interface ASMOutputLine {
    text: string;
    source: SourceInfo;
    labels: Array<GodboltLabel> | null;
}

export interface CompilerExplorerResponse {
    code: number;
    okToCache: boolean;
    stdout: Array<PrintoutLine>;
    stderr: Array<PrintoutLine>;
    inputFilename: string;
    compilationOptions: Array<string>;
    tools: Array<string>;
    asm: Array<ASMOutputLine>;
    labelDefinitions: string | null;
    popularArguments: any;
}

// The compiler explorer sometimes provides this additional info.
export interface GodBoltRange {
    startCol: number;
    endCol: number;
}
export interface GodboltLabel {
    name: string;
    range: GodBoltRange;
}
