import fetch from 'node-fetch';
import * as logger from './logger'
import { CompilerExplorerResponse, GodboltLabel } from './compiler-explorer-types';

export default class CompilerExplorer {
    currentData: CompilerExplorerResponse | null;
    apiHost: string;

    constructor(apiHost: string) {
        this.apiHost = apiHost;
    }

    // The godbolt compiler provides additional info about the location of labels.
    getAdditionalLabelInfo() : Array<GodboltLabel[]> {
        return this.currentData.asm.map(line => line.labels);
    }

    getDisassembledLineRange(sourceLineNumber: number) : Array<number> | null {
        if( !this.currentData ) {
            return null;
        }

        let lineNumber = sourceLineNumber + 1;

        let startLine = 0;
        let size = 0;
        for( let asmLine of this.currentData.asm ) {
            if( !asmLine.source ) {
                if( size == 0 ) {
                    startLine += 1;
                    continue;
                }
                else {
                    break;
                }
            }

            const { file, line } = asmLine.source;
            if( line > lineNumber ) {
                break;
            }
            else if( line == lineNumber ) {
                size += 1;
            }
            else {
                startLine += 1;
            }
        }

        if( size > 0 ) {
            return [startLine, startLine + size -1];
        }
        else {
            return null;
        }
    }

    getCompileAPIOptions(userOptions: string) : any {
        return {
            userArguments: userOptions,
            filters: {
                binary: false,
                execute: false,
                intel: true,
                demangle: true,
                labels: true,
                libraryCode: false,
                directives: true,
                commentOnly: true,
                trim: false
            },
            compilerOptions: {
                produceGccDump: {},
                produceCfg: false
            },
            tools: [],
            libraries: []
        };
    }

    async compile(compiler: string, options: string, language: string, source: string) {
        let fetchPromise = fetch(`${this.apiHost}/api/compiler/${compiler}/compile`, {
            method: 'POST',
            compress: true,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                source: source,
                lang: language,
                options: this.getCompileAPIOptions(options),
                allowStoreCodeDebug: true,
                compiler: compiler
            })
        })
        .then(res => { 
            return res.json(); 
        })
        .then((json: CompilerExplorerResponse) => { 
            this.currentData = json;
            logger.info(JSON.stringify(json, null, 2));
            return json.asm.map(a => a.text).join('\n') 
        });

        return fetchPromise;
    }
    
    // provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
    //     if( uri.path.endsWith('Output') ) {
    //         if( !this.currentData ) {
    //             return;
    //         }
    //         let stdoutLines = this.currentData.stdout.map(v => v.text);
    //         let stderrLines = this.currentData.stderr.map(v => v.text);
    //         return stdoutLines.concat(stderrLines).join('\n');
    //     }

    //     const content = vscode.window.activeTextEditor.document.getText();
    //     const lang = vscode.window.activeTextEditor.document.languageId;
    //     let fetchPromise = fetch('http://localhost:10240/api/compiler/iar/compile', {
    //         method: 'POST',
    //         compress: true,
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Accept': 'application/json'
    //         },
    //         body: JSON.stringify({
    //             source: content,
    //             lang: lang,
    //             options: this.getCompileAPIOptions(),
    //             allowStoreCodeDebug: true,
    //             compiler: "iar"
    //         })
    //     })
    //     .then(res => { 
    //         return res.json(); 
    //     })
    //     .then((json: CompilerExplorerResponse) => { 
    //         this.currentData = json;
    //         logger.info(JSON.stringify(json, null, 2));
    //         return json.asm.map(a => a.text).join('\n') 
    //     });

    //     return fetchPromise;
    // }
};

