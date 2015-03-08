/// <reference path="../PluginHost.ts" />

declare module td
{
    export interface IOptions
    {
        /**
         * The human readable name of the project. Used within the templates to set the title of the document.
         */
        name?:string;

        /**
         * Specifies the output mode the project is used to be compiled with.
         */
        mode?:SourceFileMode;

        /**
         * Define a pattern for files that should be considered being external.
         */
        externalPattern?:string;

        /**
         * Should declaration files be documented?
         */
        includeDeclarations?:boolean;

        /**
         * Should externally resolved TypeScript files be ignored?
         */
        excludeExternals?:boolean;
    }
}

module td
{
    export interface IConverterResult
    {
        project:any;
        errors:ts.Diagnostic[];
    }


    /**
     * Event callback definition for generic converter events.
     *
     * @see [[Converter.EVENT_BEGIN]]
     * @see [[Converter.EVENT_END]]
     * @see [[Converter.EVENT_RESOLVE_BEGIN]]
     * @see [[Converter.EVENT_RESOLVE_END]]
     */
    interface IConverterCallback
    {
        /**
         * @param context  The context object describing the current state the converter is in.
         */
        (context:Context):void;
    }


    /**
     * Event callback definition for events triggered by factories.
     *
     * @see [[Converter.EVENT_FILE_BEGIN]]
     * @see [[Converter.EVENT_CREATE_DECLARATION]]
     * @see [[Converter.EVENT_CREATE_SIGNATURE]]
     * @see [[Converter.EVENT_CREATE_PARAMETER]]
     * @see [[Converter.EVENT_CREATE_TYPE_PARAMETER]]
     * @see [[Converter.EVENT_FUNCTION_IMPLEMENTATION]]
     */
    interface IConverterNodeCallback
    {
        /**
         * @param context  The context object describing the current state the converter is in.
         * @param reflection  The reflection that is currently processed.
         * @param node  The node that is currently processed if available.
         */
        (context:Context, reflection:Reflection, node?:ts.Node):void;
    }


    /**
     * Event callback definition for events during the resolving phase.
     *
     * @see [[Converter.EVENT_RESOLVE]]
     */
    interface IConverterResolveCallback
    {
        /**
         * @param context  The context object describing the current state the converter is in.
         * @param reflection  The reflection that is currently resolved.
         */
        (context:Context, reflection:Reflection):void;
    }


    /**
     * Compiles source files using TypeScript and converts compiler symbols to reflections.
     */
    export class Converter extends PluginHost<ConverterPlugin> implements ts.CompilerHost
    {
        /**
         * The host application of this converter instance.
         */
        private application:IApplication;

        /**
         * The full path of the current directory. Result cache of [[getCurrentDirectory]].
         */
        private currentDirectory:string;

        /**
         * Return code of ts.sys.readFile when the file encoding is unsupported.
         */
        static ERROR_UNSUPPORTED_FILE_ENCODING = -2147024809;


        /**
         * General events
         */

        /**
         * Triggered when the converter begins converting a project.
         * The listener should implement [[IConverterCallback]].
         * @event
         */
        static EVENT_BEGIN:string = 'begin';

        /**
         * Triggered when the converter has finished converting a project.
         * The listener should implement [[IConverterCallback]].
         * @event
         */
        static EVENT_END:string = 'end';


        /**
         * Factory events
         */

        /**
         * Triggered when the converter begins converting a source file.
         * The listener should implement [[IConverterNodeCallback]].
         * @event
         */
        static EVENT_FILE_BEGIN:string = 'fileBegin';

        /**
         * Triggered when the converter has created a declaration reflection.
         * The listener should implement [[IConverterNodeCallback]].
         * @event
         */
        static EVENT_CREATE_DECLARATION:string = 'createDeclaration';

        /**
         * Triggered when the converter has created a signature reflection.
         * The listener should implement [[IConverterNodeCallback]].
         * @event
         */
        static EVENT_CREATE_SIGNATURE:string = 'createSignature';

        /**
         * Triggered when the converter has created a parameter reflection.
         * The listener should implement [[IConverterNodeCallback]].
         * @event
         */
        static EVENT_CREATE_PARAMETER:string = 'createParameter';

        /**
         * Triggered when the converter has created a type parameter reflection.
         * The listener should implement [[IConverterNodeCallback]].
         * @event
         */
        static EVENT_CREATE_TYPE_PARAMETER:string = 'createTypeParameter';

        /**
         * Triggered when the converter has found a function implementation.
         * The listener should implement [[IConverterNodeCallback]].
         * @event
         */
        static EVENT_FUNCTION_IMPLEMENTATION:string = 'functionImplementation';


        /**
         * Resolve events
         */

        /**
         * Triggered when the converter begins resolving a project.
         * The listener should implement [[IConverterCallback]].
         * @event
         */
        static EVENT_RESOLVE_BEGIN:string = 'resolveBegin';

        /**
         * Triggered when the converter resolves a reflection.
         * The listener should implement [[IConverterResolveCallback]].
         * @event
         */
        static EVENT_RESOLVE:string = 'resolveReflection';

        /**
         * Triggered when the converter has finished resolving a project.
         * The listener should implement [[IConverterCallback]].
         * @event
         */
        static EVENT_RESOLVE_END:string = 'resolveEnd';



        /**
         * Create a new Converter instance.
         *
         * @param application  The application instance this converter relies on. The application
         *   must expose the settings that should be used and serves as a global logging endpoint.
         */
        constructor(application:IApplication) {
            super();
            this.application = application;

            Converter.loadPlugins(this);
        }


