/*!*
 * @fileoverview Magnet Javascript SDK
 * {@link https://factory.magnet.com/docs/javascript-sdk/ Magnet Javascript SDK}
 *
 * @version 2.2.0
 */

(function(MagnetJS){

    /**
     * Namespace for the Magnet Javascript SDK.
     * @namespace MagnetJS
     */

/**
 * @global
 * @desc An object containing attributes used across the MagnetJS SDK.
 * @ignore
 */
MagnetJS.Config = {
    /**
     * @property {string} endpointUrl Host of the Magnet Mobile App Server.
     */
    endpointUrl            : '',
    /**
     * @property {boolean} logging Enable to display logs during code execution for debugging purposes.
     */
    logging                : true,
    /**
     * @property {boolean} locationDataCollection Enable to collection geolocation information.
     * If enabled, geolocation will be sent to the server on every request.
     */
    locationDataCollection : false,
    /**
     * @property {boolean} storeCredentials Enable to store user credentials after a successful login.
     * This is required for the LoginService.loginWithSavedCredentials method, allowing the user to login automatically
     * after a restart of the app. Note: credentials are currently stored in plain text. Defaults to false.
     */
    storeCredentials       : false,
    /**
     * @property {boolean} debugMode Ignore self-signed certificates when saving files to filesystem. Only applicable
     * for Phonegap client using FileTransfer API transport.
     */
    debugMode              : false
};

/**
 * A class containing general utility functions used across the MagnetJS SDK.
 * @memberof MagnetJS
 * @namespace Utils
 * @ignore
 */
if(!String.prototype.trim){
    String.prototype.trim = function(){
        return this.replace(/^\s+|\s+$/g, '');
    };
}
MagnetJS.Utils = {
    /**
     * Returns whether current browser is an Android device.
     */
    isAndroid : (typeof navigator !== 'undefined' && navigator.userAgent) ? /Android|webOS/i.test(navigator.userAgent) : false,
    /**
     * Returns whether current browser is an iOS device.
     */
    isIOS : (typeof navigator !== 'undefined' && navigator.userAgent) ? /iPhone|iPad|iPod/i.test(navigator.userAgent) : false,
    /**
     * Returns whether current browser is an iOS or Android device.
     */
    isMobile : (typeof navigator !== 'undefined' && navigator.userAgent) ? /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) : false,
    /**
     * Returns whether current client is a Node.js server.
     */
    isNode : (typeof module !== 'undefined' && module.exports && typeof window === 'undefined'),
    /**
     * Returns whether current client is a Cordova app.
     */
    isCordova : (typeof navigator !== 'undefined' && navigator.userAgent) &&
        (typeof window !== 'undefined' && window.location && window.location.href) &&
        (typeof cordova !== 'undefined' || typeof PhoneGap !== 'undefined' || typeof phonegap !== 'undefined') &&
        /^file:\/{3}[^\/]/i.test(window.location.href) &&
        /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent),
    /**
     * Merges the attributes of the second object to the first object.
     * @param {object} obj1 the object
     * @param {object} obj2 the object whose attributes will be merged onto the first object.
     */
    mergeObj : function(obj1, obj2){
        var obj1 = obj1 || {};
        var obj2 = obj2 || {};
        for(var p in obj2){
            try{
                if(obj2[p].constructor == Object){
                    obj1[p] = this.mergeObj(obj1[p], obj2[p]);
                }else{
                    obj1[p] = obj2[p];
                }
            }catch(e){
                obj1[p] = obj2[p];
            }
        }
        return obj1;
    },
    /**
     * Determines whether the input is a javascript object.
     * @param {*} input The input to check.
     */
    isObject : function(input){
        return Object.prototype.toString.call(input) == "[object Object]";
    },
    /**
     * Determines whether the input is a javascript array.
     * @param {*} input The input to check.
     */
    isArray : function(input){
        return Object.prototype.toString.call(input) === '[object Array]';
    },
    /**
     * Convert string to JSON or returns false.
     * @param {string} str The input to convert.
     */
    getValidJSON : function(str){
        try{
            str = JSON.parse(str);
        }catch(e){
            return false;
        }
        return str;
    },
    /**
     * Convert string to XML or returns false.
     * @param {string} str The input to convert.
     */
    getValidXML : function(str){
        if(!this.parseXml){
            if(window.DOMParser){
                this.parseXml = function(str){
                    return (new window.DOMParser()).parseFromString(str, 'text/xml');
                };
            }else if(typeof window.ActiveXObject != 'undefined' && new window.ActiveXObject('Microsoft.XMLDOM')){
                this.parseXml = function(str){
                    var xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
                    xmlDoc.async = 'false';
                    xmlDoc.loadXML(str);
                    return xmlDoc;
                };
            }
        }
        try{
            str = this.parseXml(str);
        }catch(e){
            return false;
        }
        return str;
    },
    /**
     * Convert an object into Form Data.
     * @param {string} str The input to convert.
     * @returns {string} The Form Data string.
     */
    objectToFormdata : {
        stringify : function(input){
            if(MagnetJS.Utils.isObject(input)){
                var ary = [];
                for(var key in input){
                    if(input.hasOwnProperty(key) && input[key] != null)
                        ary.push(key+'='+encodeURIComponent(input[key]));
                }
                return ary.join('&');
            }
            return '';
        }
    },
    /**
     * Get all attribute names of the given object as an array.
     * @param {object} obj The object to parse.
     */
    getAttributes : function(obj){
        var ary = [];
        obj = obj || {};
        for(var attr in obj){
            if(obj.hasOwnProperty(attr)) ary.push(attr);
        }
        return ary;
    },
    /**
     * Checks whether an object is empty.
     * @param {object} obj The object to check.
     */
    isEmptyObject : function(obj){
        if(!obj || typeof obj === 'string' || typeof obj === 'boolean' || this.isNumeric(obj)){
            return true;
        }
        if(!obj.hasOwnProperty){
            for(var i in obj){
                return false;
            }
            return true;
        }else{
            for(var i in obj){
                if(obj.hasOwnProperty(i)){
                    return false;
                }
            }
            return true;
        }
    },
    /**
     * Convert XHR and response headers into a javascript object.
     * @param {object} xhr The XMLHTTPRequest object to convert.
     */
    convertHeaderStrToObj : function(xhr){
        var obj = {};
        // for IE9+ and webkit browsers - faster performance
        if(Object.keys(xhr).forEach){
            Object.keys(xhr).forEach(function(prop){
                if((typeof xhr[prop] == 'string' || typeof xhr[prop] == 'number' || typeof xhr[prop] == 'boolean') && prop != 'responseText'){
                    obj[prop] = xhr[prop];
                }
            });
        }else{
            for(var prop in xhr){
                if((typeof xhr[prop] == 'string' || typeof xhr[prop] == 'number' || typeof xhr[prop] == 'boolean') && prop != 'responseText'){
                    obj[prop] = xhr[prop];
                }
            }
        }
        var ary = xhr.getAllResponseHeaders().split('\n');
        for(var i in ary){
            var prop = ary[i].trim().split(': ');
            if(prop.length > 1){
                obj[prop[0]] = prop[1];
            }
        }
        return obj;
    },
    /**
     * Determines whether the input is numeric.
     * @param {*} input The input to check.
     */
    isNumeric : function(input){
        return !isNaN(parseFloat(input)) && isFinite(input);
    },
    /**
     * Remove attributes not defined in attribute schema and returns result.
     * @param {object} schema The controller or model schema consistent with the server.
     * @param {object} obj The current set of entity attributes.
     */
    cleanData : function(schema, obj){
        var result = {};
        for(var attr in schema){
            if(schema.hasOwnProperty(attr) && obj[attr])
                result[attr] = obj[attr];
        }
        return result;
    },
    /**
     * Handles basic validation of object attributes based on attribute schema.
     * @param {object} schema The controller or model schema consistent with the server.
     * @param {object} attributes The current set of controller or model attributes.
     * @param {boolean} isUpdate If enabled, do not fail validation on missing required fields. Default is disabled.
     * @returns {object|boolean} An array of invalid property objects or false if validation passes.
     */
    validate : function(schema, attributes, isUpdate){
        var invalid = [], obj;
        attributes = attributes || {};
        for(var attr in schema){
            if(schema.hasOwnProperty(attr)){
                obj = {
                    attribute : attr
                };
                var type = schema[attr].type;
                if(schema[attr].optional === false && (attributes[attr] == '' || !attributes[attr])){
                    if(!isUpdate) obj.reason = 'required field blank';
                }else if(attributes[attr] && ((type == 'integer' || type == 'int' || type == 'long' || type == 'float') && !MagnetJS.Utils.isNumeric(attributes[attr]))){
                    obj.reason = 'not numeric';
                }else if(attributes[attr] && type == 'boolean' && attributes[attr] !== 'true' && attributes[attr] !== true && attributes[attr] !== 'false' && attributes[attr] !== false){
                    obj.reason = 'not boolean';
                }else if(attributes[attr] && (type == 'java.util.List' ||  type == 'array') && (!attributes[attr] || attributes[attr].length == 0 || this.isArray(attributes[attr]) === false)){
                    obj.reason = 'empty list';
                }
                if(obj.reason) invalid.push(obj);
            }
        }
        return invalid.length == 0 ? false : invalid;
    },
    /**
     * Determines whether a feature is available in the current browser or mobile client.
     * @param {string} str Name of a global variable.
     */
    hasFeature : function(str){
        try{
            return str in window && window[str] !== null;
        } catch(e){
            return false;
        }
    },
    /**
     * Determines whether the attribute is a primitive type.
     * @param {string} str The attribute type.
     */
    isPrimitiveType : function(str){
        return '|byte|short|int|long|float|double|boolean|char|string|integer|void|array|[]|java.lang.String|java.util.List|'.indexOf('|'+str+'|') != -1;
    },
    /**
     * Determines whether the attribute is of Model or Collection type.
     * @param {string} str The attribute type.
     */
    isModelOrCollection : function(str){
        return (this.isPrimitiveType(str) === false && ('|object|date|binary|_data|'.indexOf('|'+str+'|') != -1) === false);
    },
    /**
     * Converts the given Date object as an ISO 8601 Extended Format string. A shim for clients which do not support .toISOString.
     * @param {Date} date A Date object.
     * @returns {string}
     */
    dateToISO8601 : function(date){
        if(!Date.prototype.toISOString){
            (function(){
                function pad(number){
                    return (number < 10 ? '0' : '')+number;
                }
                Date.prototype.toISOString = function(){
                    return this.getUTCFullYear() +
                        '-' + pad(this.getUTCMonth() + 1) +
                        '-' + pad(this.getUTCDate()) +
                        'T' + pad(this.getUTCHours()) +
                        ':' + pad(this.getUTCMinutes()) +
                        ':' + pad(this.getUTCSeconds()) +
                        '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
                        'Z';
                };
            }());
        }
        return date.toISOString();
    },
    /**
     * Converts the given Date object as an ISO 8601 Extended Format string.
     * @param {string} str A ISO 8601 Extended Format date string.
     * @returns {object} A Date object.
     */
    ISO8601ToDate : function(str){
        var re = /(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(\.\d+)?(Z|([+-])(\d\d):(\d\d))/;
        var d = [];
        d = str.match(re);
        if(!d){
            MagnetJS.Log("Couldn't parse ISO 8601 date string '" + str + "'");
            return str;
        }
        var a = [1,2,3,4,5,6,10,11];
        for(var i in a) d[a[i]] = parseInt(d[a[i]], 10);
        d[7] = parseFloat(d[7]);
        var ms = Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6]);
        if(d[7] > 0) ms += Math.round(d[7] * 1000);
        if(d[8] != "Z" && d[10]){
            var offset = d[10] * 60 * 60 * 1000;
            if(d[11]) offset += d[11] * 60 * 1000;
            if(d[9] == "-") ms -= offset;
            else ms += offset;
        }
        return new Date(ms);
    },
    /**
     * Create a base64 encoded basic authentication string.
     * @param user Username.
     * @param pass Password.
     * @returns {string}
     */
    getBasicAuth : function(user, pass){
        return 'Basic '+btoa(user+':'+pass);
    },
    /**
     * Generate a GUID.
     * @returns {string} A new GUID.
     */
    getGUID : function(){
        var d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
        });
    }
}

