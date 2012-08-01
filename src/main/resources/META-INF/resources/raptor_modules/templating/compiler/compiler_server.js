/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @extension Server
 */
raptor.extend(
    "templating.compiler",
    function(raptor, compiler) {
        "use strict";
        
        var resources = raptor.require('resources'),
            json = raptor.require('json'),
            packager = raptor.require("packager"),
            forEachEntry = raptor.forEachEntry,
            errors = raptor.errors,
            discoveryComplete = false,
            searchPathListenerHandler = null,
            watchingEnabled = false,
            watchers = [];
        
        return {
            /**
             * 
             * @param path
             * @returns
             */
            compileResource: function(path, options) {
                var resource = resources.findResource(path);
                if (!resource.exists()) {
                    errors.throwError(new Error('Unable to compile template with resource path "' + path + '". Resource not found'));
                }
                var src = resource.readFully(src);
                return this.compile(src, resource.getSystemPath(), options);
            },
            
            enableWatching: function() {
                watchingEnabled = true;
            },
            
            disableWatching: function() {
                watchingEnabled = false;
            },
            
            /**
             * 
             * @param path
             * @returns
             */
            compileAndLoadResource: function(path, options) {
                var resource = resources.findResource(path);
                if (!resource.exists()) {
                    errors.throwError(new Error('Unable to compile template with resource path "' + path + '". Resource not found'));
                }
                
                
                
                this.compileAndLoad(resource.readFully(), resource.getSystemPath(), options);
                
                if (watchingEnabled && resource.isFileResource()) {
                    raptor.require('file-watcher').watch(
                        resource.getSystemPath(), 
                        function() {
                            this.logger().info('Template modified at path "' + resource.getSystemPath() + '". Reloading template...');
                            this.compileAndLoad(resource.readFully(), resource.getSystemPath(), options);
                        },
                        this);
                }
            },
            
            /**
             * 
             * @returns
             */
            discoverTaglibs: function() {
                if (discoveryComplete) {
                    return;
                }
                discoveryComplete = true;
                
                packager.forEachTopLevelPackageManifest(function(manifest) {
                    var taglibs = manifest['raptor-taglibs'];
                    if (taglibs) {
                        forEachEntry(taglibs, function(uri, rtldPath) {
                            if (!compiler.hasTaglib(uri)) {
                                var rtldResource = manifest.resolveResource(rtldPath),
                                    taglibXml = rtldResource.readFully();
                            
                                this.loadTaglibXml(taglibXml, rtldResource.getSystemPath());    
                            }
                        }, this);
                    }
                }, this);

                if (!searchPathListenerHandler) {
                    searchPathListenerHandler = raptor.resources.getSearchPath().subscribe("modified", function() {
                        discoveryComplete = false;
                        this.discoverTaglibs(); //If the search path is modified then rediscover the taglibs
                    }, this);
                }
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