        /**
         * Return a list of parameters introduced by this component.
         *
         * @returns A list of parameter definitions introduced by this component.
         */
        getParameters():IParameter[] {
            return super.getParameters().concat(<IParameter[]>[{
                name: "name",
                help: 'Set the name of the project that will be used in the header of the template.'
            },{
                name: "mode",
                help: "Specifies the output mode the project is used to be compiled with: 'file' or 'modules'",
                type: ParameterType.Map,
                map: {
                    'file': SourceFileMode.File,
                    'modules': SourceFileMode.Modules
                },
                defaultValue: SourceFileMode.Modules
            },{
                name: "externalPattern",
                key: 'Define a pattern for files that should be considered being external.'
            },{
                name: "includeDeclarations",
                help: 'Turn on parsing of .d.ts declaration files.',
                type: ParameterType.Boolean
            },{
                name: "excludeExternals",
                help: 'Prevent externally resolved TypeScript files from being documented.',
                type: ParameterType.Boolean
            }]);
        }


        /**
         * Compile the given source files and create a project reflection for them.
         *
         * @param fileNames  Array of the file names that should be compiled.
         */
        convert(fileNames:string[]):IConverterResult {
            for (var i = 0, c = fileNames.length; i < c; i++) {
                fileNames[i] = ts.normalizePath(ts.normalizeSlashes(fileNames[i]));
            }

            var settings = this.application.options;
            var program = ts.createProgram(fileNames, this.application.compilerOptions, this);
            var checker = program.getTypeChecker(true);
            var project = new ProjectReflection(settings.name);

            var errors = program.getDiagnostics();
            errors = errors.concat(checker.getDiagnostics());

            var context = new Context(this, settings, this.application.compilerOptions, fileNames, checker, project);
            this.dispatch(Converter.EVENT_BEGIN, context);

            program.getSourceFiles().forEach((sourceFile) => {
                visit(context, sourceFile);
            });

            this.dispatch(Converter.EVENT_RESOLVE_BEGIN, context);
            for (var id in project.reflections) {
                if (!project.reflections.hasOwnProperty(id)) continue;
                this.dispatch(Converter.EVENT_RESOLVE, context, project.reflections[id]);
            }

            this.dispatch(Converter.EVENT_RESOLVE_END, context);
            this.dispatch(Converter.EVENT_END, context);

            return {
                errors: errors,
                project: project
            }
        }


        /**
         * Return the basename of the default library that should be used.
         *
         * @returns The basename of the default library.
         */
        getDefaultLib():string {
            var target = this.application.compilerOptions.target;
            return target == ts.ScriptTarget.ES6 ? 'lib.es6.d.ts' : 'lib.d.ts';
        }



        /**
         * CompilerHost implementation
         */


        /**
         * Return an instance of ts.SourceFile representing the given file.
         *
         * Implementation of ts.CompilerHost.getSourceFile()
         *
         * @param filename  The path and name of the file that should be loaded.
         * @param languageVersion  The script target the file should be interpreted with.
         * @param onError  A callback that will be invoked if an error occurs.
         * @returns An instance of ts.SourceFile representing the given file.
         */
        getSourceFile(filename:string, languageVersion:ts.ScriptTarget, onError?: (message: string) => void):ts.SourceFile {
            try {
                var text = ts.sys.readFile(filename, this.application.compilerOptions.charset);
            } catch (e) {
                if (onError) {
                    onError(e.number === Converter.ERROR_UNSUPPORTED_FILE_ENCODING ? 'Unsupported file encoding' : e.message);
                }
                text = "";
            }

            return text !== undefined ? ts.createSourceFile(filename, text, languageVersion, /*version:*/ "0") : undefined;
        }


        /**
         * Return the full path of the default library that should be used.
         *
         * Implementation of ts.CompilerHost.getDefaultLibFilename()
         *
         * @returns The full path of the default library.
         */
        getDefaultLibFilename():string {
            var lib = this.getDefaultLib();
            var path = ts.getDirectoryPath(ts.normalizePath(td.tsPath));
            return Path.join(path, 'bin', lib);
        }


        /**
         * Return the full path of the current directory.
         *
         * Implementation of ts.CompilerHost.getCurrentDirectory()
         *
         * @returns The full path of the current directory.
         */
        getCurrentDirectory():string {
            return this.currentDirectory || (this.currentDirectory = ts.sys.getCurrentDirectory());
        }


        /**
         * Return whether file names are case sensitive on the current platform or not.
         *
         * Implementation of ts.CompilerHost.useCaseSensitiveFileNames()
         *
         * @returns TRUE if file names are case sensitive on the current platform, FALSE otherwise.
         */
        useCaseSensitiveFileNames():boolean {
            return ts.sys.useCaseSensitiveFileNames;
        }


        /**
         * Return the canonical file name of the given file.
         *
         * Implementation of ts.CompilerHost.getCanonicalFileName()
         *
         * @param fileName  The file name whose canonical variant should be resolved.
         * @returns The canonical file name of the given file.
         */
        getCanonicalFileName(fileName:string):string {
            return ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase();
        }


        /**
         * Return the new line char sequence of the current platform.
         *
         * Implementation of ts.CompilerHost.getNewLine()
         *
         * @returns The new line char sequence of the current platform.
         */
        getNewLine():string {
            return ts.sys.newLine;
        }


        /**
         * Write a compiled javascript file to disc.
         *
         * As TypeDoc will not emit compiled javascript files this is a null operation.
         *
         * Implementation of ts.CompilerHost.writeFile()
         *
         * @param fileName  The name of the file that should be written.
         * @param data  The contents of the file.
         * @param writeByteOrderMark  Whether the UTF-8 BOM should be written or not.
         * @param onError  A callback that will be invoked if an error occurs.
         */
        writeFile(fileName:string, data:string, writeByteOrderMark:boolean, onError?:(message: string) => void) { }
    }
}
