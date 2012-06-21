require('./init-raptor.js');

var logger = raptor.require('logging').logger('_helper');
var codeCoverageReporter = require('./code-coverage-reporter.js');

jasmine.Matchers.prototype.toNotStrictlyEqual = function(expected) {
    return this.actual !== expected;
};

jasmine.Matchers.prototype.toStrictlyEqual = function(expected) {
    return this.actual === expected;
};

jasmine.Matchers.prototype.toEqualArray = function(expected) {
    if (this.actual == expected) {
        return true;
    }
    
    if (!this.actual || !expected) return false;
    
    if (this.actual.constructor !== Array) return false;
    if (expected.constructor !== Array) return false;
    
    
    if (this.actual.length != expected.length) return false;
    var i=0,
        len=this.actual.length;
    
    
    
    for (;i<len; i++) {
        if (this.actual[i] != expected[i]) {
            return false;
        }
    }
    return true;
};

//Add support for "before" and "after" methods
getEnv().addReporter({
    reportSpecStarting: function(spec) {
        var suite = spec.suite;
        if (suite.__started !== true) {
            if (suite.beforeFunc) {
                suite.beforeFunc.call(suite, suite);
            }
            suite.__started = true;
        }
        
    },
    reportSpecResults: function(spec) { 
    },
    reportSuiteResults: function(suite) { 
        if (suite.afterFunc) {
            suite.afterFunc.call(suite, suite);
        }
    },
    
    reportRunnerResults: function(runner) {
        createRaptor();
        
        if (typeof _$jscoverage !== 'undefined') {
            codeCoverageReporter.save(_$jscoverage);
        }
    }
});

jasmine.Env.prototype.before = function(beforeFunc) {
    this.currentSuite.beforeFunc = beforeFunc;
};

jasmine.Env.prototype.after = function(afterFunc) {
    this.currentSuite.afterFunc = afterFunc;
};

var isCommonJS = typeof window == "undefined";

before = function() {
    jasmine.Env.prototype.before.apply(getEnv(), arguments);
};

after = function() {
    jasmine.Env.prototype.after.apply(getEnv(), arguments);
};

if (isCommonJS) {
    exports.before = before;
    exports.after = after;
}
var readTemplate = function(path) {
        var resource = raptor.resources.findResource(path);
        if (!resource.exists()) {
            throw new Error('Template not found at path "' + path + '"');
        }
        var src = resource.readFully();
        return src;
    },
    compileAndLoad = function(templatePath, invalid) {
        try
        {
            var templateCompiler = raptor.require("templating.compiler").createCompiler({logErrors: invalid !== true, minify: false, templateName: templatePath});
            var src = readTemplate(templatePath);
            var compiledSrc = templateCompiler.compile(src, templatePath);
            console.log('\n==================================\nCompiled source (' + templatePath + '):\n----------------------------------\n', compiledSrc, "\n----------------------------------\n");
            
            raptor.require("templating");
            
            try
            {
                eval(compiledSrc);
            }
            catch(e) {
                console.error(e.stack);
                throw new Error(e);
            }
            
            return compiledSrc;
        }
        catch(e) {
            if (!invalid) {
                logger.error(e);
            }
            
            throw e;
        }
    },
    compileAndRender = function(templatePath, data, invalid, context) {
        try
        {
            var compiledSrc = compileAndLoad(templatePath, invalid);
            
            var output = raptor.require("templating").renderToString(templatePath, data, context);
            console.log('==================================\nOutput (' + templatePath + '):\n----------------------------------\n', output, "\n----------------------------------\n");
            
            return {
                compiled: compiledSrc,
                output: output
            };
        }
        catch(e) {
            if (!invalid) {
                logger.error(e);
            }
            
            throw e;
        }
    };
    
getTestHtmlPath = function(relPath) {
    var nodePath = require('path');
    return nodePath.join(__dirname, "resources/html", relPath);
};

getTestHtmlUrl = function(relPath) {
    var nodePath = require('path');
    return 'file://' + nodePath.join(__dirname, "resources/html", relPath);
};

getTestJavaScriptPath = function(relPath) {
    
    var nodePath = require('path');

    return nodePath.join(__dirname, "resources/js", relPath);
};

//require('jsdom').defaultDocumentFeatures = {
//        FetchExternalResources   : ['script'],
//        ProcessExternalResources : false,
//        MutationEvents           : false,
//        QuerySelector            : false
//  };

getRequiredBrowserScripts = function(dependencies) {
    
    var scripts = [];
    var arrays = raptor.arrays;
    var included = {},
        extensions = {
            'browser': true, 
            'jquery': true, 
            'logging.console': true
        };
    
    var handleFile = function(path) {
        if (included[path] !== true) {
            included[path] = true;
            scripts.push("file://" + path);
        }
    };
    
    var handleModule = function(name) {
        if (included[name] === true) {
            return;
        }
        
        included[name] = true;
        
        var manifest = raptor.oop.getModuleManifest(name);
        manifest.forEachInclude({
            callback: function(type, include) {
                if (type === 'js') {
                    var resource = manifest.resolveResource(include.path);
                    handleFile(resource.getSystemPath());
                }
                else if (type === 'module') {
                    handleModule(include.name);
                }
            },
            enabledExtensions: extensions,
            thisObj: this
        });
    };

    var processDependencies = function(dependencies) {
        arrays.forEach(dependencies, function(d) {
            if (d.module) {
                handleModule(d.module);
            }
            else if (d.lib === 'jquery')
            {
                handleFile(getTestJavaScriptPath('jquery-1.7.js'));
            }
            else if (d.file)
            {
                handleFile(d.file);
            }
        });
    };
    processDependencies(dependencies);
//
//    
//        console.log('BROWSER SCRIPTS:');
//        console.log(scripts);
    return scripts;
};


helpers = {
   templating: {
       compileAndLoad: compileAndLoad,
       compileAndRender: compileAndRender
   } 
};