/* Load dependencies */
var Promise = require( "bluebird" ),
    spawn = require( "child_process" ).spawn,
    path = require( "path" );
/**
 * Compiles a tex file one or more times.
 *
 * @param {string} file - path to the tex file
 * @param {string} [engine=pdflatex] - which engine to use to compile the file
 * @param {Object[]} runs - An array specifying the runs
 * @param {number} runs[].runs how many times the file should be compiled with the corresponding arguments
 * @param {Object[]} runs[].options arguments used to run the engine
 *
 * @return {Object} a promise for the output file name
 */



function compileTex ( file, engine, runs ) {
    var parsedFile = path.parse( file );
    parsedFile.ext = ".pdf";
    var outputFile = path.format( parsedFile );
    var defaultOptions = [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-file-line-error"
    ];
    engine = engine || "pdflatex";

    if ( runs === undefined ) {
        runs = [{
            "runs": 2,
            "options": defaultOptions
        }];
    }

    var optionsForMapping = runs.map( function( currentValue ){
        var tmp = [];
        for ( var i = 0; i < currentValue.runs; i++ ) {
            tmp.push( currentValue.options );
        }
        this.push( tmp );
    }, [] );



    function texPromise ( options ) {
        if ( !Array.isArray( options ) ) {
          options = options !== undefined ? [ options ] : defaultOptions;
        }
        options.push( file );

        var texSpawn = spawn( engine, options, { "cwd": parsedFile.dir } );

        var texPromise = new Promise(function( resolve, reject ){
            var stdrerrMessage = "",
                stdoutMessage = "";
            texSpawn.stderr.on( "data", function( data ){
                stdrerrMessage += data.toString();
            });
            texSpawn.stdout.on( "data", function( data ){
                stdoutMessage += data.toString();
            });
            texSpawn.on( "close", function( code ){
                if ( code !== 0 ) {
                    var error = new Error( stdoutMessage );
                    error.stdrerrMessage = stdrerrMessage;
                    error.exitCode = code;
                    reject( error );
                } else {
                    resolve( outputFile );
                }
            });
        });
        return texPromise;
    }

    return Promise.each( optionsForMapping, texPromise );

}

module.exports = compileTex;
