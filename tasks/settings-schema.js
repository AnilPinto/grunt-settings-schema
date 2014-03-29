'use strict';

/**
 * grunt-settings-schema
 *
 * Copyright (c) 2014 Monitise Americas, Inc.
 * Licensed under the MIT license.
 */

var jsonSettingsSchema = require('json-settings-schema'),
    path = require('path'),
    merge = require('deepmerge'),
    Q = require('q');

module.exports = function (grunt) {

    var taskDescription = 'Read all settings-schema.json and settings.json from folder and sub-folders and create ' +
                          'consolidated settings-schema.json and settings.json file. Validate them and save validated ' +
                          'result in settings.json file.',

        buildMasterSchema = function (masterSchemaJson, schemaSourceFiles) {
            var i, j,
                schemaSourceFilePath,
                schemaSourceFilesInPath,
                schemaJson,
                appendAndEnforceUniqueness = function (_targetProperty, _masterSchemaJson, _schemaJson) {

                    var _propertyName;

                    // append `properties` into schema, checking for duplicate names
                    for (_propertyName in schemaJson[_targetProperty]) {

                        if (!schemaJson[_targetProperty].hasOwnProperty(_propertyName)) {
                            continue;
                        }

                        if (_masterSchemaJson[_targetProperty].hasOwnProperty(_propertyName)) {
                            grunt.fail.warn('composite schema already has property named \'' + _propertyName + '\'' +
                                ' within \'' + _targetProperty + '\' will be overwritten by definition in file \'' +
                                schemaSourceFilesInPath[j] + '\'');
                        }
                        _masterSchemaJson[_targetProperty][_propertyName] = _schemaJson[_targetProperty][_propertyName];
                    }
                };

            // append all schema files in expanded form (e.g. account for things like `some/**/*file-names.json`)
            for(i = 0; i < schemaSourceFiles.length; i++) {
                                                                            2
                // build the file path based on current directory
                schemaSourceFilePath = schemaSourceFiles[i];

                // expand the file path in the event of wildcard usage
                schemaSourceFilesInPath = grunt.file.expand(schemaSourceFilePath);

                // all files matching the pattern
                for(j = 0; j < schemaSourceFilesInPath.length; j++) {

                    // grab the contents of the new schema file to be appended
                    schemaJson = grunt.file.readJSON(schemaSourceFilesInPath[j]);

                    // add required properties to master schema, if any are specified
                    if (schemaJson.required) {

                        // enforce that required is an array, otherwise something is wrong with the schema
                        if ('array' !== grunt.util.kindOf(schemaJson.required)) {
                            throw new TypeError('invalid type \'' + grunt.util.kindOf(schemaJson.required) + '\' for \'required\'' +
                                ' attribute within JSON schema (array expected) in file \'' + schemaSourceFilesInPath[j] + '\'');
                        }

                        masterSchemaJson.required = masterSchemaJson.required.concat(grunt.util.toArray(schemaJson.required));
                    }

                    // if there are no properties defined, the schema file is useless
                    if (!schemaJson.hasOwnProperty('properties')) {
                        grunt.log.error('schema file \'' + schemaSourceFilesInPath[j] +
                            '\' has no \'properties\' attribute and will be ignored (is it a valid JSON schema file?)');
                        continue;
                    }

                    // append all children of properties but enforce each newly added one as unique
                    // this ensures that no root-level properties gets silently overwritten within schemas
                    appendAndEnforceUniqueness('properties', masterSchemaJson, schemaJson);

                    if (!schemaJson.definitions) {
                        continue;
                    }

                    // append all children of definitions but enforce each newly added one as unique
                    // this ensures that no definitions get silently overwritten within schemas
                    appendAndEnforceUniqueness('definitions', masterSchemaJson, schemaJson);
                }
            }
            return masterSchemaJson;
        };



    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks
    grunt.registerMultiTask('settingsSchema', taskDescription, function () {

        var done = this.async(),
            multiTaskTargetConfigPath = this.name + '.' + this.target,
            schemaTargetConfigPath = multiTaskTargetConfigPath + '.schema.target',
            schemaSourcesConfigPath = multiTaskTargetConfigPath + '.schema.src',
            settingsConfigPath = multiTaskTargetConfigPath + '.settings',
            masterSchemaTargetOutputFile,
            schemaSources,
            masterSchema,
            settingsTargetsAndSources,
            settingsTargetOutputFileName,
            i, j,
            mergedSettings,
            newSettings,
            settingsFiles,
            settingsFilePath,

            // set up defaults
            options = this.options({
                schema: {
                    title: 'Generated Combined Schema',
                    description: 'Generated on ' + new Date()
                }
            }),

            validateAndWriteSettings = function (_settingsTargetOutputFileName, _mergedSettings, _masterSchema) {
                console.log(_settingsTargetOutputFileName);
                var pending = Q.defer();
                jsonSettingsSchema.validate(_mergedSettings, _masterSchema, function (err, validatedSettings) {
                    if (err) {
                        console.log(err);
                        grunt.fail.fatal(err, 1);
                    }
                    grunt.file.write(_settingsTargetOutputFileName, JSON.stringify(validatedSettings, null, 4));
                    pending.resolve();
                });
                return pending.promise;
            },

            // async tasks remaining
            validating = [];

        this.requiresConfig(schemaTargetConfigPath);
        this.requiresConfig(schemaSourcesConfigPath);
        this.requiresConfig(settingsConfigPath);

        masterSchemaTargetOutputFile = grunt.config(schemaTargetConfigPath);
        schemaSources = grunt.config(schemaSourcesConfigPath);
        settingsTargetsAndSources = grunt.config(settingsConfigPath);

        grunt.verbose.writeln('building master schema from sources: ', schemaSources);
        masterSchema = {
            title: options.schema.title,
            description: options.schema.description,
            type: 'object',
            properties: {},
            required: [],
            definitions: {}
        };
        masterSchema = buildMasterSchema(masterSchema, schemaSources);

        grunt.verbose.writeln('writing master schema file result from merged sub-schemas to file: ' + masterSchemaTargetOutputFile);
        grunt.file.write(masterSchemaTargetOutputFile, JSON.stringify(masterSchema, null, 4));

        grunt.verbose.writeln('building all specified settings files from sources');

        // build settings for each target: ['sources'] combination specified
        for (settingsTargetOutputFileName in settingsTargetsAndSources) {
            // ignore bogus properties
            if (!settingsTargetsAndSources.hasOwnProperty(settingsTargetOutputFileName)) {
                continue;
            }

            grunt.verbose.writeln('merging all settings files into target output file ' + settingsTargetOutputFileName + '...');
            mergedSettings = {};
            for(i = 0; i < settingsTargetsAndSources[settingsTargetOutputFileName].length; i++) {
                // allow for wildcard file paths
                settingsFilePath = settingsTargetsAndSources[settingsTargetOutputFileName][i];
                // settingsFilePath = settingsTargetsAndSources[settingsTargetOutputFileName][i];
                settingsFiles = grunt.file.expand(settingsFilePath);
                if (!settingsFiles.length) {
                    grunt.verbose.warn('no files found for path: ', settingsFilePath);
                    continue;
                }
                for(j = 0; j < settingsFiles.length; j++) {
                    newSettings = grunt.file.readJSON(settingsFiles[j]);
                    grunt.verbose.write('merging file ' + settingsFiles[j] + '...');
                    mergedSettings = merge(mergedSettings, newSettings);
                    grunt.verbose.ok();
                }
            }

            grunt.verbose.writeln('writing to file ' + settingsTargetOutputFileName);
            validating.push(validateAndWriteSettings(settingsTargetOutputFileName, mergedSettings, masterSchema));
        }

        Q.all(validating).then(function() {
            done();
        });

    });

};
