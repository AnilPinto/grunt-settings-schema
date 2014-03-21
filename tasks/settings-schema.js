/**
 * grunt-settings-schema
 * 
 *
 * Copyright (c) 2014 Anil Pinto
 * Licensed under the MIT license.
 */

'use strict';
//var _ = require('underscore')

module.exports = function (grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks
        grunt.registerMultiTask('settingsSchema', 'Read all settings-schema.json and settings.json from folder and sub-folders and create consolidated settings-schema.json and settings.json file.', function () {

        processSchemas(this.data.schema,this.data.options);
        processSettings(this.data.settings);

    });

    /**
     * This function will iterate through each settings file and create one merged json file
     * and save this json object in the destination file.
     * It expect array of src file and name and path for destination file.
     * @param settings
     */
    function processSettings(settings) {
        var settingsJSON = {},
            destFullFilepath = null;

        for(var destFilepath in settings) {
            destFullFilepath = process.cwd() + '/' + destFilepath;
            for(var srcFilepath in settings[destFilepath]) {
                var srcFilepathArray = grunt.file.expand(settings[destFilepath][srcFilepath]);
                for(var fileIndex in srcFilepathArray) {
                    addSettings(settingsJSON,srcFilepathArray[fileIndex]);
                }
            }
        }
        saveFile(settingsJSON,destFullFilepath);
    }

    /**
     * Read the settings.json file and merge it in settingsJSON.
     * @param settingsJSON
     * @param filepath
     */
    function addSettings(settingsJSON,filepath) {
        var settings = null,
            srcFullFilepath = process.cwd() + '/' + filepath;

        if ( !grunt.file.exists(srcFullFilepath)) {
            grunt.log.writeln('File does not exist: ' + srcFullFilepath);
            return
        }

        settings = grunt.file.readJSON(srcFullFilepath);

        for(var propertyName in settings) {
            settingsJSON[propertyName] = settings[propertyName];
        }
    }

    /**
     * This function will iterate through each schema file and create one merged json file
     * and save this json object in the destination file.
     * It expect array of src file and name and path for destination file.
     * @param schema
     * @param options
     */
    function processSchemas(schema,options) {

        if (schema == null ) {
            throw new TypeError('SettingsSchema: \'schema\' is missing');
        }

        var destFullFilepath = null,
            schemaJSON = {
                'title': 'Schema Title',
                'description': 'Schema for JS client application settings'
            };

        for(var destFilepath in schema) {
            destFullFilepath = process.cwd() + '/' + destFilepath;
            for(var srcFilepath in schema[destFilepath]) {
                var srcFilepathArray = grunt.file.expand(schema[destFilepath][srcFilepath]);
                for(var fileIndex in srcFilepathArray) {
                    addSchema(schemaJSON,srcFilepathArray[fileIndex]);
                }
            }
        }

        if(options != null) {
            schemaJSON.title = options.title || schemaJSON.title;
            schemaJSON.description = options.description || schemaJSON.description;
        } else {
            grunt.log.writeln('Warning: Title and description are not defined for schema settings. Using the default values');
        }

        saveFile(schemaJSON,destFullFilepath);
    }

    /**
     * Read the schema file and merge it in schemaJSON.
     * @param schemaJSON
     * @param filepath
     */
    function addSchema(schemaJSON,filepath) {
        var srcFullFilepath = process.cwd() + '/' + filepath;

        if (!grunt.file.exists(srcFullFilepath)) {
            grunt.log.writeln('File does not exist: ' + srcFullFilepath);
            return
        }

        var schema = grunt.file.readJSON(srcFullFilepath);
        addJSON(schemaJSON,schema);
    }

    /**
     * This function will iterate through each schema object and merge it in schemaJSON.
     * @param schemaJSON
     * @param schema
     */
    function addJSON(schemaJSON, schema) {
        for(var propertyName in schema) {
            if(!schemaJSON.hasOwnProperty(propertyName)) {
                schemaJSON[propertyName]=schema[propertyName];
            } else if (typeof schema[propertyName] === 'object') {
                if (schema[propertyName]  instanceof Array) {
                    var len = schema[propertyName].length;
                    for(var i =0; i< len;i++) {
                        if (typeof schema[propertyName][i] === 'object') {
                            addJSON(schemaJSON[propertyName],schema[propertyName]);
                        } else {
                            if(schemaJSON[propertyName].indexOf(schema[propertyName][i]) == -1){
                                schemaJSON[propertyName].push(schema[propertyName][i]);
                            }
                        }
                    }
                } else {
                    for(var tmpPropertyName in schema[propertyName]) {
                        addJSON(schemaJSON[propertyName],schema[propertyName]);
                    }
                }
            } else {
                schemaJSON[propertyName]=schema[propertyName];
            }
        }
    }

    /**
     * Save the JSON data in file
     * @param jsonData
     * @param filepath
     */
    function saveFile(jsonData, filepath) {
        if(filepath != null) {
            grunt.file.write(filepath, JSON.stringify(jsonData,null,4));
        }
    }
};
