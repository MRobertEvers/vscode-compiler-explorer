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
    "compiler-explorer.debug": true // true indicates that the extension will print debug to its output channel.
}
```

Once your settings are specified, you can open the compiler explorer with the command.

`Ctrl + shift + p`, then search `compiler-explorer` to open the compiler explorer. It will automatically update when you save the file you are editing.

## Current Restrictions

I haven't done any validation for anything other than C/C++; currently the extension checks you are exiting those two languages.

## Current Bugs

Lots. Has issues when editing multiple files; you must close the compiler explorer, then reopen it for a new file.
Syntax highlighting is iffy.

## Todo

I'd like to use an already existing syntax/tokenizer for the assembly. I want to use the syntax highlighter from compiler explorer.