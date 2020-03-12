import * as vscode from 'vscode';
import { GodboltLabel } from './compiler-explorer-types';

interface Token {
    start: number;
    stop: number;
    type: string;
}


function tokenize(sourceCode: string, labels?: Array<GodboltLabel[]>) : Array<Token> {
    let res: Array<Token> = [];

    let currentLineIndex = 0;
    let lineStart = 0;
    let sourceLines = sourceCode.split('\n');
    for( let line of sourceLines ) {

        if( !line.startsWith(' ') && line.lastIndexOf(':') > 0 ) {
            // Label
            res.push({
                start: lineStart,
                stop: lineStart + line.lastIndexOf(':') + 1,
                type: 'Label'
            });
        }
        else {
            let splitLine = line.split('  ').filter(v => v);
            let token = splitLine[0];
            let start = lineStart + line.indexOf(token, 0);
            let end = start + token.length;
            res.push({
                start: start,
                stop: end,
                type: 'Mnemonic'
            });
            
            if( splitLine.length > 1 ) {
                
                let argType = 'Args';
                token = splitLine[1];
                start = lineStart + line.indexOf(token, end - lineStart);
                end = start + token.length;
                if( token.indexOf("\"") >= 0 ) {
                    argType = 'String';
                }
    
                res.push({
                    start: start,
                    stop: end,
                    type: argType
                });
                
                // If one of the args is a label, override
                if( labels && labels.length > currentLineIndex ) {
                    const lineLabels = labels[currentLineIndex];
    
                    if( lineLabels ) {
                        for( let labelInfo of lineLabels ) {
                            res.push({
                                start: lineStart + labelInfo.range.startCol,
                                stop: lineStart + labelInfo.range.endCol,
                                type: "LabelArg"
                            });
                        }
                    }
                }
            }

            
            if( splitLine.length > 2) {
                token = splitLine.splice(2).join(' ');
                start = lineStart + line.indexOf(token, end - lineStart);
                end = start + token.length;
                res.push({
                    start: start,
                    stop: end,
                    type: 'Comment'
                });
            }
        }

        lineStart += line.length + 1;
        currentLineIndex += 1;
    }

    return res;
} 

let baseDecoration = {};

const typeMap = {
    'String': vscode.window.createTextEditorDecorationType({
        ...baseDecoration,
        color: '#c39178'
        
    }),
    'Args': vscode.window.createTextEditorDecorationType({
        ...baseDecoration,
        color: '#9cdcda'
    }),
    'LabelArg': vscode.window.createTextEditorDecorationType({
        ...baseDecoration,
        color: '#2a8081',
        fontStyle: 'italic',
        // borderWidth: '1px',
        // borderColor: 'red',
        // borderStyle: 'solid'
    }),
    'Comment': vscode.window.createTextEditorDecorationType({
        ...baseDecoration,
        color: '#438a55'
        
    }),
    'Mnemonic': vscode.window.createTextEditorDecorationType({
        ...baseDecoration,
        color: '#3e9cd6'
    }),
    'Label': vscode.window.createTextEditorDecorationType({
        ...baseDecoration,
        color:  '#2a8081'
    }),
}

export interface DecorationSpecification {
    type: vscode.TextEditorDecorationType;
    ranges: Array<vscode.DecorationOptions>;
}

export function getSyntaxHighlightDecorationTypes() : any {
    return typeMap;
}

export function getSyntaxHighlightDecorations(editor: vscode.TextEditor, content: string, labels?: Array<GodboltLabel[]>) : Array<DecorationSpecification> {
    let res: Array<DecorationSpecification> = [];
    let typedBuckets = {};
    let tokens = tokenize(content, labels);
    for( const token of tokens ) {
        if( !typedBuckets[token.type] ) {
            typedBuckets[token.type] = [];
        }
        typedBuckets[token.type].push(
            new vscode.Range(
                editor.document.positionAt(token.start),
                editor.document.positionAt(token.stop),
            )
        );
    }

    // We must have an entry for each type or old ranges of that type will persist.
    for( let typename of Object.keys(typeMap) ) {
        let ranges = [];
        if( typedBuckets[typename] ) {
            ranges = typedBuckets[typename];
        }

        res.push({
            type: typeMap[typename],
            ranges: ranges
        });
    }

    return res;
}