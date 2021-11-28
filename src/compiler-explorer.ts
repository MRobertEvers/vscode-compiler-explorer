import fetch from 'node-fetch';
import * as logger from './logger'
import { CompilerExplorerResponse, GodboltLabel } from './compiler-explorer-types';
import { getCompilerExplorerHost, getCompilerOptions, getCompilerCode, getCompilerIncludes } from './config';

export default class CompilerExplorer {
    currentData: CompilerExplorerResponse | null;

    // The godbolt compiler provides additional info about the location of labels.
    getAdditionalLabelInfo() : Array<GodboltLabel[]> {
        return this.currentData.asm.map(line => line.labels);
    }

    getSourceLineRange(disassemblyLineNumber: number) : number | null {
        if( !this.currentData ) {
            return null;
        }

        return this.currentData.asm[disassemblyLineNumber].source.line - 1;
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

    getCompileAPIUserOptions(lang : string) : string {
        let options = [getCompilerOptions(lang)];
        let additionalIncludes = getCompilerIncludes().map((inc: string) => { 
            let sanitized = inc.replace(/\\/g, '/');
            return `-I "${sanitized}"`; 
        });
        return options.concat(additionalIncludes).join(' ');
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

    logOutput(json: CompilerExplorerResponse) {
        // logger.debug(JSON.stringify(json, null, 2));
        let compilerOutput = [];
        if( json.stdout ) {
            compilerOutput = compilerOutput.concat(json.stdout);
        }
        if( json.stderr ) {
            compilerOutput = compilerOutput.concat(json.stderr);
        }
        if( json.compilationOptions ) {
            logger.debug(json.compilationOptions.join(' '))
        }
        logger.info(compilerOutput.map(l => l.text).join('\n'));
    }

    async compile(language: string, source: string) {
        logger.debug("Fetching Compilation");
        const apiHost = getCompilerExplorerHost();
        const compiler = getCompilerCode(language);
        const options = this.getCompileAPIOptions(this.getCompileAPIUserOptions(language));

        this.currentData = null;
        
        let fetchPromise = fetch(`${apiHost}/api/compiler/${compiler}/compile`, {
            method: 'POST',
            compress: true,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json,  text/javascript, */*'
            },
            body: JSON.stringify({
                source: source,
                lang: language,
                options: options,
                allowStoreCodeDebug: true,
                compiler: compiler
            })
        })
        .then(res => { 
            return res.json(); 
        })
        .then((json: CompilerExplorerResponse) => { 
            console.log(json);
            this.currentData = json;
            this.logOutput(json);

            if( !json.asm || (json.asm.length === 0 && json.stderr.length > 0) ) {
                return "<Compilation Error>\n" + json.stderr.map(l => l.text).join('\n');
            }
            else {
                return json.asm.map(a => a.text).join('\n'); 
            }
        });

        return fetchPromise;
    }
};

