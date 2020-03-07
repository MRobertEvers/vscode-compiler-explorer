# VSCode Compiler Explorer

VSCode compiler explorer is an extension that allows you to view Compiler Explorer output in VSCode.

Compiler Explorer: https://godbolt.org/
Compiler Explorer Github: https://github.com/mattgodbolt/compiler-explorer

![Display-Example](resource/Display-Example.PNG)

## Usage 

This extension does not compile your code itself. It uses the Compiler Explorer API to do so (https://github.com/mattgodbolt/compiler-explorer/blob/master/docs/API.md).

You need to specify what compiler and compiler options you want to include in the API call.

```
{
    "compiler-explorer.url": "https://godbolt.org", // url of the compiler explorer you want to use.
    "compiler-explorer.compiler": "carmg820", // Compiler code - See help below.
    "compiler-explorer.options": "-O3", // Compiler options
    "compiler-explorer.debug": true, // true indicates that the extension will print debug to its output channel.
    "compiler-explorer.include": [<filepaths>]
}
```

Once your settings are specified, you can open the compiler explorer with the command.

`Ctrl + shift + p`, then search `compiler-explorer` to open the compiler explorer. It will automatically update when you save the file you are editing.

`compiler-explorer.include` may contain absolute filepaths or filepaths starting with `${workspaceFolder}`.

## Current Restrictions

I haven't done any validation for anything other than C/C++; currently the extension checks you are exiting those two languages.

In order to use the `compiler-explorer.include` option, you must host the compiler explorer yourself (e.g. Locally) and enable the `-I` command line argument.

E.g. On your local instance of compiler explorer, open the config `compiler-explorer.defaults.properties`, and change the `optionsBlacklistRe=` regular expression to NOT match `-I`.

## Current Bugs

Lots. Has issues when editing multiple files; you must close the compiler explorer, then reopen it for a new file.
Syntax highlighting is iffy.

## Todo

I'd like to use an already existing syntax/tokenizer for the assembly. I want to use the syntax highlighter from compiler explorer.