/**
 * @class A simple implementation of the Promise API. A Promise object manages state and facilitates a callback after
 * all the associated asynchronous actions of a Deferred object have completed. Multiple promises can be chained with
 * the 'then' function.
 * @constructor
 */
MagnetJS.Promise = function(){
    this.successes = [];
    this.failures = [];
};

MagnetJS.Promise.prototype = {
    successes  : null,
    failures   : null,
    status     : 'pending',
    args       : null,
    _isPromise : true,
    /**
     * Stores success and error callbacks and calls them if Promise status is 'resolved' or 'rejected'.
     * @param success A callback which is fired upon a 'resolved' status.
     * @param error A callback which is fired upon a 'rejected' status.
     * @returns {MagnetJS.Promise} A promise object.
     */
    then : function(success, error){
        var defer = new MagnetJS.Deferred();
        if(success)
            this.successes.push({
                fn    : success,
                defer : defer
            });
        if(error)
            this.failures.push({
                fn    : error,
                defer : defer
            });
        if(this.status === 'resolved')
            this.exec({
                fn    : success,
                defer : defer
            }, this.args);
        else if(this.status === 'rejected')
            this.exec({
                fn    : error,
                defer : defer
            }, this.args);
        return defer.promise;
    },
    /**
     * Stores a callback which is fired if the Promise is resolved.
     * @param {function} success A success callback.
     * @returns {MagnetJS.Promise}
     */
    success : function(success){
        var defer = new MagnetJS.Deferred();
        if(success)
            this.successes.push({
                fn    : success,
                defer : defer
            });
        if(this.status === 'resolved')
            this.exec({
                fn    : success,
                defer : defer
            }, this.args);
        return this;
    },
    /**
     * Stores a callback which is fired if the Promise is rejected.
     * @param {function} error An error callback.
     * @returns {MagnetJS.Promise}
     */
    error : function(error){
        var defer = new MagnetJS.Deferred();
        if(error)
            this.failures.push({
                fn    : error,
                defer : defer
            });
        if(this.status === 'rejected')
            this.exec({
                fn    : error,
                defer : defer
            }, this.args);
        return this;
    },
    /**
     * Call and resolve a callback. If the result if a Promise object, bind a
     * new set of callbacks to the Promise to continue the chain.
     * @param {object} obj An object containing the callback function and a Deferred object.
     * @param [*] args Arguments associated with this Promise.
     */
    exec : function(obj, args){
        setTimeout(function(){
            var res = obj.fn.apply(null, args);
            if(MagnetJS.Utils.isObject(res) && res._isPromise)
                obj.defer.bind(res);
        }, 0);
    }
};
/**
 * @class A Deferred object handles execution of resolve and reject methods which trigger the success or error callback.
 * @constructor
 */
MagnetJS.Deferred = function(){
    this.promise = new MagnetJS.Promise();
};
MagnetJS.Deferred.prototype = {
    promise : null,
    /**
     * Resolve the Deferred object.
     */
    resolve : function(){
        var promise = this.promise;
        promise.args = arguments;
        promise.status = 'resolved';
        for(var i=0;i<promise.successes.length;++i)
            promise.exec(promise.successes[i], promise.args)
    },
    /**
     * Reject the Deferred object.
     */
    reject : function(){
        var promise = this.promise;
        promise.args = arguments;
        promise.status = 'rejected';
        for(var i=0;i<promise.failures.length;++i)
            promise.exec(promise.failures[i], promise.args)
    },
    /**
     * Bind a new set of callbacks to be fired upon completion of the Promise.
     */
    bind : function(promise){
        var me = this;
        promise.then(function(){
            me.resolve.apply(me, arguments);
        }, function(){
            me.reject.apply(me, arguments);
        })
    }
};
/**
 * Asynchronously execute an arbitrary number of promises and return an array of success and error arguments in 'then' function upon completion.
 * @param {MagnetJS.Promise} promises An arbitrary number of promises.
 */
MagnetJS.Deferred.all = function(){
    var deferred = new MagnetJS.Deferred();
    var successes = [], failures = [], ctr = 0, total = arguments.length;
    for(var i=0;i<total;++i){
        arguments[i].call(null).then(function(){
            successes.push(arguments);
            if(++ctr == total) deferred.resolve(successes, failures);
        }, function(){
            failures.push(arguments);
            if(++ctr == total) deferred.resolve(successes, failures);
        });
    }
    return deferred.promise;
}

/**
 * A class for extending an object with event
 * @memberof MagnetJS
 * @namespace Events
 * @ignore
 */
MagnetJS.Events = {
    /**
     * Extends an existing object to handle events.
     * @param {object} me An instance of a MagnetJS Controller.
     * @returns {boolean} Whether the event handlers were created.
     */
    create : function(me){
        if(!me._events && !me.invoke && !me.on && !me.unbind){
            me._events = {};
            me.on = function(eventId, callback){
                me._events[eventId] = me._events[eventId] || [];
                me._events[eventId].push(callback);
            }
            me.invoke = function(events){
                if(typeof events === typeof []){
                    for(var i=events.length;i--;){
                        if(me._events[events[i]]){
                            for(var j=me._events[events[i]].length;j--;){
                                me._events[events[i]][j].apply(this, [].slice.call(arguments, 1));
                            }
                        }
                    }
                }else{
                    if(me._events[events]){
                        for(var k=me._events[events].length;k--;){
                            me._events[events][k].apply(this, [].slice.call(arguments, 1));
                        }
                    }
                }
            }
            me.unbind = function(eventId){
                if(me._events[eventId]) delete me._events[eventId];
            }
            return true;
        }else{
            return false;
        }
    }
}

/**
 * A class for storing a value into persistent storage. Currently relies on HTML5 localStorage.
 * Clients which do not support localStorage will fall back to memory store which will not persist past a
 * restart of the app.
 * @memberof MagnetJS
 * @namespace Storage
 * @ignore
 */
MagnetJS.Storage = {
    /**
     * @attribute {object} memory Memory store for Node.js and other platforms which do not support localStorage.
     */
    memory : {},
    /**
     * Set a key-value pair in storage.
     * @param {string} key The key of the key-value pair.
     * @param {*} val The value of the key-value pair.
     * @param {boolean} [nonBlocking] Enable to continue with execution of code while the value is being set. Default is false.
     */
    set : function(key, val, nonBlocking){
        if(nonBlocking && MagnetJS.Utils.hasFeature('localStorage') === true)
            setTimeout(function(){
                window.localStorage.setItem(key, JSON.stringify(val));
            }, 1);
        else
            MagnetJS.Utils.hasFeature('localStorage') === false ? this.memory[key] = val : window.localStorage.setItem(key, JSON.stringify(val));
        return val;
    },
    /**
     * Get a key-value pair from storage.
     * @param {string} key The key of the key-value pair.
     */
    get : function(key){
        return MagnetJS.Utils.hasFeature('localStorage') === false ? this.memory[key] : MagnetJS.Utils.getValidJSON(window.localStorage.getItem(key));
    },
    /**
     * Remove a key-value pair from storage.
     * @param {string} key The key of the key-value pair.
     * @param {boolean} [nonBlocking] Enable to continue with execution of code while the value is being set. Default is false.
     */
    remove : function(key, nonBlocking){
        if(nonBlocking && MagnetJS.Utils.hasFeature('localStorage') === true)
            setTimeout(function(){
                window.localStorage.removeItem(key)
            }, 1);
        else
            MagnetJS.Utils.hasFeature('localStorage') === false ? (this.memory[key] ? delete this.memory[key] : '') : window.localStorage.removeItem(key);
    },
    /**
     * Retrieve or create a keystore and return it.
     */
    getOrCreate : function(key, val){
        if(MagnetJS.Utils.hasFeature('localStorage') === false)
            return this.memory[key] || (this.memory[key] = val);
        else
            return MagnetJS.Utils.getValidJSON(window.localStorage.getItem(key)) || this.set(key, val);
    }
}

/**
 * A basic wrapper for console.log to control output of debugging code.
 * @memberof MagnetJS
 * @namespace Log
 * @ignore
 */
MagnetJS.Log = function(){
    if(MagnetJS.Config.logging === true)
        console.log('[MAGNET DEBUG] ', (MagnetJS.Utils.isAndroid || MagnetJS.Utils.isIOS) ? JSON.stringify(arguments) || arguments : arguments);
}

/**
 * @method
 * @desc Set MagnetJS SDK Config attributes.
 * @param {object} obj An object of key-value pairs to be set in the MagnetJS attributes.
 */
MagnetJS.set = function(obj){
    for(var prop in obj){
        if(obj.hasOwnProperty(prop)){
            if(prop == 'endpointUrl' && /^(ftp|http|https):/.test(obj[prop] === false))
                throw('invalid endpointUrl - no protocol');
            MagnetJS.Config[prop] = obj[prop];
            if(prop == 'locationDataCollection' && obj[prop] === true) MagnetJS.Geolocation.start();
            if(prop == 'locationDataCollection' && obj[prop] === false) MagnetJS.Geolocation.stop();
        }
    }
    return this;
}

/**
 * @method
 * @desc Reset MagnetJS SDK Config attributes to their default values.
 */
MagnetJS.reset = function(){
    MagnetJS.set({
        endpointUrl            : '',
        logging                : true,
        locationDataCollection : false
    });
    return this;
}

/**
 * @method
 * @desc Load a model or controller resource into memory. For NodeJS only.
 * @param {string} path Relative path to the entity or controller resource.
 */
MagnetJS.define = function(path){
    var resource = require(path), type = resource.Controllers ? 'Controllers' : 'Models';
    MagnetJS.Utils.mergeObj(MagnetJS[type], resource[type]);
    return this;
}

/**
 * A class for handling retrieval of geolocation. The MagnetJS.Config property 'locationDataCollection'
 * must be enabled and the client must support the navigator.geolocation API for this feature to work. Note that this
 * class is designed solely to provide updated geolocation information to the server, and that the navigator.geolocation
 * feature can be used independently in your app.
 * @memberof MagnetJS
 * @namespace Geolocation
 */
