/**
 * grunt-settings-schema
 * 
 *
 * Copyright (c) 2014 Anil Pinto
 * Licensed under the MIT license.
 */

'use strict';
var jsonSettingsSchema = require('json-settings-schema');

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks
    grunt.registerMultiTask('settingsSchema', 'Read all settings-schema.json and settings.json from folder and sub-folders and create consolidated settings-schema.json and settings.json file. Validate them and save validated result in settings.json file.', function () {

        var destinationPath = "tmp/grunt-angular-settings.json";
        if(this.data.options.output != null) {
            destinationPath = process.cwd() + "/" + this.data.options.output;
        }

        var schema = processDefaultSchemas(this.data.schema,this.data.options);
        var settingsOverrides = processSettingsOverrides(this.data.settings);
        processMasterSchema(schema, settingsOverrides, destinationPath);
    });

    /**
     * This function will validate the master schema file and settings-override file and save the
     * result in output file.
     * @param schema
     * @param settingsOverrides
     * @param destinationPath
     */
    function processMasterSchema(schema, settingsOverrides, destinationPath) {
        var settingsJSON = "";
        jsonSettingsSchema.buildSettings(settingsOverrides, schema, function (err, settings) {

            if(err) {
                throw err;
            }

            saveFile(settings,destinationPath);
        });
    }

    /**
    * This function will iterate through each settings file and create one merged json file
    * and save this json object in the destination file.
    * It expect array of src file and name and path for destination file.
    * @param settings
    */
    function processSettingsOverrides(settings) {
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

        return settingsJSON;
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
            return;
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
    function processDefaultSchemas(schema,options) {

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
        return schemaJSON;
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
        var propertyName, len, i, tmpPropertyName;
        for (propertyName in schema) {

            // ignore if this is not an actual property
            if (!schemaJSON.hasOwnProperty(propertyName)) {
                schemaJSON[propertyName] = schema[propertyName];
                continue;
            }

            // simply assign if this is a primitive
            if ('object' !== typeof schema[propertyName]) {
                schemaJSON[propertyName] = schema[propertyName];
                continue
            }

            // recursively merge properties as needed
            if (schema[propertyName] instanceof Array) {
                len = schema[propertyName].length;
                for (i = 0; i < len; i++) {
                    if ('object' === typeof schema[propertyName][i]) {
                        addJSON(schemaJSON[propertyName], schema[propertyName]);
                        continue;
                    }
                    if (-1 === schemaJSON[propertyName].indexOf(schema[propertyName][i])) {
                        schemaJSON[propertyName].push(schema[propertyName][i]);
                    }
                }
                continue;
            }

            for (tmpPropertyName in schema[propertyName]) {
                addJSON(schemaJSON[propertyName], schema[propertyName]);
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
