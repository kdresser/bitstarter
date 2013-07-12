#!/usr/bin/env node
var fs      = require('fs'       );
var program = require('commander');
var cheerio = require('cheerio'  );
var restler = require('restler'  );
var util    = require('util'     );
var CHECKSFILE_DEFAULT = "checks.json";
var HTMLFILE_DEFAULT = "index.html"; 
var HTMLURL_DEFAULT = "";            

var getFileSync = function(pfn) {
  // Return empty string if file DNE.
  if (!fs.existsSync(pfn)) {  return '' };
  return fs.readFileSync(pfn);
};

var checkHtmlString = function(htmlstr, chksfile) {
    // It's late, but complain and exit if chksfile DNE.
    if (!fs.existsSync(program.checks)) {
        console.log("Checks file '%s' DNE", chksfile);
        return;
    }
    $ = cheerio.load(htmlstr);
    var checkJson = {};
    var checks = JSON.parse(getFileSync(chksfile)).sort();
    for (var ii in checks) {
        var present = $(checks[ii]).length > 0;
        checkJson[checks[ii]] = present;
    }
  var outJson = JSON.stringify(checkJson, null, 4);
  console.log(outJson);
}

var processFile = function(pfn, chksfile) {
  if (fs.existsSync(pfn))   { 
    fs.readFile(pfn, function(err, data) {
      if (err) {
        console.log("Error reading '%s'", pfn);
      } else {
        checkHtmlString(data, chksfile);  
      };
    });
  } else {
    console.log("File '%s' DNE", pfn);  
  }
};

var processURL = function(url, chksfile) {
  restler.get(url).on('complete', function(result, response) {
        if (result instanceof Error) {
            console.log('Error: ' + util.format(result.message));
            return;
        };
        if (response.statusCode != 200) { 
            console.log('Error: page not found');
            return;
        }
        checkHtmlString(result, chksfile);
  });
};

if (require.main == module) {
    // Get the options, without anything fancy checking.
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', String, CHECKSFILE_DEFAULT)
        .option('-f, --file   <html_file>',  'Path to index.html',  String, HTMLFILE_DEFAULT  )
        .option('-u, --url    <html_url>',   'URL to index.html',   String, HTMLURL_DEFAULT  )
        .parse(process.argv);
    //
    // Check a URL? (Do this first, bcs file defaults).
    if (program.url != '') {
      program.file = '';            // Prevent double checks.
      processURL(program.url, program.checks);
    }
    //
    // Check a file?
    if (program.file != '') {
      processFile(program.file, program.checks);
    }
} else {
    exports.checkProcessFile = checkProcessFile;
    exports.checkProcessURL = checkProcessURL;
    exports.checkHtmlString = checkHtmlString;
}