MagnetJS.Geolocation = {
    /**
     * The most recent geolocation object.
     */
    current : undefined,
    /**
     * The state of the last request for geolocation information. If it was successful, the state will be 'OK'. Otherwise,
     * it will contain an error code.
     */
    state   : '',
    /**
     * A message of the last request for geolocation information. If it was successful, this property will be empty.
     * Otherwise, it will contain an error message.
     */
    message : '',
    poll    : null,
    /**
     * Geolocation configuration properties. See Phonegap documentation for more detailed information about these properties (http://docs.phonegap.com).
     */
    options : {
        /**
         * @property {number} maximumAge Accept a cached position whose age is no greater than the specified time in milliseconds.
         */
        maximumAge         : 3000,
        /**
         * @property {number} timeout The maximum length of time (milliseconds) that is allowed for the geolocation request
         * to succeed. If the geolocation request has not completed by this time, the error callback is called.
         */
        timeout            : 5000,
        /**
         * @property {boolean} enableHighAccuracy Provides a hint that the application needs the best possible results.
         */
        enableHighAccuracy : true,
        /**
         * @property {number} interval Time in seconds before the geolocation information is refreshed.
         */
        interval           : 300
    },
    /**
     * Attempts to update the geolocation information. Optionally pass in a callback or failback after completion.
     * @param [callback] A callback to be fired after a successful geolocation request.
     * @param [failback] A callback to be fired after a failed geolocation request.
     */
    refresh : function(callback, failback){
        var me = this;
        if(MagnetJS.Config.locationDataCollection === true && MagnetJS.Utils.isObject(navigator) && navigator.geolocation && navigator.geolocation.getCurrentPosition){
            navigator.geolocation.getCurrentPosition(function(Position){
                me.current = Position;
                me.state = 'OK';
                me.message = '';
                if(typeof callback === typeof Function) callback();
            }, function(e){
                me.state = e.code;
                me.message = e.message;
                if(typeof failback === typeof Function) failback();
            }, me.options);
        }else{
            MagnetJS.Log('Geolocation APIs are not available.');
            me.state = 'ERROR';
            me.message = 'MagnetJS.Config.locationDataCollection not enabled or Geolocation feature is not available in your app.';
        }
    },
    /**
     * Returns a geo URI based on RFC 5870 for the most recent geolocation information.
     * @returns {string} RFC 5870 geo URI.
     */
    getCurrent : function(){
        return this.state == 'OK' ? 'geo:'+this.current.coords.latitude+','+this.current.coords.longitude+','+(this.current.coords.altitude ? this.current.coords.altitude : 0)+',crs=wgs84,u='+(this.current.coords.accuracy ? Math.round(this.current.coords.accuracy) : 0) : false;
    },
    /**
     * Start polling for geolocation information in intervals specified in the MagnetJS.Geolocation.options.interval property.
     */
    start : function(){
        var me = this;
        me.stop();
        if(MagnetJS.Utils.isObject(navigator) && navigator.geolocation && navigator.geolocation.getCurrentPosition){
            me.poll = setInterval(function(){
                me.refresh();
            }, me.options.interval * 1000);
        }else{
            MagnetJS.Log('Geolocation APIs are not available.');
        }
    },
    /**
     * Stop polling for geolocation information.
     */
    stop : function(){
        clearInterval(this.poll);
    },
    /**
     * Determines whether the given MagnetJS.Geoentry is within the boundaries defined by the given MagnetJS.Geostore.
     * @param {MagnetJS.Geostore} geostore A MagnetJS.Geostore object.
     * @param {MagnetJS.Geoentry} geoentry A MagnetJS.Geoentry object.
     */
    isWithinBoundaries : function(geostore, geoentry){
        var crossings = 0;
        if(typeof geostore === 'undefined' || !geostore.points) throw 'The Geostore object provided is invalid';
        if(typeof geoentry === 'undefined') throw 'The Geoentry object provided is invalid';
        var points = geostore.points;
        for(var i=0; i<points.length; i++){
            var pointA = points[i];
            var j = i + 1;
            if(j >= points.length) j = 0;
            var pointB = points[j];
            if(rayCrossesSegment(geoentry, pointA, pointB)) crossings++;
        }
        function rayCrossesSegment(point, a, b){
            var px = point.lng,
                py = point.lat,
                ax = a.lng,
                ay = a.lat,
                bx = b.lng,
                by = b.lat;
            if(ay > by){
                ax = b.lng;
                ay = b.lat;
                bx = a.lng;
                by = a.lat;
            }
            if(px < 0) px += 360;
            if(ax < 0) ax += 360;
            if(bx < 0) bx += 360;
            if(py == ay || py == by) py += 0.00000001;
            if((py > by || py < ay) || (px > Math.max(ax, bx))) return false;
            if(px < Math.min(ax, bx)) return true;
            var red = (ax != bx) ? ((by - ay) / (bx - ax)) : Infinity;
            var blue = (ax != px) ? ((py - ay) / (px - ax)) : Infinity;
            return (blue >= red);
        }
        return (crossings % 2 == 1);
    }
}
/**
 * A class containing transport functions for facilitating requests and responses between a client and a Mobile App Server.
 * @memberof MagnetJS
 * @namespace Transport
 * @ignore
 */
