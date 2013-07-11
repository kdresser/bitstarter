#!/usr/bin/env node
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio'  );
var restler = require('restler'  );
var util    = require('util'     );
var CHECKSFILE_DEFAULT = "checks.json";
var HTMLFILE_DEFAULT = "";                //"index.html";
var HTMLURL_DEFAULT = "";                 //"http://google.com";

var existsFile = function(pfn) {
  if (pfn == '') { return false };
  return (fs.existsSync(pfn));
};

var getFile = function(pfn) {
  if (existsFile(pfn))   { return fs.readFileSync(pfn) }
  else                   { return '' };
};

var cheerioString = function(str) {
  return cheerio.load(str);
}

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHTML = function(html, checksfile) {
    $ = cheerioString(html);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var doHTML = function(html, checksfile) {
  var checkJson = checkHTML(html, program.checks);
  var outJson = JSON.stringify(checkJson, null, 4);
  console.log(outJson);
};

var buildCrunch = function(checksfile) {
    var f = function(result, response) {
        if (result instanceof Error) {
            console.log('Error: ' + util.format(result.message));
            return;
        };
        if (response.statusCode != 200) { 
            console.log('Error: page not found');
            return;
        }
        doHTML(result, checksfile);
    };
    return f;
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', String, CHECKSFILE_DEFAULT)
        .option('-f, --file   <html_file>',  'Path to index.html',  String, HTMLFILE_DEFAULT  )
        .option('-u, --url    <html_url>',   'URL to index.html',   String, HTMLURL_DEFAULT  )
        .parse(process.argv);
    //
    // Checks?
    if (!existsFile(program.checks)) {
        console.log("checks file '%s' does not exist. Exiting.", program.checks);
        process.exit(1); 
    }
    //
    // File?
    if (program.file != '') {
      if (!existsFile(program.file)) {
          console.log("html file '%s' does not exist. Exiting.", program.file);
          process.exit(1); 
      }
      doHTML(getFile(program.file), program.checks);
      process.exit(0);
    }
    //
    // URL?
    if (program.url != '') {
      var doCrunch = buildCrunch(program.checks);
      restler.get(program.url).on('complete', doCrunch);
      // Wait.
    }
    // Wait.
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
