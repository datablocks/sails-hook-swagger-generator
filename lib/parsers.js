/**
 * Created by theophy on 02/08/2017.
 */
const formatters = require('./type-formatter');
const _ = require('lodash');
const rest2action = require('./rest2action')

/**
 * this is used to parse our attributes to give us the properties and required field and it's based
 * on swagger specifications, so we map each sails types to swagger types
 * and also validation rules are added for just the ones handles in our @link type-formatter.js
 * @param attributes
 * @returns {{properties: {}, required: Array}}
 * @private
 */
function _parseAttributes(attributes) {
    var properties = {};
    var required = [];
    _.forEach(attributes, function (attribute, name) {
        var property = {};
        property[name] = _.clone(formatters.attribute_type(attribute.type));//dereference our object here

        //filter out required fields here
        if (_.has(attribute, 'required') && attribute.required === true)
            required.push(name);

        //scan through validation types
        _.forEach(attribute, function (value, rule) {
            rule = formatters.validation_type(rule); //transform rule here
            if (rule) {//if it is existing in our formatter add it else leave it
                property[name][rule] = value;
            }
        });

        _.merge(properties, property);//add the property to our properties
    });

    var parsed = {properties: properties, required: required};
    if (parsed.required.length === 0) //if the required field is empty we remove it, not needed
        delete parsed.required;

    return parsed;
}


/**
 * this is used to parse our routes from config/routes then break it down
 * to a form which is readable and transversing is easy
 * for all route under an {identity:[http_method,path,action]
 * @param routes
 * @returns {{}}
 * @private
 */
function _parseRoutes(routes) {
    var custom_routes = {};

    /**
     * we need to check for routes without verb or method
     * which means for a path allow any CRUD method (GET, PUT, POST, DELETE or PATCH) when a method is not specified
     * so we create dublicate and prepend the http method or verb
     */

    routes = _handleRoutesWithNoVerb(routes);


    _.forEach(routes, function (controller_action, method_path) {
        if (method_path === "/csrfToken") //exclude this csrfToken route not needed
            return;

        let response = controller_action.response
        /**
         * for those route using object instead of regular 'method path'.'controller.action'
         * we remove the swagger option if available
         * @type {{}}
         */
        var swagger_property = {};
        if (_.isObject(controller_action)) {

            // applying actions/controllers to config routes that dont have them:

            // has method, and missing controller and action-  meaning we may need to override a blueprints route
            // ie.  "delete /user/:id"
            //
            if(method_path.indexOf(' ')>-1 && !controller_action.view && !controller_action.controller && !controller_action.action){
                let { controller, action } = rest2action(method_path)
                // //controller might not exist, if it doesnt, then it wont find a matching tag, and will end up in "View Routes" section
                controller_action.controller = controller
                controller_action.action = action  // possibly change to function that
            }

            swagger_property = controller_action.swagger;
            // if(swagger_property && swagger_property.action && swagger_property.controller){
            //     controller_action = swagger_property.controller + "." + swagger_property.action;
            // }else{
            controller_action = controller_action.controller + "." + controller_action.action;
            // }


        }

        var model_identity = controller_action.indexOf("Controller") > -1 ? controller_action.substring(0, controller_action.indexOf("Controller")).toLowerCase() : controller_action.substring(0, controller_action.indexOf(".")).toLowerCase();


        method_path = method_path.split(/ (.+)/);//get only the first instance of our space splitting

        if (!custom_routes[model_identity])   //first time
            custom_routes[model_identity] = [];//declare as array

        var full_path = method_path[1].trim().split("/:");

        //now we extend and use the swagger to override our default route property, incase the user wants to change description and summary
        var property = _.defaults(swagger_property, {
            http_method: method_path[0].trim().toLowerCase(),
            path: full_path[0],
            action: controller_action.substring(controller_action.indexOf(".") + 1), //remove the .
            keys: full_path.splice(1),//remove the first initial path and return the split as array
            summary: '',
            description: '',
            response:response,
            body: {}, //format as sails attributes, {field:{type,validation...}, ...}
            query: [],//array of the query types
            custom: true // to differentiate custom route from route.js
        });
        let policies = sails.config.policies[[model_identity,property.action].join('/')] || sails.config.policies[[model_identity,'*'].join('/')]
        if(policies)
            property.summary += ' __,.-\'~\'-.,__,.-\'~\'-.,__ Policy:' + policies
        //we don't need the body if it's not for post or put
        if (property.http_method !== 'post' && property.http_method !== 'put') {
            delete property.body;
        }


        custom_routes[model_identity].push(property);
    });

    return custom_routes;
}

/**
 * this is used to handle routes with no verb or http method
 * which means for a path allow any CRUD method (GET, PUT, POST, DELETE or PATCH) when a method is not specified
 * so we create dublicate and prepend the http method or verb
 * @param routes
 * @returns {*}
 * @private
 */
function _handleRoutesWithNoVerb(routes) {
    var refined_routes = _.clone(routes);

    _.forEach(routes, function (controller_action, method_path) {
        if (method_path === "/csrfToken") //exclude this csrfToken route not needed
            return;

        method_path = method_path.split(/ (.+)/);//get only the first instance of our space splitting

        if (method_path.length === 1) { //means no verb just path
            refined_routes['post ' + method_path[0]] = controller_action;
            refined_routes['get ' + method_path[0]] = controller_action;
            refined_routes['put ' + method_path[0]] = controller_action;
            refined_routes['delete ' + method_path[0]] = controller_action;
            refined_routes['patch ' + method_path[0]] = controller_action;

            // now delete the current key without verb or http method
            delete refined_routes[method_path[0]];
        }

    });


    return refined_routes;
}

module.exports = {
    attributes: _parseAttributes,
    routes: _parseRoutes
};
