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

define.Class('raptor/resources/SearchPathEntry', function(require) {
    "use strict";
    
    return {
        /**
         *
         * @param {String} path The relative path for the resource to search for.
         *
         * <p>
         * The relative path is assumed to be relative to the base path for the search path entry.
         * 
         * @returns {raptor/resources/Resource} Return an instance of {@Link raptor/resources/Resource} or null if not found
         */
        findResource: function(path) {
            throw new Error('Not Implemented');
        }
    };
});