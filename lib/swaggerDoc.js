'use strict';
var _ = require('lodash');
var generators = require('./generators');
var fs = require('fs');

module.exports = function (sails, context) {
    if (sails.config[context.configKey].disabled === true) {
        return;
    }

    var specifications = sails.config[context.configKey].swagger;
    specifications.tags = generators.tags(sails.models);
    specifications.definitions = generators.definitions(sails.models);
    specifications.parameters = generators.parameters(sails.config, context);


    let actions = sails.getActions()
    sails.controllers = Object.keys(actions).reduce((m, key)=>{
        // currentValue =
        let [controller,action] = key.split('/')
        let c = m[controller] = m[controller] || {
            identity: controller,
            globalId: controller
        }
        // c.identity =
        c[action] = actions[key]
        // v
        return m
    },{})

    var generatedRoutes = generators.routes(sails.controllers, sails.config, specifications.tags);
     // remove any blocker routes in routes.js
    Object.keys(generatedRoutes).forEach(controllerRoutes=>{
        // _.remove(generatedRoutes[controllerRoutes],(r)=>{
        //     return r.swagger && r.swagger.disabled
        // })
        _.remove(generatedRoutes[controllerRoutes],{response:'notFound'})
        _.remove(generatedRoutes[controllerRoutes],{response:'forbidden'})
    })
    specifications.paths = generators.paths(generatedRoutes, specifications.tags, sails.config[context.configKey].blueprint_parameters);



    /**
     * clean up of specification
     * removing unwanted params
     */
    specifications.tags = _.map(specifications.tags, function (tag) {
        delete tag.identity;
        return tag;
    });

    fs.writeFile(sails.config[context.configKey].swaggerJsonPath, JSON.stringify(specifications), function (err) {
        if (err) {
            return sails.log.error(err);
        }

        sails.log.info("Swagger file generated", sails.config[context.configKey].swaggerJsonPath);
    });

    return specifications;

};
