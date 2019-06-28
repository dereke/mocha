#!/usr/bin/env node

'use strict';

/**
 * This is where we finally parse and handle arguments passed to the `mocha` executable.
 * Option parsing is handled by {@link https://npm.im/yargs yargs}.
 * If executed via `node`, this module will run {@linkcode module:lib/cli/cli.main main()}.
 *
 * @private
 * @module
 */

const debug = require('debug')('mocha:cli:cli');
const symbols = require('log-symbols');
const yargs = require('yargs/yargs');
const path = require('path');
const {loadOptions, YARGS_PARSER_CONFIG} = require('./options');
const commands = require('./commands');
const ansi = require('ansi-colors');
const {repository, homepage, version, gitter} = require('../../package.json');

/**
 * - Accepts an `Array` of arguments
 * - Modifies {@link https://nodejs.org/api/modules.html#modules_module_paths Node.js' search path} for easy loading of consumer modules
 * - Sets {@linkcode https://nodejs.org/api/errors.html#errors_error_stacktracelimit Error.stackTraceLimit} to `Infinity`
 * @summary Mocha's main entry point from the command-line.
 * @param {string[]} argv - Array of arguments to parse, or by default the lovely `process.argv.slice(2)`
 */
exports.main = (argv = process.argv.slice(2)) => {
  debug('entered main with raw args', argv);
  // ensure we can require() from current working directory
  module.paths.push(process.cwd(), path.resolve('node_modules'));

  Error.stackTraceLimit = Infinity; // configurable via --stack-trace-limit?

  var args = loadOptions(argv);

  return new Promise((resolve, reject) => {
    const asyncifyCmd = cmd => {
      const originalHandler = cmd.handler;
      return Object.assign(cmd, {
        handler: argv => {
          return originalHandler(argv)
            .then(resolve)
            .catch(reject);
        }
      });
    };
    yargs()
      .scriptName('mocha')
      .command(asyncifyCmd(commands.run))
      .command(asyncifyCmd(commands.init))
      .updateStrings({
        'Positionals:': 'Positional Arguments',
        'Options:': 'Other Options',
        'Commands:': 'Commands'
      })
      .fail((msg, err, yargs) => {
        debug(err);
        yargs.showHelp();
        console.error(`\n${symbols.error} ${ansi.red('ERROR:')} ${msg}`);
        reject(err);
      })
      .help('help', 'Show usage information & exit')
      .alias('help', 'h')
      .version('version', 'Show version number & exit', version)
      .alias('version', 'V')
      .wrap(process.stdout.columns ? Math.min(process.stdout.columns, 80) : 80)
      .epilog(
        `Mocha Resources
    Chat: ${ansi.magenta(gitter)}
  GitHub: ${ansi.blue(repository.url)}
    Docs: ${ansi.yellow(homepage)}
      `
      )
      .parserConfiguration(YARGS_PARSER_CONFIG)
      .config(args)
      .parse(args._, (err, args, output) => {
        console.log(output);
        if (err) {
          reject(err);
        }
      });
  });
};

// allow direct execution
if (require.main === module) {
  exports.main();
}
