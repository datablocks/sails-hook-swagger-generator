/**
 * Our hook
 */
var swaggerDoc = require("./lib/swaggerDoc");

module.exports = function (sails) {
    return {

        defaults: {
            disabled: false,
            __configKey__: {
                swaggerJsonPath: sails.config.appPath + "/swagger/swagger.json",
                parameters: { //we can add up custom parameters here
                    PerPageQueryParam: {
                        in: 'query',
                        name: 'perPage',
                        required: false,
                        type: 'integer',
                        description: 'This helps with pagination and when the limit is known for pagify'
                    }
                },
                blueprint_parameters: {list: [{$ref: '#/parameters/PerPageQueryParam'}]},//we can add custom blueprint action to parameters binding here, any specified overrides default created
                swagger: {
                    swagger: '2.0',
                    info: {
                        title: 'Swagger Json',
                        description: 'This is a generated swagger json for your sails project',
                        termsOfService: 'http://example.com/terms',
                        contact: {
                            name: 'Datablocks',
                            url: 'http://datablocks.net',
                            email: 'email@datablocks.net'
                        },
                        license: {name: 'Apache 2.0', url: 'http://www.apache.org/licenses/LICENSE-2.0.html'},
                        version: '1.0.0'
                    },
                    // host: 'localhost', // DOES NOT NEED TO BE SET
                    basePath: '/',
                    externalDocs: {url: 'http://datablocks.net'}
                }
            }
        },
        // Run when sails loads-- be sure and call `next()`.
        initialize: function (next) {
            let that = this
            sails.on('hook:orm:loaded', function(){
                swaggerDoc(sails, that);
                return next();
            })
        }

    };
};
