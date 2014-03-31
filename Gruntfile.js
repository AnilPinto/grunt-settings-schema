/*
 * grunt-settings-schema
 * 
 *
 * Copyright (c) 2014 Monitise Americas, Inc.
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
    // load all npm grunt tasks
    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({

        tmpDir: 'tmp',
        testDir: 'test',

        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/**/*.js',
                '<%= nodeunit.tests %>'
            ],
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },

        // Configuration to be run (and then tested).
        settingsSchema: {
            options: {
                schema: {
                    title: 'Sample Schema',
                    description: 'Schema for JS application settings'
                }
            },
            target: {
                schema: {
                    'target': '<%= tmpDir %>/settings-schema.json',
                    'src': [
                        '<%= testDir %>/sample/**/settings-schema.json'
                    ]
                },
                settings: {
                    '<%= tmpDir %>/settings.json': [
                        '<%= testDir %>/sample/**/settings.json'
                    ]
                }
            }
        },

        // Unit tests.
        nodeunit: {
            tests: ['test/*test.js']
        }

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['jshint', 'clean', 'settingsSchema', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['test']);

};