MagnetJS.Transport = {
    /**
     * Base request function. Determines the best available transport and calls the request.
     * @param {object} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded. The success callback will be fired on a status code in the 200-207 range.
     * @param {function} [failback] Executes if the request failed.
     */
    request : function(body, metadata, options, callback, failback){
        options = options || {};
        metadata._path = metadata._path || metadata.path;
        MagnetJS.Config.endpointUrl = MagnetJS.Config.endpointUrl.toLowerCase();
        metadata._path = (metadata.local === true || /^(ftp|http|https):/.test(metadata._path) === true) ? metadata._path : MagnetJS.Config.endpointUrl+metadata._path;
        if(MagnetJS.Utils.isNode){
            this.initNodeRequest(body, metadata, callback, failback);
        }else if(MagnetJS.Utils.isCordova && options.callOptions && options.callOptions.saveAs && !options.callOptions.returnRaw){
            this.cordovaFileTransfer(body, metadata, options, callback, failback);
        }else if(typeof jQuery !== 'undefined'){
            this.requestJQuery(body, metadata, callback, failback);
        }else if(XMLHttpRequest !== 'undefined'){
            this.requestXHR(body, metadata, callback, failback);
        }else{
            throw('request-transport-unavailable');
        }
    },
    /**
     * Transport with JQuery over HTTP/SSL protocol with REST. Cross origin requests from a web browser are currently not supported.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    requestJQuery : function(body, metadata, callback, failback){
        var me = this;
        var dataStr = (!MagnetJS.Utils.isEmptyObject(body) && (metadata.contentType == 'application/json' || metadata.contentType == 'text/uri-list')) ? JSON.stringify(body) : body;
        $.support.cors = true;
        var details = {
            body : body,
            info : {
                url : metadata._path
            }
        };
        $.ajax({
            type        : metadata.method,
            url         : metadata._path,
            timeout     : 30000,
            dataType    : metadata.dataType,
            contentType : metadata.contentType,
            data        : dataStr,
            beforeSend  : function(xhr){
                if(metadata.headers){
                    for(var i=metadata.headers.length;i--;){
                        xhr.setRequestHeader(metadata.headers[i].name, metadata.headers[i].val);
                    }
                }
            },
            success : function(data, status, xhr){
                if(typeof callback === typeof Function){
                    details.info.xhr = MagnetJS.Utils.convertHeaderStrToObj(xhr);
                    details.status = xhr.status;
                    callback(data, details);
                }
            },
            error : function(xhr, metadata, error){
                details.info.xhr = MagnetJS.Utils.convertHeaderStrToObj(xhr);
                details.status = xhr.status;
                if(metadata == 'parsererror')
                    callback(xhr.responseText, details);
                else if(typeof failback === typeof Function)
                    failback(xhr.responseText, details);
            }
        });
    },
    /**
     * Transport with XMLHttpRequest over HTTP/SSL protocol with REST. Cross origin requests from a web browser are currently not supported.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    requestXHR : function(body, metadata, callback, failback){
        var me = this, resBody;
        var reqBody = me.parseBody(metadata.contentType, body);
        var details = {
            body : body,
            info : {
                url : metadata._path
            }
        };
        var xhr = new XMLHttpRequest();
        xhr.timeout = 30000;
        xhr.onreadystatechange = function(){
            if(xhr.readyState == 4){
                details.status = xhr.status;
                details.info.xhr = MagnetJS.Utils.convertHeaderStrToObj(xhr);
                resBody = xhr.responseText;
                if(typeof xhr.responseXML !== 'undefined' && xhr.responseXML != null){
                    resBody = xhr.responseXML;
                }else{
                    try{
                        resBody = JSON.parse(resBody);
                    }catch(e){}
                }
                if(me.isSuccess(xhr.status)){
                    if(typeof callback === typeof Function) callback(resBody, details);
                }else{
                    if(typeof failback === typeof Function) failback(resBody, details);
                }
            }
        };
        xhr.ontimeout = function(){
            details.status = 0;
            details.info.xhr = MagnetJS.Utils.convertHeaderStrToObj(xhr);
            if(typeof failback === typeof Function) failback('request-timeout', details);
        };
        xhr.open(metadata.method, metadata._path, true);
        if(metadata.contentType)
            xhr.setRequestHeader('Content-Type', metadata.contentType);
        xhr.setRequestHeader('Accept', me.createAcceptHeader(metadata.dataType));
        if(metadata.headers)
            for(var i=metadata.headers.length;i--;)
                xhr.setRequestHeader(metadata.headers[i].name, metadata.headers[i].val);
        xhr.send(reqBody);
    },
    /**
     * Initialize a transport with Node.js. For NodeJS only.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    initNodeRequest : function(body, metadata, callback, failback){
        var urlParser = require('url');
        var reqObj = urlParser.parse(metadata._path);
        var headers = MagnetJS.Utils.mergeObj({
            'Content-Type' : metadata.contentType
        }, MagnetJS.Transport.Headers);
        metadata.protocol = reqObj.protocol;
        if(reqObj.hostname){
            this.requestNode(body, metadata, {
                host               : reqObj.hostname,
                port               : parseInt(reqObj.port || (reqObj.protocol == 'https:' ? 443 : null)),
                path               : reqObj.path,
                method             : metadata.method,
                rejectUnauthorized : false,
                requestCert        : false,
                headers            : headers
            }, callback, failback);
        }else{
            if(typeof failback === typeof Function){
                failback('error parsing url', {
                    body : body,
                    info : {
                        url : metadata._path
                    }
                });
            }
        }
    },
    /**
     * Transport with Node.js over HTTP/SSL protocol with REST. For NodeJS only.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} httpRequestmetadata http.request metadata.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    requestNode : function(body, metadata, httpRequestmetadata, callback, failback){
        var me = this, http = require('http'), https = require('https');
        var reqBody = me.parseBody(metadata.contentType, body);
        var req = (metadata.protocol == 'https:' ? https : http).request(httpRequestmetadata, function(res){
            var output = '', details = {
                body : body,
                info : {
                    metadata : metadata,
                    url      : metadata._path,
                    request  : req,
                    response : res
                },
                status : res.statusCode
            };
            res.setEncoding(metadata.returnType == '_data' ? 'binary' : 'utf8');
            res.on('data', function(chunk){
                output += chunk;
            });
            res.on('end', function(){
                var resBody = output;
                try{
                    resBody = JSON.parse(output);
                }catch(e){}
                if(me.isSuccess(res.statusCode)){
                    if(typeof callback === typeof Function) callback(resBody, details);
                }else{
                    if(typeof failback === typeof Function) failback(resBody, details);
                }
            });
        });
        req.on('error', function(e){
            if(typeof failback === typeof Function){
                var details = {
                    body : body,
                    info : {
                        metadata : metadata,
                        url      : metadata._path,
                        request  : req
                    },
                    status : 0
                };
                failback(e, details);
            }
        });
        if(body) req.write(reqBody, 'utf8');
        req.end();
    },
    /**
     * Returns a boolean determining whether the status code is a success or failure.
     * @param {number} code The HTTP request status code.
     */
    isSuccess : function(code){
        return code >= 200 && code <= 207;
    },
    /**
     * Formats the body into the appropriate type of string given the Content-Type header.
     * @param {object|string|number} type The Content-Type of the request.
     * @param {string} input The original request body.
     */
    parseBody : function(type, input){
        var QS = MagnetJS.Utils.isNode ? require('querystring') : MagnetJS.Utils.objectToFormdata;
        var out;
        switch(type){
            case 'application/x-www-form-urlencoded' : out = QS.stringify(input); break;
            case 'application/json' : out = JSON.stringify(input); break;
            default : out = input;
        }
        return out;
    },
    /**
     * Create an Accept header.
     * @param {string} [dataType] The expected data type of the request.
     * @returns {string} The Accept Header string.
     */
    createAcceptHeader : function(dataType){
        var str = '';
        dataType = dataType || 'json';
        switch(dataType){
            case 'xml'  : str = 'application/xml;q=1.0'; break;
            case 'html' : str = 'text/plain;q=1.0'; break;
            case 'text' : str = 'text/plain;q=1.0'; break;
            default     : str = 'application/json;q=1.0'; break;
        }
        return str+',*/*;q=0.5';
    },
    /**
     * Transport with Phonegap's FileTransfer API.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    cordovaFileTransfer : function(body, metadata, options, callback, failback){
        var details = {
            body : body,
            info : {
                url : metadata._path
            },
            status : null
        };
        var headers = {};
        if(metadata.headers)
            for(var i=metadata.headers.length;i--;)
                headers[metadata.headers[i].name] = metadata.headers[i].val;
        MagnetJS.FileManager.getFS(function(){
            var fileTransfer = new FileTransfer();
            fileTransfer.download(
                metadata._path,
                MagnetJS.FileManager.filePath+options.callOptions.saveAs,
                function(fileEntry){
                    if(typeof callback === typeof Function) callback(fileEntry, details);
                },
                function(e){
                    if(typeof failback === typeof Function) failback(e, details);
                }, MagnetJS.Config.debugMode, {
                    headers : headers
                }
            );
        }, function(){
            if(typeof failback === typeof Function) failback(MagnetJS.FileManager.status, details);
        });
    }
}
MagnetJS.Transport.Headers = {};


/**
 * @constructor
 * @class Request A request instance which handles the request and response.
 * @param [instance] The object creating the request.
 * @param options The object creating the request.
 * @ignore
 */
MagnetJS.Request = function(instance, options, metadata){
    this.instance = instance;
    this.options = options;
    this.metadata = metadata;
}
/**
 * Send a request.
 * @param {function} [callback] Executes if the request succeeded.
 * @param {function} [failback] Executes if the request failed.
 */
MagnetJS.Request.prototype.send = function(callback, failback){
    var me = this;
    me.beforeRequest(callback, failback, function(){
        var requestObj = me.setup(me.metadata.schema || {}, me.metadata.params, me.options.attributes);
        requestObj.params.headers = requestObj.params.headers || [];
        var geo = MagnetJS.Geolocation.getCurrent();
        if(MagnetJS.Geolocation.state == 'OK' && geo)
            requestObj.params.headers.push({
                name : 'Geolocation',
                val  : geo
            });
        if(MagnetJS.Utils.isCordova && typeof device === typeof {} && device.uuid)
            requestObj.params.headers.push({
                name : 'X-Magnet-Device-Id',
                val  : device.uuid
            });
        if(MagnetJS.Utils.isCordova)
            requestObj.params.headers.push({
                name : 'X-Magnet-Auth-Challenge',
                val  : 'disabled'
            });
        if(me.options && me.options.callOptions && me.options.callOptions.correlationId){
            requestObj.params.headers.push({
                name : 'X-Magnet-Correlation-id',
                val  : me.options.callOptions.correlationId
            });
            requestObj.params.headers.push({
                name : 'X-Magnet-Result-Timeout',
                val  : me.options.callOptions.serverTimeout || 0
            });
        }
        MagnetJS.Transport.request(requestObj.body, requestObj.params, me.options, function(result, details){
            if(me.metadata.params.controller == 'MMSDKLoginService' && me.metadata.params.name == 'login' && result != 'SUCCESS')
                me.onResponseError(callback, failback, result, details);
            else
                me.onResponseSuccess(callback, result, details);
        }, function(e, details){
            me.onResponseError(callback, failback, e, details);
        });
    });
}

/**
 * Prepares a request for transport.
 * @param {object} schema A controller method schema object.
 * @param {object} params A request parameter object.
 * @param {object} attributes Controller method attributes as a key-value pair.
 */
MagnetJS.Request.prototype.setup = function(schema, params, attributes){
    var query = '', body = {}, plains = {}, forms = {};
    params.contentType = params.contentType || 'application/json';
    params.dataType = params.dataType || 'json';
    params._path = params.path;
    for(var attr in attributes){
        if(attributes.hasOwnProperty(attr)){
            if(attributes[attr].isMagnetModel && attributes[attr].attributes) attributes[attr] = attributes[attr].attributes;
            switch(schema[attr].style){
                case 'TEMPLATE' :
                    params._path = params._path.replace('{'+attr+'}', attributes[attr].replace('magnet://', ''));
                    break;
                case 'QUERY' :
                    query += '&'+attr+'='+attributes[attr];
                    break;
                case 'PLAIN' :
                    plains[attr] = attributes[attr];
                    break;
                case 'FORM' :
                    forms[attr] = attributes[attr];
                    params.contentType = 'application/x-www-form-urlencoded';
                    break;
            }
        }
    }
    var attrs = MagnetJS.Utils.getAttributes(plains);
    if(MagnetJS.Utils.isEmptyObject(forms) && attrs.length == 1){
        body = plains[attrs[0]];
        if(MagnetJS.Utils.isPrimitiveType(schema[attrs[0]].type)) params.contentType = 'text/html';
    }else{
        body = MagnetJS.Utils.mergeObj(plains, forms);
    }
    params._path = (params.basePathOnly === true ? params._path : '/rest'+params._path)+query;
    params._path = params._path.indexOf('?') == -1 ? params._path.replace('&', '?') : params._path;
    return {
        body   : body,
        params : params
    };
}

/**
 * Handles pre-request operations, most notably execution of CallOptions configurations.
 * @param {function} [callback] The success callback.
 * @param {function} [failback] The error callback.
 * @param {function} startRequest A callback function to continue execution of the request.
 */
MagnetJS.Request.prototype.beforeRequest = function(callback, failback, startRequest){
    var me = this, cacheObj = MagnetJS.CallManager.getCache(this.getCallId());
    // if cache is available, return cache
    if(cacheObj){
        if(typeof callback === typeof Function) callback(cacheObj.result, cacheObj.details, true);
    }else{
        var callOptions = this.options.callOptions;
        // if network state is offline or constraint is not met
        if(callOptions && MagnetJS.CallManager.isConstraintMet(callOptions.constraint) === false){
            // if reliable call and request timeout is set
            if(callOptions.isReliable === true && MagnetJS.CallManager.isExpired(callOptions.requestAge) === false){
                MagnetJS.CallManager.setRequestObject(me.getCallId(), me.options, me.metadata);
                if(typeof callback === typeof Function) callback('awaiting-constraint');
                // AsyncCallOptions
            }else{
                if(typeof failback === typeof Function) failback('constraint-failure', {
                    constraint : callOptions.constraint,
                    current    : MagnetJS.CallManager.getConnectionState()
                })
            }
        }else{
            // if cordova, check connection state for none
            if(MagnetJS.Utils.isCordova && MagnetJS.CallManager.getConnectionState() == 'NONE'){
                if(typeof failback === typeof Function) failback('no-network-connectivity');
            }else{
                startRequest();
            }
        }
    }
}

/**
 * Handles response success.
 * @param {function} [callback] The success callback.
 * @param {*} result The result body.
 * @param {object} details An object containing details of the request.
 */
MagnetJS.Request.prototype.onResponseSuccess = function(callback, result, details){
    var me = this;
    if(me.options.callOptions && me.options.callOptions.cacheAge != 0)
        MagnetJS.CallManager.setCacheObject(me.getCallId(), me.options.callOptions, result, details);
    me.formatResponse(result, function(convertedResult){
        if(me.instance) me.instance.invoke(['Complete', 'Success', 'MMSDKComplete'], me.metadata.params.name, convertedResult, details);
        if(typeof callback === typeof Function) callback(convertedResult, details);
    });
}

/**
 * Handles response error.
 * @param {function} [callback] The success callback.
 * @param {function} [failback] The error callback.
 * @param {*} error The error body.
 * @param {object} details An object containing details of the error.
 */
MagnetJS.Request.prototype.onResponseError = function(callback, failback, error, details){
    if(details.status == 403
        && MagnetJS.Utils.isCordova === true
        && typeof error == 'string'
        && error.indexOf('com.magnet.security.api.oauth.OAuthLoginException') != -1){
        var res = MagnetJS.Utils.getValidJSON(error);
        MagnetJS.OAuthHandler.invoke('OAuthLoginException', this.instance, this.options, this.metadata, res, callback, failback);
    }else{
        if(details.status == 401 || details.status == 403){
            error = 'session-expired';
            MagnetJS.LoginService.connectionStatus = 'Unauthorized';
            MagnetJS.LoginService.invoke(['Unauthorized'], this.metadata.params.name, error, details);
        }
        if(this.instance) this.instance.invoke(['Complete', 'Error', 'MMSDKComplete'], this.metadata.params.name, error, details);
        if(typeof failback === typeof Function) failback(error, details);
    }
}

/**
 * Returns a callId based on a hash of the request parameters and body.
 * @returns {string}
 */
MagnetJS.Request.prototype.getCallId = function(){
    return MagnetJS.CallManager.getCallId(
        this.metadata.params.controller,
        this.metadata.params.name,
        (JSON.stringify(this.options.attributes) || ''));
}

/**
 * Format server response data into client data objects and handle binary data.
 * @param {*} body The response body.
 * @param {function} callback Executes upon completion.
 */
MagnetJS.Request.prototype.formatResponse = function(body, callback){
    var params = this.metadata.params;
    var options = this.options.callOptions || {};
    var out = body;
    if(!options.returnRaw){
        if(params.returnType == 'date'){
            callback(MagnetJS.Utils.ISO8601ToDate(body));
        }else if(options.saveAs && MagnetJS.Utils.isCordova === false){
            if(MagnetJS.Utils.isNode){
                require('fs').writeFile(options.saveAs, typeof body == 'string' ? body : JSON.stringify(body), MagnetJS.Utils.mergeObj({
                    encoding : 'binary',
                    mode     : 438,
                    flag     : 'w'
                }, options.saveAsOptions), function(e){
                    if(e) MagnetJS.Log(e);
                    callback(out);
                });
            }else{
                MagnetJS.Log('The saveAs option is only compatible with Phonegap or Node.js applications.');
                callback(out);
            }
        }else if(MagnetJS.Utils.isModelOrCollection(params.returnType) === true){
            callback(this.jsonToModel(params.returnType, body));
        }else if(typeof body == 'string' && body.indexOf('multipart/related') != -1){
            callback(multipartParser(body));
        }else{
            callback(out);
        }
    }else{
        callback(out);
    }
}

/**
 * Convert a JSON object into a MagnetJS Model or Collection if data is compatible.
 * @param {*} returnType The return contentType specified by the controller metadata.
 * @param {*} body The response body.
 * @param {boolean} [multipart] Enable to skip parsing for multipart/related data.
 * @returns {*}
 */
MagnetJS.Request.prototype.jsonToModel = function(returnType, body, multipart){
    var modelType = (returnType.indexOf('[]') != -1) ? returnType.replace('[]', '') : returnType;
    if(MagnetJS.Models[modelType] && returnType.indexOf('[]') != -1 && body.page && MagnetJS.Utils.isArray(body.page)){
        return new MagnetJS.Collection(modelType, body.page);
    }else if(MagnetJS.Models[modelType] && body['magnet-type']){
        return new MagnetJS.Models[modelType](body);
    }else if(!multipart && typeof body == 'string' && body.indexOf('multipart/related') != -1){
        var out = multipartParser(body);
        if(MagnetJS.Utils.isArray(out)){
            if(out.length == 1) return this.jsonToModel(modelType, out[0].val, true);
            for(var i=0;i<out.length;++i)
                out[i].val = this.jsonToModel(modelType, out[i].val, true);
            return out;
        }else{
            return body;
        }
    }else{
        return body;
    }
}

// A simple multipart/related parser. Only supports parts which only contain the Content-Type header.
function multipartParser(str){
    var contents = parts = [];
    var boundary = str.match(/boundary=[a-zA-Z0-9-_'\/\(\)+_,-\.:=\\?]+/i);
    if(boundary.length > 0){
        parts = getParts(str, boundary[0].replace('boundary=', ''));
        for(var i=0;i<parts.length;++i)
            contents.push(getContent(parts[i]));
        return contents;
    }else{
        return str;
    }
}
// returns an array of parts.
function getParts(str, boundary){
    var ary = str.split('--'+boundary);
    ary.shift();
    ary.pop();
    return ary;
}
// returns an object containing the content-type and data.
function getContent(str){
    var contentType, content;
    var contents = str.split('\n');
    for(var i=0;i<contents.length;++i){
        if(contents[i].indexOf('Content-Type') != -1){
            contentType = contents[i];
            content = {
                contentType : contentType.replace(/Content-Type[ ]*:/, '').replace(/^\s+|\s+$/g, ''),
                val         : str.replace(contentType, '')
            };
            content.val = MagnetJS.Utils.getValidJSON(content.val) || content.val;
            contents.slice(i);
            break;
        }
    }
    return content;
}
/**
 * @constructor
 * @memberof MagnetJS
 * @class Model is a client representation of a Mobile App Server Bean. It stores data and performs attribute validations.
 * @param {object} attributes A key-value pair of attributes to be assigned to this Model.
 * @param {boolean} [doValidate] If enabled, validate attributes before set. Default is disabled.
 */
MagnetJS.Model = function(attributes, doValidate){
    MagnetJS.Events.create(this);
    this.attributes = this.attributes || {};
    for(var attr in this.attributes)
        if(this.attributes[attr] === null) delete this.attributes[attr];
    this.attributes['magnet-type'] = this.entityType;
    if(attributes) this.set(attributes, doValidate);
    this.isMagnetModel = true;
    return this;
};

/**
 * Handles basic validation of Model attributes based on schema.
 * @param {object} attributes The attributes to validate.
 * @param {boolean} [isUpdate] If enabled, do not fail validation on missing required fields. Default is disabled.
 */
MagnetJS.Model.prototype.validate = function(attributes, isUpdate){
    return MagnetJS.Utils.validate(this.schema, attributes, isUpdate);
};

/**
 * Set attributes of Model, optionally perform validation before set.
 * @param {object} attributes The attributes to set.
 * @param {boolean} [doValidate] If enabled, validate attributes before set. Default is disabled.
 */
MagnetJS.Model.prototype.set = function(attributes, doValidate){
    if(doValidate){
        var invalid = this.validate(attributes);
        if(invalid === false){
            this.attributes = MagnetJS.Utils.mergeObj(this.attributes, attributes);
            this.invoke('onSet', this.name, attributes);
        }else{
            MagnetJS.Log('model "'+this.name+'" validation failure:' + JSON.stringify(invalid));
        }
        return (!invalid ? false : invalid);
    }else{
        this.attributes = MagnetJS.Utils.mergeObj(this.attributes, attributes);
        this.invoke('onSet', this.name, attributes);
        return false;
    }
};

/**
 * @constructor
 * @class Collection is a group of Models. It stores a collection of models and performs batch property validation.
 * @param {string} type The Model type.
 * @param {Model|Model[]|object[]} [models] A Model, array of Models objects, or array of key-value pairs to include in the Collection.
 */
MagnetJS.Collection = function(type, models){
    this._type = type;
    this.entityType = MagnetJS.Models[this._type] ? MagnetJS.Models[this._type].entityType : type;
    this.models = [];
    if(models) this.add(models);
    this.isMagnetCollection = true;
    return this;
};

/**
 * Add Model(s) to the Collection.
 * @param {Model|Model[]|object[]} input A Model, array of Models objects, or array of key-value pairs to include in the Collection.
 */
MagnetJS.Collection.prototype.add = function(input){
    if(MagnetJS.Utils.isArray(input)){
        for(var i=0;i<input.length;++i){
            if(!input[i].isMagnetModel) input[i]['magnet-type'] = this.entityType;
            this.models.push(input[i].isMagnetModel ? input[i] : new MagnetJS.Models[this._type](input[i]));
        }
    }else{
        if(!input.isMagnetModel) input['magnet-type'] = this.entityType;
        this.models.push(input.isMagnetModel ? input : new MagnetJS.Models[this._type](input));
    }
};

/**
 * Clear all Models out of the Collection.
 */
MagnetJS.Collection.prototype.clear = function(){
    this.models = [];
};

/**
 * Return an array of Model objects with attribute matching the specified query.
 * @param {string|object} attributes An object of key-value pairs or an attribute name to match.
 * @param {*} value The attribute to search by.
 */
MagnetJS.Collection.prototype.where = function(attributes, value){
    var out = [];
    for(var i=0;i<this.models.length;++i){
        if(MagnetJS.Utils.isObject(attributes)){
            var match = true;
            for(var attr in attributes){
                if(attributes.hasOwnProperty(attr))
                    if(!this.models[i].attributes[attr] || this.models[i].attributes[attr] !== attributes[attr]) match = false;
            }
            if(match) out.push(this.models[i]);
        }else{
            if(value && this.models[i].attributes[attributes] === value) out.push(this.models[i]);
        }
    }
    return out;
};

/**
 * A library of MagnetJS.Model objects generated with the Magnet Mobile App Builder.
 * @namespace MagnetJS.Models
 */
MagnetJS.Models = {};
/**
 * @constructor
 * @memberof MagnetJS
 * @class Controller is an object containing a collection of Methods used to manage and simplify interaction with a Mobile App Server controller.
 * @param {string} [name] An identifier for the controller instance. If not specified, a default value will be used.
 */
MagnetJS.Controller = function(name){
    this._MMSDKName = name;
    MagnetJS.Events.create(this);
    return this;
}

/**
 * @class Method is an object within a Controller used to manage and simplify interaction with a particular
 * method of a Mobile App Server controller. It will handle basic validation of controller method attributes
 * based on schema.
 * @param {*} [data] Request data.
 * @param {object} [options] Request options.
 * @param metadata Request metadata.
 * @param {CallOptions} [options.callOptions] A CallOptions object.
 * @param {function} [options.success] Callback to fire after successful request.
 * @param {function} [options.error] Callback to fire after failed request.
 * @returns {MagnetJS.Promise} A MagnetJS.Promise instance.
 */
MagnetJS.Method = function(data, options, metadata){
    var me = this;
    options = options || {};
    options.attributes = (typeof data === 'undefined' || data === null) ? undefined : data;
    options.attributes = MagnetJS.Utils.mergeObj(options.attributes, metadata.attributes);
    var invalid = MagnetJS.Utils.validate(metadata.schema, options.attributes);
    var deferred = new MagnetJS.Deferred();
    metadata.params.controller = me._MMSDKName;
    if((options.callOptions && options.callOptions.skipValidation === true) || invalid === false){
        me.invoke(['Set'], metadata.params.name, options, metadata);
        var request = new MagnetJS.Request(me, options, metadata);
        me.invoke(['BeforeRequest'], metadata.params.name, options, metadata);
        request.send(function(){
            if(typeof options.success === typeof Function) options.success.apply(me, arguments);
            deferred.resolve.apply(deferred, arguments);
        }, function(){
            if(typeof options.error === typeof Function) options.error.apply(me, arguments);
            deferred.reject.apply(deferred, arguments);
        });
    }else{
        me.invoke(['Complete', 'Error'], metadata.params.name, 'failed-validation', invalid);
        MagnetJS.Log('controller method "'+metadata.params.name+'" validation failure:' + JSON.stringify(invalid));
        if(typeof options.error === typeof Function) options.error('failed-validation', invalid);
        deferred.reject('failed-validation', invalid);
    }
    return deferred.promise;
}

/**
 * A library of MagnetJS.Controller objects generated with the Magnet Mobile App Builder.
 * @namespace MagnetJS.Controllers
 */
MagnetJS.Controllers = {};

/**
 * This callback is fired on a failed controller call.
 * @typedef {function} ControllerError
 * @param {*} error The error response body or an error message.
 * @param {object} details An object containing details of the request, such as HTTP request, response, and status code.
 */

/**
 * This callback is fired on a successful controller call.
 * @typedef {function} ControllerSuccess
 * @param {*} data The success response body.
 * @param {object} details An object containing details of the request, such as HTTP request, response, and status code.
 */
/**
 * Facilitates client side authentication against a Magnet Mobile App Server. Upon a successful login, a new session will be created
 * and used for any subsequent controller calls. If the session has expired or the logout function has been called, requests requiring
 * authentication will return with a 401 HTTP status code.
 * @memberof MagnetJS
 * @namespace LoginService
 */
MagnetJS.LoginService = new MagnetJS.Controller('MMSDKLoginService');
MagnetJS.LoginService.store = 'MMSDKConnection';
MagnetJS.LoginService.connectionStatus = 'NoAuthorization';

/**
 * Log in to an Magnet Mobile App Server instance using the supplied credentials. Upon successful login, controller calls will use the newly
 * created session to make requests.
 * @memberof MagnetJS.LoginService
 * @param {object} data The request data.
 * @param {string} data.name Username.
 * @param {string} data.password Password.
 * @param {string} [data.authority] Authority.
 * @param {object} options Request options.
 * @param {MagnetJS.CallOptions} [options.callOptions] A CallOptions object.
 * @param {ControllerSuccess} [options.success] Success callback. See Type for return values.
 * @param {ControllerError} [options.error] Error callback. See Type for return values.
 * @returns {MagnetJS.Promise} A MagnetJS.Promise instance.
 */
MagnetJS.LoginService.login = function(data, options){
    return MagnetJS.Method.call(this, data, options, {
        params : {
            name       : 'login',
            path       : '/login',
            method     : 'POST',
            dataType   : 'html',
            returnType : 'string'
        },
        attributes : {
            authority : 'magnet'
        },
        schema : {
            name : {
                style    : 'FORM',
                type     : 'java.lang.String',
                optional : false
            },
            password : {
                style    : 'FORM',
                type     : 'java.lang.String',
                optional : false
            },
            authority : {
                style    : 'FORM',
                type     : 'java.lang.String',
                optional : true
            }
        }
    });
};
/**
 * Logout from a Magnet Mobile App Server. Subsequent requests to APIs requiring authentication will
 * fail with 401 HTTP status code (Unauthorized).
 * @memberof MagnetJS.LoginService
 * @param {object} options Request options.
 * @param {MagnetJS.CallOptions} [options.callOptions] A CallOptions object.
 * @param {ControllerSuccess} [options.success] Success callback. See Type for return values.
 * @param {ControllerError} [options.error] Error callback. See Type for return values.
 * @returns {MagnetJS.Promise} A MagnetJS.Promise instance.
 */
MagnetJS.LoginService.logout = function(options){
    return MagnetJS.Method.call(this, null, options, {
        params : {
            name       : 'logout',
            path       : '/logout',
            method     : 'POST',
            dataType   : 'html',
            returnType : 'void'
        }
    });
};
/**
 * Log in to a Magnet Mobile App Server using stored credentials. If the credentials are missing, the error callback
 * will be fired with a response of "invalid-credentials".
 * @memberof MagnetJS.LoginService
 * @param {object} options Request options.
 * @param {MagnetJS.CallOptions} [options.callOptions] A CallOptions object.
 * @param {ControllerSuccess} [options.success] Success callback. See Type for return values.
 * @param {ControllerError} [options.error] Error callback. See Type for return values.
 */
MagnetJS.LoginService.loginWithSavedCredentials = function(options){
    var credentials = MagnetJS.Storage.get(this.store) || {};
    if(credentials.name && credentials.password && credentials.endpointUrl){
        MagnetJS.set({
            endpointUrl : credentials.endpointUrl
        });
        delete credentials.endpointUrl;
        this.login(credentials, {
            success : options.success,
            error   : options.error
        });
    }else{
        if(typeof options.error === typeof Function) options.error('invalid-credentials');
    }
}

MagnetJS.LoginService.on('MMSDKComplete', function(methodName, result, details){
    if(methodName == 'login' && result == 'SUCCESS'){
        MagnetJS.LoginService.connectionStatus = 'Authorized';
        MagnetJS.LoginService.invoke(['Authorized'], result, details);
        if(MagnetJS.Utils.isMobile && MagnetJS.Config.storeCredentials === true)
            MagnetJS.Storage.set(this.store, MagnetJS.Utils.mergeObj({
                endpointUrl : MagnetJS.Config.endpointUrl
            }, details.body));
        if(MagnetJS.Utils.isNode && details.info.response.headers['set-cookie'])
            MagnetJS.Transport.Headers.Cookie = details.info.response.headers['set-cookie'][0];
    }else if(methodName == 'logout'){
        MagnetJS.LoginService.connectionStatus = 'NoAuthorization';
        MagnetJS.LoginService.invoke(['NoAuthorization'], result, details);
        if(MagnetJS.Utils.isMobile) MagnetJS.Storage.remove(this.store);
        if(MagnetJS.Utils.isNode) delete MagnetJS.Transport.Headers.Cookie;
        delete MagnetJS.Transport.credentials;
    }
});

var Connection = Connection || {
    UNKNOWN  : 'unknown',
    ETHERNET : 'ethernet',
    WIFI     : 'wifi',
    CELL_2G  : '2g',
    CELL_3G  : '3g',
    CELL_4G  : '4g',
    CELL     : 'cellular',
    NONE     : 'none'
}

/**
 * Catches errors due to an OAuthLoginException and displays OAuth dialog for user to enter their credentials.
 * After a successful authentication, the OAuthHandler will resubmit the original request and return the payload
 * in the success callback.
 * @fires MagnetJS.OAuthHandler#OAuthLoginExceptionReceived
 * @fires MagnetJS.OAuthHandler#OAuthFlowComplete
 * @memberof MagnetJS
 * @namespace OAuthHandler
 */
MagnetJS.OAuthHandler = {
    authorize : function(options){
        if(!options || !options.endpoint) throw('no endpoint specified');
        var authWindow = window.open(options.endpoint, '_blank', 'location=no,toolbar=no');
        if(typeof authWindow !== 'undefined'){
            authWindow.addEventListener('loadstop', function(evt){
                var code = /MagnetOAuthServlet\?code=(.+)$/.exec(evt.url);
                var error = /\?error=(.+)$/.exec(evt.url) || /\?error_code=(.+)$/.exec(evt.url) || null;
                if(code || error) authWindow.close();
                if(code && typeof options.success === typeof Function) options.success(evt.url, evt);
                if(error && typeof options.error === typeof Function) options.error(error[1], evt);
            }, true);
        }else{
            MagnetJS.Log('OAuth handling error: no InAppBrowser. Install the org.apache.cordova.inappbrowser plugin to handle Oauth.');
            if(typeof options.error === typeof Function) options.error('missing-oauth-plugin', options.endpoint);
        }
    }
};
/**
 * This event is fired when an OAuthLoginException has been received during a controller call.
 * @event MagnetJS.OAuthHandler#OAuthLoginExceptionReceived
 * @type {object}
 * @property {MagnetJS.Controller} instance The controller instance which resulted in the OAuthLoginException.
 * @property {object} options The request options.
 */
/**
 * This event is fired when an OAuth flow has completed.
 * @event MagnetJS.OAuthHandler#OAuthFlowComplete
 * @type {object}
 * @property {MagnetJS.Controller} instance The controller instance which resulted in the OAuthLoginException.
 * @property {object} options The request options.
 */
MagnetJS.Events.create(MagnetJS.OAuthHandler);
MagnetJS.OAuthHandler.on('OAuthLoginException', function(instance, options, metadata, res, callback, failback){
    MagnetJS.OAuthHandler.invoke('OAuthLoginExceptionReceived', instance, options, metadata, res);
    MagnetJS.OAuthHandler.authorize({
        endpoint : res.message,
        success  : function(code){
            MagnetJS.OAuthHandler.invoke('OAuthFlowComplete', instance, options, metadata);
            var req = new MagnetJS.Request(instance, options, metadata);
            req.send(callback, failback);
//            MagnetJS.Transport.request(undefined, {
//                path         : code,
//                basePathOnly : true
//            }, metadata, function(){
//                MagnetJS.OAuthHandler.invoke('OAuthFlowComplete', instance, options, metadata);
//                var req = new MagnetJS.Request(instance, options, metadata);
//                req.send(callback, failback);
//            }, function(e, details){
//                if(typeof failback == typeof Function) failback(e, details);
//            });
        },
        error : function(e, details){
            if(typeof failback == typeof Function) failback('oauth-flow-error', {
                error   : e,
                details : details
            });
        }
    })
});

/**
 * This class provides the basic cache management, queue management, and reliable calls management.
 * @namespace CallManager
 * @memberof MagnetJS
 */
MagnetJS.CallManager = {
    queuesName       : 'MMSDKReliableQueues',
    defaultQueueName : 'MMSDKReliableDefaultQueue',
    cache            : {}
}
// create stores if they do not already exist.
MagnetJS.CallManager.queues = MagnetJS.Storage.getOrCreate(MagnetJS.CallManager.queuesName, {});
MagnetJS.CallManager.defaultQueue = MagnetJS.Storage.getOrCreate(MagnetJS.CallManager.defaultQueueName, []);

/**
 * Clear all cached results.
 * @param {string} callId A queue name.
 */
MagnetJS.CallManager.clearCache = function(callId){
    if(callId && this.cache[callId]) delete this.cache[callId];
    else this.cache = {};
}
/**
 * Cancel all pending reliable calls.
 * @param {string} [queueName] A queue name.
 */
MagnetJS.CallManager.cancelAllPendingCalls = function(queueName){
    if(queueName && this.queues[queueName]){
        delete this.queues[queueName];
    }else{
        this.queues = {};
        this.defaultQueue = [];
    }
    MagnetJS.Storage.set(this.queuesName, this.queues);
    MagnetJS.Storage.set(this.defaultQueueName, this.defaultQueue);
}
/**
 * Shortcut for calling cancelAllPendingCalls and clearCache.
 */
MagnetJS.CallManager.reset = function(){
    this.cancelAllPendingCalls();
    this.clearCache();
}
/**
 * Triggers all non-empty thread queues to be awaken (if asleep) to re-attempt processing.
 */
MagnetJS.CallManager.run = function(){
    var me = this;
    MagnetJS.Deferred.all(function(){
        var deferred = new MagnetJS.Deferred();
        me.runQueue('defaultQueue', undefined, function(){
            deferred.resolve();
        });
        return deferred.promise;
    }, function(){
        var deferred = new MagnetJS.Deferred();
        var ctr = 0;
        for(var queue in me.queues){
            if(me.queues.hasOwnProperty(queue)){
                ++ctr;
                me.runQueue('queues', queue, function(){
                    if(--ctr == 0) deferred.resolve();
                });
            }
        }
        if(ctr == 0) deferred.resolve();
        return deferred.promise;
    }).then(function(){
        MagnetJS.Storage.set(me.queuesName, me.queues);
        MagnetJS.Storage.set(me.defaultQueueName, me.defaultQueue);
    });
}
/**
 * Iterates through an array of reliable call requests and performs each request in FIFO synchronously until the array is empty or a constraint is not met.
 * @param {string} storeName Name of the store.
 * @param {string} [queueName] The name of the queueName if applicable.
 * @param {function} done Executes after the queue is drained or a constraint is not met.
 */
MagnetJS.CallManager.runQueue = function(storeName, queueName, done){
    var me = this;
    var store = queueName ? this[storeName][queueName] : this[storeName];
    if(MagnetJS.Utils.isArray(store) && store.length > 0){
        if(me.isExpired(store[0].callOptions.requestAge) === true){
            store.shift();
            me.runQueue(storeName, queueName, done);
        }else if(me.isConstraintMet(store[0].callOptions.constraint)){
            var req = new MagnetJS.Request(undefined, store[0].options, store[0].metadata);
            req.send(function(result, details){
                MagnetJS.ReliableCallListener.invoke(['onSuccess', store[0].callOptions.success], store[0].metadata.params, result, details);
                store.shift();
                me.runQueue(storeName, queueName, done);
            }, function(e, details){
                MagnetJS.ReliableCallListener.invoke(['onError', store[0].callOptions.error], store[0].metadata.params, e, details);
                store.shift();
                me.runQueue(storeName, queueName, done);
            });
        }else{
            if(queueName) this[storeName][queueName] = store;
            else this[storeName] = store;
            done();
        }
    }else{
        if(queueName) delete me[storeName][queueName];
        else me[storeName] = [];
        done();
    }
}
/**
 * Cache the given request object.
 * @param {string} callId A unique identifier for this request.
 * @param {object} options The request options to cache.
 * @param {object} metadata The request metadata to cache.
 */
MagnetJS.CallManager.setRequestObject = function(callId, options, metadata){
    var queueName = options.callOptions.queueName && options.callOptions.queueName != '' ? options.callOptions.queueName : false;
    var store = queueName ? this.queues[queueName] : this.defaultQueue;
    store = store || [];
    store.push({
        callId      : callId,
        callOptions : options.callOptions,
        options     : options,
        metadata    : metadata
    });
    delete store[store.length-1].options.callOptions;
    if(queueName){
        this.queues[queueName] = store;
        MagnetJS.Storage.set(this.queuesName, this.queues);
    }else{
        this.defaultQueue = store;
        MagnetJS.Storage.set(this.defaultQueueName, this.defaultQueue);
    }
}
/**
 * Set cached value of the given callId.
 * @param {string} callId A unique identifier for this request.
 * @param {CallOptions} callOptions The CallOptions object instance.
 * @param {*} result The result data to cache.
 * @param {object} details The details object to cache.
 */
MagnetJS.CallManager.setCacheObject = function(callId, callOptions, result, details){
    this.cache[callId] = {
        callOptions : callOptions,
        result      : result,
        details     : details || {}
    };
}
/**
 * Get cached value of the given callId if the cached value exists and has not expired.
 * @param {string} callId A callId.
 * @returns {object} Cached value or undefined if cached value has expired or is not available.
 */
MagnetJS.CallManager.getCache = function(callId){
    if(this.cache[callId]
        && this.isExpired(this.cache[callId].callOptions.cacheAge)
        && (this.cache[callId].callOptions.ignoreAgeIfOffline === false
        || this.getConnectionState() != 'NONE'))
        delete this.cache[callId];
    return this.cache[callId];
}
/**
 * Generate a callId given arbitrary string arguments. Uses the CryptoJS MD5 library to generate a hash or falls back to encodeURIComponent.
 * @param {string} An arbitrary number of string arguments to convert into a hash.
 * @returns {string}
 */
MagnetJS.CallManager.getCallId = function(){
    var args = [].slice.call(arguments).join('|');
    return CryptoJS ? CryptoJS.MD5(args).toString() : encodeURIComponent(args);
}
/**
 * Get the current time in seconds.
 * @returns {number}
 */
MagnetJS.CallManager.getTimeInSeconds = function(){
    return Math.round(new Date().getTime() / 1000);
}
/**
 * Determines whether the given age is expired.
 * @returns {boolean}
 */
MagnetJS.CallManager.isExpired = function(age){
    return this.getTimeInSeconds() >= age;
}
/**
 * Set properties of a CallOptions object.
 * @param {CallOptions} [me] An instance of the CallOptions object. If not specified, "this" in the current scope is used instead.
 * @param {object} properties An object containing key-value pair properties.
 */
MagnetJS.CallManager.set = function(me, properties){
    me = me || this;
    for(var key in properties)
        if(properties.hasOwnProperty(key))
            if(key == 'cacheTimeout') me.setCacheTimeout(properties[key]);
            else if(key == 'requestTimeout' && me.setRequestTimeout) me.setRequestTimeout(properties[key]);
            else me[key] = properties[key];
}
/**
 * Returns whether or not the given constraint is met.
 * @param {array} constraint The constraint requirement object.
 * @returns {boolean} Indicates whether the constraint is met.
 */
MagnetJS.CallManager.isConstraintMet = function(constraint){
    if(constraint && MagnetJS.Utils.isArray(constraint)){
        var validNetwork, validGeo = true, networkState = this.getConnectionState(), geo = MagnetJS.Geolocation.current;
        for(var i=0;i<constraint.length;++i){
            if(typeof constraint[i] == 'string' && constraint[i] == networkState){
                validNetwork = true;
            }else if(MagnetJS.Utils.isObject(constraint[i])){
                if(MagnetJS.Geolocation.state === 'OK'){
                    if(MagnetJS.Geolocation.isWithinBoundaries(constraint[i], {
                        lat : geo.coords.latitude,
                        lng : geo.coords.longitude
                    }) === false)
                        validGeo = false;
                }else{
                    validGeo = false;
                }
            }
        }
        return (validNetwork === true && validGeo === true);
    }else{
        return true;
    }
}
/**
 * Returns the current network connection state through javascript-native bridge.
 */
MagnetJS.CallManager.getConnectionState = function(){
    var state = 'WIFI';
    // phonegap detection
    if(MagnetJS.Utils.isObject(navigator) && navigator.connection && navigator.connection.type){
        var connection = navigator.connection.type;
        switch(connection){
            case Connection.ETHERNET : state = 'WIFI'; break;
            case Connection.WIFI : state = 'WIFI'; break;
            case Connection.CELL : state = 'CELL'; break;
            case Connection.CELL_2G : state = 'CELL'; break;
            case Connection.CELL_3G : state = 'CELL'; break;
            case Connection.CELL_4G : state = 'CELL'; break;
            case Connection.NONE : state = 'NONE'; break;
            default : state = connection; break;
        }
    }
    return state;
}

/**
 * A reliable call listener which dispatches success and error events provided by a ReliableCallOptions object. To execute a callback
 * of name "reliableSuccess" after a ReliableCallOptions request, bind an event to the ReliableCallListener: MagnetJS.ReliableCallListener.on('reliableSuccess', function(){});
 * To unbind an event, MagnetJS.ReliableCallListener.unbind('reliableSuccess');
 * @memberof MagnetJS
 * @namespace ReliableCallListener
 */
MagnetJS.ReliableCallListener = {
    /**
     * Bind a callback function associated with the given callback ID to fire when it is invoked after a ReliableCallOptions request.
     * @param callbackId ID of the callback.
     * @param callback A callback function.
     */
    on     : function(callbackId, callback){},
    /**
     * Unbind the callback functions associated with a given callback ID.
     * @param callbackId ID of the callback.
     */
    unbind : function(callbackId){}
};
MagnetJS.ReliableCallListener = {};
MagnetJS.Events.create(MagnetJS.ReliableCallListener);

/**
 * CallOptions augment a controller method to engage in special request operations. Also see @see MagnetJS.AsyncCallOptions
 * and @see MagnetJS.ReliableCallOptions, which extend this object.
 * @constructor
 */
MagnetJS.CallOptions = function(options){
    /**
     * Invoke the call only if this constraint is met. This means Async (non-reliable) calls will fail fast. Reliable calls will wait.
     * @property {string}
     */
    this.constraint = '';
    /**
     * Optional. A user can set a custom opaque token for this call.
     * @type {string}
     */
    this.token = '';
    /**
     * The epoch time in seconds when the cached value will expire. 0 to discard the cache, > 0 to use the cache if the age is still valid. This value can be set easily by specifying a timeout with CallOptions.setCacheTimeout().
     * @type {number}
     */
    this.cacheAge = 0;
    /**
     * Ignore the timeout in offline mode.
     * @type {boolean}
     */
    this.ignoreAgeIfOffline = false;
    /**
     * Skip validation of data.
     * @type {boolean}
     */
    this.skipValidation = false;
    if(options) MagnetJS.CallManager.set(this, options);
}
/**
 * Specify the length of time (seconds) before the cached value expires. If this option is specified, the call will attempt to use the cached value and the response will always be cached. If not specified, the cached value will be discarded and the response will not be cached.
 * @param {number} [timeout] Number of seconds until cache expires. 0 to discard the cache, > 0 to use the cache if the age is still valid.
 * @param {boolean} [ignoreAgeIfOffline] indicates whether or not to use the cached value in an off-line mode despite of its age. Default is false.
 */
MagnetJS.CallOptions.prototype.setCacheTimeout = function(timeout, ignoreAgeIfOffline){
    this.cacheAge = timeout ? MagnetJS.CallManager.getTimeInSeconds() + timeout : 0;
    this.ignoreAgeIfOffline = ignoreAgeIfOffline;
}

/**
 * Options for an asynchronous call. An asynchronous call allows the caller to use the cached value and to impose a restriction when the call can be invoked. These types of options are only applicable when the user is seen as “online” and connected to the server. If you wish to submit operations while in an “offline” state, or there is a need for more reliable long-lasting durable operations then use MMReliableCallOptions instead. If no options are specified, async (unreliable) call is assumed.
 * @augments MagnetJS.CallOptions
 * @constructor
 * @memberof MagnetJS
 */
MagnetJS.AsyncCallOptions = function(){
    MagnetJS.CallOptions.apply(this, arguments);
};
MagnetJS.AsyncCallOptions.prototype = new MagnetJS.CallOptions();
MagnetJS.AsyncCallOptions.prototype.constructor = MagnetJS.AsyncCallOptions;

/**
 * Options for a reliable asynchronous call. A reliable asynchronous call allows the caller to use the cached value, to queue up a call in a persistent storage even if the caller is offline at submission time, to execute the calls in sequential manner, to impose a restriction when the call can be invoked and to specify a timeout for this call.
 * @augments MagnetJS.CallOptions
 * @constructor
 */
MagnetJS.ReliableCallOptions = function(){
    /**
     * Place a call on a queue specified by a queue name. The pending calls on a queue will be invoked sequentially. If concurrent invocation is wanted, the calls should be put on multiple reliableQueues.
     * @type {string}
     */
    this.queueName;
    /**
     * The timeout in milliseconds the server should hold on to the result (max of request and resposne timeouts).
     * @type {number}
     */
    this.serverTimeout = 0;
    /**
     * The epoch time in seconds when the request will expire. This value can be set easily by specifying a timeout with ReliableCallOptions.setRequestTimeout().
     * @type {number}
     */
    this.requestAge = 0;
    /**
     * A success event to be be dispatched by MagnetJS.ReliableCallListener upon a successful request. Listen for this event by using the "on" method: MagnetJS.ReliableCallListener.on('your_event', function(){});
     * @type {string}
     */
    this.success;
    /**
     * An error event to be be dispatched by MagnetJS.ReliableCallListener upon a successful request. Listen for this event by using the "on" method: MagnetJS.ReliableCallListener.on('your_event', function(){});
     * @type {string}
     */
    this.error;
    /**
     * A flag to determine whether the CallOptions object is a ReliableCallOptions.
     * @type {boolean}
     */
    this.isReliable = true;
    /**
     * A correlation id to be sent to the server.
     * @type {string}
     */
    this.correlationId = MagnetJS.Utils.getGUID();
    MagnetJS.CallOptions.apply(this, arguments);
};
MagnetJS.ReliableCallOptions.prototype = new MagnetJS.CallOptions();
MagnetJS.ReliableCallOptions.prototype.constructor = MagnetJS.ReliableCallOptions;

/**
 * Specify the length of time (seconds) before the request expires.
 * @param {number} timeout Number of seconds before the request expires. 0 to discard the request, > 0 to use the request if the age is still valid.
 */
MagnetJS.ReliableCallOptions.prototype.setRequestTimeout = function(timeout){
    this.serverTimeout = (timeout * 1000) + (30 * 1000);
    this.requestAge = timeout ? MagnetJS.CallManager.getTimeInSeconds() + timeout : 0;
}

/**
 * A class containing various network and geolocation constraints. Constraints provide a means to impose conditions
 * that a queue must meet before it can be processed. A queued call can be processed only when the constraint is met.
 * @memberof MagnetJS
 * @namespace Constraints
 */
MagnetJS.Constraints = {
    /**
     * The device must have a Wifi connection available to meet this constraint.
     */
    Wifi : ['WIFI'],
    /**
     * The device must have either a Wifi or cellular connection available to meet this constraint.
     */
    Mobile : ['CELL', 'WIFI'],
    /**
     * Create a custom constraint. A user-defined function can be bound to this constraint to provide custom
     * validation of whether a constraint is met. Optionally, network constraints can be specified to further
     * refine the constraint.
     * @param {string} name The name of the constraint to be created.
     * @param {array} [definitions] An array of constraints. For example, ['WIFI', 'CELL'] would specify that the
     * constraint will be met if the device is on either a Wifi or cellular network connection. A MagnetJS.Geostore
     * object can be passed in the array. If the constraint contains a Geostore, the controller call will only execute
     * if the current geolocation of the device is within the boundaries of the Geostore object.
     */
    createConstraint : function(name, definitions){
        this[name] = definitions;
    }
};

/**
 * A class designed to simplify storage of binary data from controller requests to the filesystem in a Phonegap app.
 * @memberof MagnetJS
 * @namespace FileManager
 * @ignore
 */
MagnetJS.FileManager = {
    /**
     * @property {LocalFileSystem} fileSystem A Phonegap LocalFileSystem object to store files onto the mobile device.
     */
    fileSystem : null,
    /**
     * @property {string} filePath File system path to Documents directory since it is a different path for each file system.
     */
    filePath   : null,
    /**
     * @property {string|object} status Status of the fileSystem retrieval.
     */
    status     : false,
    /**
     * @property {string} tempFile A file name. The file will be created temporarily to obtain the fileSystem path.
     */
    tempFile   : '_magnet_temp.txt',
    /**
     * Request an instance of a Phonegap LocalFileSystem object. Updates the FileManager properties fileSystem,
     * filePath, and status after completion.
     * @param {function} callback Executes if the fileSystem object is retrieved successfully.
     * @param {function} failback Executes if an error occurs during fileSystem object retrieval.
     */
    getFS : function(callback, failback){
        var me = this;
        if(me.fileSystem && me.filePath){
            callback(me.fileSystem, me.filePath);
        }else if(me.status !== false && me.status != 'OK'){
            failback();
        }else if(MagnetJS.Utils.isCordova && window.requestFileSystem && typeof FileTransfer !== 'undefined'){
            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function(fs){
                me.fileSystem = fs;
                me.fileSystem.root.getFile(me.tempFile, {
                    create    : true,
                    exclusive : false
                }, function(fileEntry){
                    me.filePath = fileEntry.fullPath.replace(me.tempFile, '');
                    fileEntry.remove();
                    me.status = 'OK';
                    callback(me.fileSystem, me.filePath);
                }, function(e){
                    me.status = e;
                    failback();
                });
            }, function(e){
                me.status = e;
                failback();
            });
        }else{
            if(me.status === false)
                MagnetJS.Log('The "org.apache.cordova.file-transfer" Phonegap plugin has not been added.');
            me.status = 'FAILED';
            failback();
        }
    },
    /**
     * Save a file to the file system and return a fileEntry object upon completion.
     * @param {string} filename Filename of the file to be created.
     * @param {*} data The file data.
     * @param {function} callback Executes if the file is created successfully.
     * @param {function} failback Executes if an error occurs.
     */
    writeFile : function(filename, data, callback, failback){
        this.fileSystem.root.getFile(filename, {
            create    : true,
            exclusive : false
        }, function(fileEntry){
            fileEntry.createWriter(function(fileWriter){
                fileWriter.onwrite = function(){
                    callback(fileEntry);
                };
                fileWriter.write(data);
            }, failback);
        }, failback);
    }
}

/**
 * @constructor
 * @memberof MagnetJS
 * @class Contains the latitude and longitude of a point.
 * @param {number} latitude A decimal latitude of a point.
 * @param {number} longitude A decimal longitude of a point.
 */
MagnetJS.Geoentry = function(latitude, longitude){
    this.lat = latitude;
    this.lng = longitude;
}
/**
 * @constructor
 * @memberof MagnetJS
 * @class A Geostore object defines a set of boundaries around an area using any number of latitude and longitude coordinates. Geostores are useful in
 * determining whether the location of the device containing the app are inside or outside of the defined boundaries. Geostores can be configured
 * to a MagnetJS.CallOptions object to assure that a controller call is made while the device is inside or outside the boundaries defined by the Geostore.
 * @param {MagnetJS.Geoentry[]} [points] An array of MagnetJS.Geoentry objects which define the boundaries of an area.
 */
MagnetJS.Geostore = function(points){
    this.points = points || [];
}
/**
 * Add a MagnetJS.Geoentry object to the fence.
 * @param {number} latitude A decimal latitude of a point.
 * @param {number} longitude A decimal longitude of a point.
 */
MagnetJS.Geostore.prototype.add = function(latitude, longitude){
    this.points.push(new MagnetJS.Geoentry(latitude, longitude));
}

/**
 * Third party plugins.
 */

/*!
 CryptoJS v3.1.2
 code.google.com/p/crypto-js
 (c) 2009-2013 by Jeff Mott. All rights reserved.
 code.google.com/p/crypto-js/wiki/License
 */
var CryptoJS=CryptoJS||function(s,p){var m={},l=m.lib={},n=function(){},r=l.Base={extend:function(b){n.prototype=this;var h=new n;b&&h.mixIn(b);h.hasOwnProperty("init")||(h.init=function(){h.$super.init.apply(this,arguments)});h.init.prototype=h;h.$super=this;return h},create:function(){var b=this.extend();b.init.apply(b,arguments);return b},init:function(){},mixIn:function(b){for(var h in b)b.hasOwnProperty(h)&&(this[h]=b[h]);b.hasOwnProperty("toString")&&(this.toString=b.toString)},clone:function(){return this.init.prototype.extend(this)}},
    q=l.WordArray=r.extend({init:function(b,h){b=this.words=b||[];this.sigBytes=h!=p?h:4*b.length},toString:function(b){return(b||t).stringify(this)},concat:function(b){var h=this.words,a=b.words,j=this.sigBytes;b=b.sigBytes;this.clamp();if(j%4)for(var g=0;g<b;g++)h[j+g>>>2]|=(a[g>>>2]>>>24-8*(g%4)&255)<<24-8*((j+g)%4);else if(65535<a.length)for(g=0;g<b;g+=4)h[j+g>>>2]=a[g>>>2];else h.push.apply(h,a);this.sigBytes+=b;return this},clamp:function(){var b=this.words,h=this.sigBytes;b[h>>>2]&=4294967295<<
        32-8*(h%4);b.length=s.ceil(h/4)},clone:function(){var b=r.clone.call(this);b.words=this.words.slice(0);return b},random:function(b){for(var h=[],a=0;a<b;a+=4)h.push(4294967296*s.random()|0);return new q.init(h,b)}}),v=m.enc={},t=v.Hex={stringify:function(b){var a=b.words;b=b.sigBytes;for(var g=[],j=0;j<b;j++){var k=a[j>>>2]>>>24-8*(j%4)&255;g.push((k>>>4).toString(16));g.push((k&15).toString(16))}return g.join("")},parse:function(b){for(var a=b.length,g=[],j=0;j<a;j+=2)g[j>>>3]|=parseInt(b.substr(j,
        2),16)<<24-4*(j%8);return new q.init(g,a/2)}},a=v.Latin1={stringify:function(b){var a=b.words;b=b.sigBytes;for(var g=[],j=0;j<b;j++)g.push(String.fromCharCode(a[j>>>2]>>>24-8*(j%4)&255));return g.join("")},parse:function(b){for(var a=b.length,g=[],j=0;j<a;j++)g[j>>>2]|=(b.charCodeAt(j)&255)<<24-8*(j%4);return new q.init(g,a)}},u=v.Utf8={stringify:function(b){try{return decodeURIComponent(escape(a.stringify(b)))}catch(g){throw Error("Malformed UTF-8 data");}},parse:function(b){return a.parse(unescape(encodeURIComponent(b)))}},
    g=l.BufferedBlockAlgorithm=r.extend({reset:function(){this._data=new q.init;this._nDataBytes=0},_append:function(b){"string"==typeof b&&(b=u.parse(b));this._data.concat(b);this._nDataBytes+=b.sigBytes},_process:function(b){var a=this._data,g=a.words,j=a.sigBytes,k=this.blockSize,m=j/(4*k),m=b?s.ceil(m):s.max((m|0)-this._minBufferSize,0);b=m*k;j=s.min(4*b,j);if(b){for(var l=0;l<b;l+=k)this._doProcessBlock(g,l);l=g.splice(0,b);a.sigBytes-=j}return new q.init(l,j)},clone:function(){var b=r.clone.call(this);
        b._data=this._data.clone();return b},_minBufferSize:0});l.Hasher=g.extend({cfg:r.extend(),init:function(b){this.cfg=this.cfg.extend(b);this.reset()},reset:function(){g.reset.call(this);this._doReset()},update:function(b){this._append(b);this._process();return this},finalize:function(b){b&&this._append(b);return this._doFinalize()},blockSize:16,_createHelper:function(b){return function(a,g){return(new b.init(g)).finalize(a)}},_createHmacHelper:function(b){return function(a,g){return(new k.HMAC.init(b,
    g)).finalize(a)}}});var k=m.algo={};return m}(Math);
(function(s){function p(a,k,b,h,l,j,m){a=a+(k&b|~k&h)+l+m;return(a<<j|a>>>32-j)+k}function m(a,k,b,h,l,j,m){a=a+(k&h|b&~h)+l+m;return(a<<j|a>>>32-j)+k}function l(a,k,b,h,l,j,m){a=a+(k^b^h)+l+m;return(a<<j|a>>>32-j)+k}function n(a,k,b,h,l,j,m){a=a+(b^(k|~h))+l+m;return(a<<j|a>>>32-j)+k}for(var r=CryptoJS,q=r.lib,v=q.WordArray,t=q.Hasher,q=r.algo,a=[],u=0;64>u;u++)a[u]=4294967296*s.abs(s.sin(u+1))|0;q=q.MD5=t.extend({_doReset:function(){this._hash=new v.init([1732584193,4023233417,2562383102,271733878])},
    _doProcessBlock:function(g,k){for(var b=0;16>b;b++){var h=k+b,w=g[h];g[h]=(w<<8|w>>>24)&16711935|(w<<24|w>>>8)&4278255360}var b=this._hash.words,h=g[k+0],w=g[k+1],j=g[k+2],q=g[k+3],r=g[k+4],s=g[k+5],t=g[k+6],u=g[k+7],v=g[k+8],x=g[k+9],y=g[k+10],z=g[k+11],A=g[k+12],B=g[k+13],C=g[k+14],D=g[k+15],c=b[0],d=b[1],e=b[2],f=b[3],c=p(c,d,e,f,h,7,a[0]),f=p(f,c,d,e,w,12,a[1]),e=p(e,f,c,d,j,17,a[2]),d=p(d,e,f,c,q,22,a[3]),c=p(c,d,e,f,r,7,a[4]),f=p(f,c,d,e,s,12,a[5]),e=p(e,f,c,d,t,17,a[6]),d=p(d,e,f,c,u,22,a[7]),
        c=p(c,d,e,f,v,7,a[8]),f=p(f,c,d,e,x,12,a[9]),e=p(e,f,c,d,y,17,a[10]),d=p(d,e,f,c,z,22,a[11]),c=p(c,d,e,f,A,7,a[12]),f=p(f,c,d,e,B,12,a[13]),e=p(e,f,c,d,C,17,a[14]),d=p(d,e,f,c,D,22,a[15]),c=m(c,d,e,f,w,5,a[16]),f=m(f,c,d,e,t,9,a[17]),e=m(e,f,c,d,z,14,a[18]),d=m(d,e,f,c,h,20,a[19]),c=m(c,d,e,f,s,5,a[20]),f=m(f,c,d,e,y,9,a[21]),e=m(e,f,c,d,D,14,a[22]),d=m(d,e,f,c,r,20,a[23]),c=m(c,d,e,f,x,5,a[24]),f=m(f,c,d,e,C,9,a[25]),e=m(e,f,c,d,q,14,a[26]),d=m(d,e,f,c,v,20,a[27]),c=m(c,d,e,f,B,5,a[28]),f=m(f,c,
            d,e,j,9,a[29]),e=m(e,f,c,d,u,14,a[30]),d=m(d,e,f,c,A,20,a[31]),c=l(c,d,e,f,s,4,a[32]),f=l(f,c,d,e,v,11,a[33]),e=l(e,f,c,d,z,16,a[34]),d=l(d,e,f,c,C,23,a[35]),c=l(c,d,e,f,w,4,a[36]),f=l(f,c,d,e,r,11,a[37]),e=l(e,f,c,d,u,16,a[38]),d=l(d,e,f,c,y,23,a[39]),c=l(c,d,e,f,B,4,a[40]),f=l(f,c,d,e,h,11,a[41]),e=l(e,f,c,d,q,16,a[42]),d=l(d,e,f,c,t,23,a[43]),c=l(c,d,e,f,x,4,a[44]),f=l(f,c,d,e,A,11,a[45]),e=l(e,f,c,d,D,16,a[46]),d=l(d,e,f,c,j,23,a[47]),c=n(c,d,e,f,h,6,a[48]),f=n(f,c,d,e,u,10,a[49]),e=n(e,f,c,d,
            C,15,a[50]),d=n(d,e,f,c,s,21,a[51]),c=n(c,d,e,f,A,6,a[52]),f=n(f,c,d,e,q,10,a[53]),e=n(e,f,c,d,y,15,a[54]),d=n(d,e,f,c,w,21,a[55]),c=n(c,d,e,f,v,6,a[56]),f=n(f,c,d,e,D,10,a[57]),e=n(e,f,c,d,t,15,a[58]),d=n(d,e,f,c,B,21,a[59]),c=n(c,d,e,f,r,6,a[60]),f=n(f,c,d,e,z,10,a[61]),e=n(e,f,c,d,j,15,a[62]),d=n(d,e,f,c,x,21,a[63]);b[0]=b[0]+c|0;b[1]=b[1]+d|0;b[2]=b[2]+e|0;b[3]=b[3]+f|0},_doFinalize:function(){var a=this._data,k=a.words,b=8*this._nDataBytes,h=8*a.sigBytes;k[h>>>5]|=128<<24-h%32;var l=s.floor(b/
        4294967296);k[(h+64>>>9<<4)+15]=(l<<8|l>>>24)&16711935|(l<<24|l>>>8)&4278255360;k[(h+64>>>9<<4)+14]=(b<<8|b>>>24)&16711935|(b<<24|b>>>8)&4278255360;a.sigBytes=4*(k.length+1);this._process();a=this._hash;k=a.words;for(b=0;4>b;b++)h=k[b],k[b]=(h<<8|h>>>24)&16711935|(h<<24|h>>>8)&4278255360;return a},clone:function(){var a=t.clone.call(this);a._hash=this._hash.clone();return a}});r.MD5=t._createHelper(q);r.HmacMD5=t._createHmacHelper(q)})(Math);

})(typeof exports === 'undefined' ? this['MagnetJS'] || (this['MagnetJS']={}) : exports);