/**
 * @extension Server
 */
raptor.extend(
    "templating.compiler",
    function(raptor, compiler) {
        var resources = raptor.require('resources'),
            strings = raptor.require('strings'),
            json = raptor.require('json'),
            packaging = raptor.require("packaging"),
            forEachEntry = raptor.forEachEntry,
            errors = raptor.errors,
            loadedTaglibs = {},
            registeredTaglibs = {},
            registerTaglib = function(uri, path, registryResource) {
                if (!strings.endsWith(path, "/package.json")) {
                    path += "/package.json";
                }
                registeredTaglibs[uri] = {
                        path: path,
                        searchPathEntry: registryResource.getSearchPathEntry(),
                        registryPath: registryResource.getSystemPath()
                };
            },
            searchPathListenerHandler = null;
        
        packaging.enableExtension("templating.compiler");
        
        return {
            /**
             * 
             * @param path
             * @returns
             */
            compileResource: function(path) {
                var resource = resources.findResource(path);
                if (!resource.exists()) {
                    errors.throwError(new Error('Unable to compile template with resource path "' + path + '". Resource not found'));
                }
                var src = resource.readFully(src);
                return this.compile(src, resource.getSystemPath());
            },
            
            /**
             * 
             * @param path
             * @returns
             */
            compileAndLoadResource: function(path) {
                var resource = resources.findResource(path);
                if (!resource.exists()) {
                    errors.throwError(new Error('Unable to compile template with resource path "' + path + '". Resource not found'));
                }
                var src = resource.readFully(src);
                this.compileAndLoad(src, resource.getSystemPath());
            },
            
            /**
             * 
             * @returns
             */
            discoverTaglibs: function() {
                packaging.forEachTopLevelPackageManifest(function(manifest) {
                    var taglibs = manifest.taglibs;
                    if (taglibs) {
                        forEachEntry(taglibs, function(uri, path) {
                            registerTaglib(uri, path, manifest.getPackageResource());
                        }, this);
                    }
                }, this);
                
                forEachEntry(registeredTaglibs, function(uri) {
                    this.loadTaglibPackage(uri);
                }, this);
                
                if (!searchPathListenerHandler) {
                    searchPathListenerHandler = raptor.resources.getSearchPath().subscribe("modified", function() {
                        this.discoverTaglibs(); //If the search path is modified then rediscover the 
                    }, this);
                }
            },
            
            /**
             * 
             * @param resource
             * @returns
             */
            loadTaglibPackage: function(uri) {
                if (loadedTaglibs[uri] === true) {
                    return;
                }
                loadedTaglibs[uri] = true;
                
                //console.log('Loading taglib with URI "' + uri + '"...');
                
                var taglibInfo = this._getTaglibInfo(uri);
                
                var packagePath = taglibInfo.path,
                    searchPathEntry = taglibInfo.searchPathEntry,
                    registryPath = taglibInfo.registryPath;
                
                var packageResource = resources.findResource(packagePath, searchPathEntry);
                
                if (!packageResource.exists()) {
                    errors.throwError(new Error('Taglib package not found at path "' + packagePath + '" in search path entry "' + searchPathEntry + '". This taglib was referenced in "' + registryPath + '"'));
                }
                
                packaging.loadPackage(packageResource);
            },
            
            _getTaglibInfo: function(uri) {
                var taglibInfo = registeredTaglibs[uri];
                if (!taglibInfo) {
                    errors.throwError(new Error('Unknown taglib "' + uri + '". The path to the package.json is not known.'));
                }
                return taglibInfo;
            },
            
            /**
             * 
             * @param taglibXml
             * @param path
             * @returns
             */
            loadTaglibXml: function(taglibXml, path) {
                var TaglibXmlLoader = raptor.require("templating.compiler.TaglibXmlLoader");
                var taglib = TaglibXmlLoader.load(taglibXml, path);
                compiler.addTaglib(taglib);
                return taglib;
            },
            
            /**
             * 
             * @param taglibXml
             * @param path
             * @returns
             */
            compileTaglib: function(taglibXml, path) {
                var TaglibXmlLoader = raptor.require("templating.compiler.TaglibXmlLoader");
                var taglib = TaglibXmlLoader.load(taglibXml, path);
                return "$rtld(" + json.stringify(taglib) + ")";
            }
           
        };
    });