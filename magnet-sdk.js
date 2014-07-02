    /*!*
     * @fileoverview Magnet Mobile Server SDK for JavaScript
     *
     * @version 2.3.0-RC1
     */

    (function(MagnetJS){

/**
 * Namespace for the Magnet Mobile Server SDK for JavaScript.
 * @namespace MagnetJS
 */

/**
 * @global
 * @desc An object containing attributes used across the MagnetJS SDK.
 * @ignore
 */
MagnetJS.Config = {
    /**
     * @property {string} endpointUrl The host for the Magnet Mobile App Server.
     */
    endpointUrl            : '',
    /**
     * @property {boolean} logging Enable display of logs during code execution for debugging purposes.
     */
    logging                : true,
    /**
     * @property {boolean} storeCredentials Enable storage of user credentials after a successful login.
     * This is required for the LoginService.loginWithSavedCredentials method, allowing the user to login automatically
     * after a restart of the app. Note that credentials are stored in plain text. The default is false.
     */
    storeCredentials       : false,
    /**
     * @property {boolean} debugMode Ignore self-signed certificates when saving files to the file system. Only applicable
     * to the Phonegap client when using FileTransfer API transport.
     */
    debugMode              : false,
    /**
     * @property {string} sdkVersion Version of the Magnet Mobile SDK for JavaScript.
     */
    sdkVersion             : '2.3.0-RC1'
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
     * Indicates whether the current browser is an Android device.
     */
    isAndroid : (typeof navigator !== 'undefined' && navigator.userAgent) ? /Android|webOS/i.test(navigator.userAgent) : false,
    /**
     * Indicates whether the current browser is an iOS device.
     */
    isIOS : (typeof navigator !== 'undefined' && navigator.userAgent) ? /iPhone|iPad|iPod/i.test(navigator.userAgent) : false,
    /**
     * Indicates whether the current browser is an iOS or Android device.
     */
    isMobile : (typeof navigator !== 'undefined' && navigator.userAgent) ? /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) : false,
    /**
     * Indicates whether the current client is a Node.js server.
     */
    isNode : (typeof module !== 'undefined' && module.exports && typeof window === 'undefined'),
    /**
     * Indicates whether the current client is a Cordova app.
     */
    isCordova : (typeof navigator !== 'undefined' && navigator.userAgent) &&
        (typeof window !== 'undefined' && window.location && window.location.href) &&
        (typeof cordova !== 'undefined' || typeof PhoneGap !== 'undefined' || typeof phonegap !== 'undefined') &&
        /^file:\/{3}[^\/]/i.test(window.location.href) &&
        /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent),
    /**
     * Merges the attributes of the second object into the first object.
     * @param {object} obj1 The first object, into which the attributes will be merged.
     * @param {object} obj2 The second object, whose attributes will be merged into the first object.
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
     * Determines whether the input is a JavaScript object.
     * @param {*} input The input to check.
     */
    isObject : function(input){
        return Object.prototype.toString.call(input) == "[object Object]";
    },
    /**
     * Determines whether the input is a JavaScript array.
     * @param {*} input The input to check.
     */
    isArray : function(input){
        return Object.prototype.toString.call(input) === '[object Array]';
    },
    /**
     * Convert the specified string to JSON if successful; otherwise returns false.
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
     * Convert the specified string to XML if successful; otherwise returns false.
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
     * Convert the specified object into Form Data.
     * @param {string} str The input to convert.
     * @returns {string} A Form Data string.
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
     * Retrieve all attribute names of the specified object as an array.
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
     * Retrieve all properties of the specified object as an array.
     * @param {object} obj The object to parse.
     */
    getValues : function(obj){
        var ary = [];
        obj = obj || {};
        for(var attr in obj){
            if(obj.hasOwnProperty(attr)) ary.push(obj[attr]);
        }
        return ary;
    },
    /**
     * Indicates whether the specified object is empty.
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
     * Convert XHR and response headers into a JavaScript object.
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
     * Remove attributes not defined in the specified schema and returns the corresponding set of entity attributes.
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
     * Handles basic validation of object attributes based on the specified schema.
     * @param {object} schema The controller or model schema consistent with the server.
     * @param {object} attributes The current set of controller or model attributes.
     * @param {boolean} isUpdate If enabled, do not fail validation on missing required fields. Default is disabled (false).
     * @returns {object|boolean} An array of invalid property objects, or false if validation passes.
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
                if(typeof schema !== 'undefined' && typeof schema[attr] !== 'undefined' && typeof schema[attr].type !== 'undefined')
                    type = type.trim();
                if(schema[attr].optional === false && (typeof attributes[attr] === 'undefined' || attributes[attr] === '')){
                    if(!isUpdate) obj.reason = 'required field blank';
                }else if(attributes[attr] && ((type == 'integer' || type == 'biginteger' || type == 'bigdecimal' || type == 'double' || type == 'long' || type == 'float' || type == 'short' || type == 'byte') && !MagnetJS.Utils.isNumeric(attributes[attr]))){
                    obj.reason = 'not numeric';
                }else if(attributes[attr] && type == 'boolean' && attributes[attr] !== 'true' && attributes[attr] !== true && attributes[attr] !== 'false' && attributes[attr] !== false){
                    obj.reason = 'not boolean';
                }else if(attributes[attr] && (type == 'java.util.List' ||  type == 'array') && (!attributes[attr] || attributes[attr].length == 0 || this.isArray(attributes[attr]) === false)){
                    obj.reason = 'empty list';
                }else if(attributes[attr] && (type == '_data' || type == 'binary') && (!attributes[attr].mimeType || !attributes[attr].val)){
                    obj.reason = 'invalid binary format';
                }
                if(obj.reason) invalid.push(obj);
            }
        }
        return invalid.length == 0 ? false : invalid;
    },
    /**
     * Determines whether the specified feature is available in the current browser or mobile client.
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
     * Determines whether the specified attribute is a primitive type.
     * @param {string} str The attribute type.
     */
    isPrimitiveType : function(str){
        return '|byte|short|int|long|float|double|boolean|char|string|integer|void|'.indexOf('|'+str+'|') != -1;
    },
    /**
     * Determines whether the specified attribute is an array type. If its type is an array, the type of data in the array is returned; otherwise returns false.
     * @param {string} str The attribute type.
     */
    getArrayType : function(str){
        return str.indexOf('[]') != -1 ? str.slice(0, -2) : false;
    },
    /**
     * Determines the data type for the specified attribute type.
     * @param {string} str The attribute type.
     */
    getDataType : function(str){
        var type;
        switch(Object.prototype.toString.call(str)){
            case '[object Number]'    : type = 'integer'; break;
            case '[object String]'    : type = 'string'; break;
            case '[object Array]'     : type = 'array'; break;
            case '[object Object]'    : type = 'object'; break;
            case '[object Date]'      : type = 'date'; break;
            case '[object Boolean]'   : type = 'boolean'; break;
        }
        return type;
    },
    /**
     * Determines whether the specified attribute is of type date.
     * @param {string} str The attribute type.
     */
    isDateType : function(str){
        return ('|date|'.indexOf('|'+str+'|') != -1) === true;
    },
    /**
     * Determines whether the specified attribute is of type binary.
     * @param {string} str The attribute type.
     */
    isBinaryType : function(str){
        return ('|binary|_data|'.indexOf('|'+str+'|') != -1) === true;
    },
    /**
     * Determines whether the specified attribute is a generic object type.
     * @param {string} str The attribute type.
     */
    isGenericObject : function(str){
        return ('|object|'.indexOf('|'+str+'|') != -1) === true;
    },
    /**
     * Determines whether the specified attribute is of type Model or Collection.
     * @param {string} str The attribute type.
     */
    isModelOrCollection : function(str){
        return (MagnetJS.Models[str] || MagnetJS.Models[this.getArrayType(str)]) ? true : false;
    },
    /**
     * Converts the specified Date object as an ISO 8601 Extended Format string. This is a shim for clients that do not support .toISOString.
     * @param {Date} date The Date object to be converted to an ISO 8601 Extended Format string.
     * @returns {string} An equivalent ISO 8601 Extended Format string.
     */
    dateToISO8601 : function(d){
        function pad(n){return n<10 ? '0'+n : n}
        return d.getUTCFullYear()+'-'
            + pad(d.getUTCMonth()+1)+'-'
            + pad(d.getUTCDate())+'T'
            + pad(d.getUTCHours())+':'
            + pad(d.getUTCMinutes())+':'
            + pad(d.getUTCSeconds())+'Z';
    },
    /**
     * Converts the specified Date string as an ISO 8601 Extended Format Date object.
     * @param {string} str An ISO 8601 Extended Format date string.
     * @returns {object} A Date object equivalent to the specified ISO 8601 Extended Format string.
     */
    ISO8601ToDate : function(str){
        if(typeof str !== 'string') return false;
        var re = /(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(\.\d+)?(Z|([+-])(\d\d):(\d\d))/;
        var d = [];
        d = str.match(re);
        if(!d){
            MagnetJS.Log("Couldn't parse ISO 8601 date string '" + str + "'");
            return false;
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
     * Convert a UTF-8 string into URI-encoded base64 string.
     * @param input A UTF-8 string.
     * @returns {string} An equivalent URI-encoded base64 string.
     */
    stringToBase64 : function(input){
        return (this.isNode === true && typeof Buffer !== 'undefined') ? new Buffer(input).toString('base64') : window.btoa(unescape(encodeURIComponent(input)));
    },
    /**
     * Convert a URI-encoded base64 string into a UTF-8 string.
     * @param input A URI-encoded base64 string.
     * @returns {string} An equivalent UTF-8 string.
     */
    base64ToString : function(input){
        return (this.isNode === true && typeof Buffer !== 'undefined') ? new Buffer(input, 'base64').toString('utf8') : decodeURIComponent(escape(window.atob(input)));
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
     * Stores success and error callbacks, and calls them if the Promise status is 'resolved' or 'rejected'.
     * @param success A callback that is fired upon a 'resolved' status.
     * @param error A callback that is fired upon a 'rejected' status.
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
     * Stores a callback that is fired if the Promise is rejected.
     * @param {function} error The error callback to be stored.
     * @returns {MagnetJS.Promise} A promise object.
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
     * Call and resolve a callback. If the result is a Promise object, bind a
     * new set of callbacks to the Promise object to continue the chain.
     * @param {object} obj An object containing the callback function and a Deferred object.
     * @param {*} args Arguments associated with this Promise.
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
 * @class A Deferred object handles execution of resolve and reject methods, which trigger the success or error callbacks.
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
 * Asynchronously execute the specified promises. On completion, return an array of success and error arguments in a 'then' function.
 * @param {MagnetJS.Promise} promises An object containing the specified promises.
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
};

/**
 * A class for extending an object with an event.
 * @memberof MagnetJS
 * @namespace Events
 * @ignore
 */
MagnetJS.Events = {
    /**
     * Extends an existing object to handle events.
     * @param {object} me An instance of a MagnetJS Controller.
     * @returns {boolean} Indicates whether the event handlers were created.
     */
    create : function(me){
        if(!me._events && !me.invoke && !me.on && !me.unbind){
            me._events = {};
            me.on = function(eventId, callback){
                me._events[eventId] = me._events[eventId] || [];
                me._events[eventId].push(callback);
            };
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
            };
            me.unbind = function(eventId){
                if(me._events[eventId]) delete me._events[eventId];
            };
            return true;
        }else{
            return false;
        }
    }
};

/**
 * A connector to manage data in a Web SQL database.
 * @memberof MagnetJS
 * @namespace SQLConnector
 * @ignore
 */
MagnetJS.SQLConnector = {
    /**
     * @attribute {Database} [db] An SQL Lite database object.
     */
    db : undefined,
    schemas : {},
    /**
     * @attribute {object} dbOptions SQL Lite database options.
     */
    dbOptions : {
        name    : 'MMSDK',
        version : '1.0',
        display : 'Magnet_JS_SDK_DB',
        size    : 5000000
    },
    create : function(table, kvp, callback, failback){
        var me = this;
        me.db.transaction(function(tx){
            var props = MagnetJS.Utils.getAttributes(kvp).join(', ');
            var vals = MagnetJS.Utils.getValues(kvp);
            MagnetJS.Log('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals);
            tx.executeSql('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals, function(insertTX, res){
                kvp.id = res.insertId;
                callback(kvp);
            });
        }, function(e){
            MagnetJS.Log('error inserting a record: ', e);
            failback(e);
        });
    },
    update : function(table, id, kvp, callback, failback){
        this.db.transaction(function(tx){
            delete kvp.id;
            var props = MagnetJS.Utils.getAttributes(kvp).join('=?, ')+'=?';
            var vals = MagnetJS.Utils.getValues(kvp);
            vals.push(id);
            MagnetJS.Log('UPDATE '+table+' SET '+props+' WHERE id=?', vals);
            tx.executeSql('UPDATE '+table+' SET '+props+' WHERE id=?', vals, function(){
                callback(kvp);
            });
        }, function(e){
            MagnetJS.Log('error updating a record: ', e);
            failback(e);
        });
    },
    get : function(table, input, callback, failback){
        var me = this;
        me.db.transaction(function(tx){
            if(typeof input === 'undefined' || input === null || input === '') input = {1:1};
            var props, vals, isQuery = typeof input === 'object';
            if(isQuery){
                props = MagnetJS.Utils.getAttributes(input).join('=? AND ')+'=?';
                vals = MagnetJS.Utils.getValues(input);
            }else{
                props = 'id=?';
                vals = [input];
            }
            MagnetJS.Log('SELECT * FROM '+table+' WHERE '+props, vals);
            tx.executeSql('SELECT * FROM '+table+' WHERE '+props, vals, function(tx, results){
                callback(me.formatResponse(results.rows, isQuery));
            }, function(e){
                MagnetJS.Log('error retrieving records: ', e);
                failback(e);
            });
        }, function(e){
            MagnetJS.Log('error setting up web sql transaction: ', e);
            failback(e);
        });
    },
    formatResponse : function(rows, isQuery){
        var ary = [];
        for(var i=0;i<rows.length;++i)
            ary.push(rows.item(i));
        return isQuery ? ary : ary[0];
    },
    remove : function(table, input, callback, failback){
        var me = this;
        me.db.transaction(function(tx){
            var props = [], vals = [], aryProps = [], aryVals = [];
            if(typeof input === 'object'){
                for(var prop in input){
                    if(MagnetJS.Utils.isArray(input[prop])){
                        aryProps.push(prop+' IN ('+me.getPlaceholders(input[prop])+')');
                        aryVals = aryVals.concat(MagnetJS.Utils.getValues(input[prop]));
                    }else{
                        props.push(prop+'=?');
                        vals.push(input[prop]);
                    }
                }
                props = props.concat(aryProps).join(' AND ');
                vals = vals.concat(aryVals);
            }else{
                props = 'id=?';
                vals = [input];
            }
            MagnetJS.Log('DELETE FROM '+table+' WHERE '+props, vals);
            tx.executeSql('DELETE FROM '+table+' WHERE '+props, vals);
        }, function(e){
            MagnetJS.Log('error deleting a record: ', e);
            failback(e);
        }, callback);
    },
    clearTable : function(table, callback, failback){
        this.db.transaction(function(tx){
            MagnetJS.Log('DELETE FROM '+table);
            tx.executeSql('DELETE FROM '+table);
        }, function(e){
            MagnetJS.Log('error clearing table: ', e);
            failback(e);
        }, callback);
    },
    createTableIfNotExist : function(table, schema, kvps, clearRecords, callback, failback){
        var me = this, props, vals, columns = ['id INTEGER PRIMARY KEY AUTOINCREMENT'];
        if(typeof schema === 'object'){
            for(var prop in schema)
                columns.push(prop+' '+schema[prop]);
            columns = columns.join(', ');
            me.schemas[table] = schema;
        }
        me.db.transaction(function(tx){
            MagnetJS.Log('CREATE TABLE IF NOT EXISTS '+table+' ('+columns+')');
            tx.executeSql('CREATE TABLE IF NOT EXISTS '+table+' ('+columns+')');
            if(clearRecords === true){
                MagnetJS.Log('DELETE FROM '+table);
                tx.executeSql('DELETE FROM '+table);
            }
            if(MagnetJS.Utils.isArray(kvps)){
                for(var i=0;i<kvps.length;++i){
                    props = MagnetJS.Utils.getAttributes(kvps[i]).join(', ');
                    vals = MagnetJS.Utils.getValues(kvps[i]);
                    MagnetJS.Log('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals);
                    tx.executeSql('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals);
                }
            }else if(kvps){
                props = MagnetJS.Utils.getAttributes(kvps).join(', ');
                vals = MagnetJS.Utils.getValues(kvps);
                MagnetJS.Log('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals);
                tx.executeSql('INSERT INTO '+table+' ('+props+') VALUES ('+me.getPlaceholders(vals)+')', vals);
            }
        }, function(e){
            MagnetJS.Log('error executing web sql transaction: ', e);
            failback(e);
        }, callback);
    },
    getPlaceholders : function(vals){
        var ques = [];
        for(var i=0;i<vals.length;++i) ques.push('?');
        return ques.join(', ');
    }
};
/**
 * A connector to manage data in a local storage database.
 * @memberof MagnetJS
 * @namespace LocalStorage
 * @ignore
 */
MagnetJS.LocalStorageConnector = {
    create : function(table, kvp, callback){
        setTimeout(function(){
            var tableData = MagnetJS.Utils.getValidJSON(window.localStorage.getItem(table)) || [];
            kvp.id = MagnetJS.Utils.getGUID();
            tableData.push(kvp);
            window.localStorage.setItem(table, JSON.stringify(tableData));
            callback(kvp);
        }, 1);
    },
    update : function(table, id, kvp, callback, failback){
        var record;
        setTimeout(function(){
            var tableData = MagnetJS.Utils.getValidJSON(window.localStorage.getItem(table));
            if(tableData){
                for(var i=0;i<tableData.length;++i){
                    if(tableData[i].id == id){
                        for(var key in kvp)
                            tableData[i][key] = kvp[key];
                        record = tableData[i];
                    }
                }
                if(typeof record === 'undefined'){
                    failback('record-not-exist');
                }else{
                    window.localStorage.setItem(table, JSON.stringify(tableData));
                    callback(record);
                }
            }else{
                failback('table-not-exist');
            }
        }, 1);
    },
    get : function(table, input, callback, failback){
        var records = [], valid = true;
        setTimeout(function(){
            var tableData = MagnetJS.Utils.getValidJSON(window.localStorage.getItem(table));
            if(tableData){
                if(typeof input === 'object'){
                    for(var i=0;i<tableData.length;++i){
                        for(var key in input)
                            if(tableData[i][key] !== input[key])
                                valid = false;
                        if(valid === true) records.push(tableData[i]);
                        valid = true;
                    }
                }else if(typeof input === 'undefined' || input === null || input === ''){
                    records = tableData;
                }else{
                    records = undefined;
                    for(var i=0;i<tableData.length;++i){
                        if(tableData[i].id == input){
                            records = tableData[i];
                            break;
                        }
                    }
                }
                callback(records);
            }else{
                failback('table-not-exist');
            }
        }, 1);
    },
    remove : function(table, input, callback, failback){
        var matched = true;
        setTimeout(function(){
            var tableData = MagnetJS.Utils.getValidJSON(window.localStorage.getItem(table));
            if(tableData){
                for(var i=tableData.length;i--;){
                    if(typeof input === 'object'){
                        matched = true;
                        for(var prop in input){
                            if(MagnetJS.Utils.isArray(input[prop])){
                                if(input[prop].indexOf(tableData[i][prop]) == -1) matched = false;
                            }else{
                                if(tableData[i][prop] !== input[prop]) matched = false;
                            }
                        }
                        if(matched) tableData.splice(i, 1);
                    }else{
                        if(tableData[i].id == input) tableData.splice(i, 1);
                    }
                }
                window.localStorage.setItem(table, JSON.stringify(tableData));
                callback();
            }else{
                failback('table-not-exist');
            }
        }, 1);
    },
    clearTable : function(table, callback){
        setTimeout(function(){
            window.localStorage.setItem(table, JSON.stringify([]));
            callback();
        }, 1);
    },
    createTableIfNotExist : function(table, schema, kvps, clearRecords, callback){
        setTimeout(function(){
            var tableData = (clearRecords === true ? [] : MagnetJS.Utils.getValidJSON(window.localStorage.getItem(table))) || [];
            if(MagnetJS.Utils.isArray(kvps)){
                for(var i=0;i<kvps.length;++i){
                    kvps[i].id = MagnetJS.Utils.getGUID();
                    tableData.push(kvps[i]);
                }
            }else if(kvps){
                kvps.id = MagnetJS.Utils.getGUID();
                tableData.push(kvps);
            }
            window.localStorage.setItem(table, JSON.stringify(tableData));
            callback();
        }, 1);
    }
};
/**
 * A connector to manage data in non-persistent memory store.
 * @memberof MagnetJS
 * @namespace SQLConnector
 * @ignore
 */
MagnetJS.MemoryStoreConnector = {
    /**
     * @attribute {object} memory Memory store for Node.js and other platforms which do not support localStorage.
     */
    memory : {},
    create : function(table, kvp, callback){
        this.memory[table] = this.memory[table] || [];
        kvp.id = MagnetJS.Utils.getGUID();
        this.memory[table].push(kvp);
        callback(kvp);
    },
    update : function(table, id, kvp, callback, failback){
        var record;
        if(this.memory[table]){
            for(var i=0;i<this.memory[table].length;++i){
                if(this.memory[table][i].id === id){
                    for(var key in kvp)
                        this.memory[table][i][key] = kvp[key];
                    record = this.memory[table][i];
                }
            }
            if(typeof record === 'undefined')
                failback('record-not-exist');
            else
                callback(record);
        }else{
            failback('table-not-exist');
        }
    },
    get : function(table, input, callback, failback){
        var records = [], valid = true;
        if(this.memory[table]){
            if(typeof input === 'object'){
                for(var i=0;i<this.memory[table].length;++i){
                    for(var key in input)
                        if(this.memory[table][i][key] !== input[key])
                            valid = false;
                    if(valid === true) records.push(this.memory[table][i]);
                    valid = true;
                }
            }else if(typeof input === 'undefined' || input === null || input === ''){
                records = this.memory[table];
            }else{
                records = undefined;
                for(var i=0;i<this.memory[table].length;++i){
                    if(this.memory[table][i].id == input){
                        records = this.memory[table][i];
                        break;
                    }
                }
            }
            callback(records);
        }else{
            failback('table-not-exist');
        }
    },
    remove : function(table, input, callback, failback){
        var matched = true;
        if(this.memory[table]){
            for(var i=this.memory[table].length;i--;){
                if(typeof input === 'object'){
                    matched = true;
                    for(var prop in input){
                        if(MagnetJS.Utils.isArray(input[prop])){
                            if(input[prop].indexOf(this.memory[table][i][prop]) == -1)
                                matched = false;
                        }else{
                            if(this.memory[table][i][prop] !== input[prop])
                                matched = false;
                        }
                    }
                    if(matched) this.memory[table].splice(i, 1);
                }else{
                    if(this.memory[table][i].id == input){
                        this.memory[table].splice(i, 1);
                    }
                }
            }
            callback();
        }else{
            failback('table-not-exist');
        }
    },
    clearTable : function(table, callback){
        this.memory[table] = [];
        callback();
    },
    createTableIfNotExist : function(table, schema, kvps, clearRecords, callback){
        this.memory[table] = (clearRecords === true ? [] : this.memory[table]) || [];
        if(MagnetJS.Utils.isArray(kvps)){
            for(var i=0;i<kvps.length;++i){
                kvps[i].id = MagnetJS.Utils.getGUID();
                this.memory[table].push(kvps[i]);
            }
        }else if(kvps){
            kvps.id = MagnetJS.Utils.getGUID();
            this.memory[table].push(kvps);
        }
        callback();
    }
};

/**
 * A class for storing a value into persistent storage. Currently relies on HTML5 localStorage.
 * Clients that do not support localStorage will fall back to a memory store that will not persist past a
 * restart of the app.
 * @memberof MagnetJS
 * @namespace Storage
 * @ignore
 */
MagnetJS.Storage = {
    /**
     * @attribute {object} connector The data connector to be used.
     */
    connector : MagnetJS.MemoryStoreConnector,
    /**
     * Create an object.
     * @param {string} table The table in the database.
     * @param {*} kvp An object containing values to set on the object.
     */
    create : function(table, kvp, callback, failback){
        this.connector.create(table, kvp, function(record){
            if(typeof callback === typeof Function)
                callback(record);
        }, function(e){
            if(typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Update values of the object corresponding to the specified ID.
     * @param {string} table The table in the database.
     * @param {*} id The unique identifier of the object to set.
     * @param {*} kvp An object containing values to set on the object.
     */
    update : function(table, id, kvp, callback, failback){
        this.connector.update(table, id, kvp, function(record){
            if(typeof callback === typeof Function)
                callback(record);
        }, function(e){
            if(typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Get an object using an ID or a query. A query is an object of properties, each containing an array of property matches. For example, {"foo":"a1"]}.
     * @param {string} table The table in the database.
     * @param {string|object} input An ID or a query object containing the required matches.
     */
    get : function(table, input, callback, failback){
        this.connector.get(table, input, function(records){
            if(typeof callback === typeof Function)
                callback(records);
        }, function(e){
            if(typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Remove an object using an ID or a query. A query is an object of properties, each containing an array of property matches. For example, {"foo":"a1"]}.
     * @param {string} table The table in the database.
     * @param {*} id The unique identifier of the object to remove.
     */
    remove : function(table, input, callback, failback){
        this.connector.remove(table, input, function(){
            if(typeof callback === typeof Function)
                callback();
        }, function(e){
            if(typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Clear a table.
     * @param {string} table The table in the database.
     */
    clearTable : function(table, callback, failback){
        this.connector.clearTable(table, function(){
            if(typeof callback === typeof Function)
                callback();
        }, function(e){
            if(typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Retrieve or create a keystore, and return it.
     * @param {string} table The table in the database.
     * @param {object} schema An object containing the property types.
     * @param {object|array} [kvps] An array of objects to add to the table, or a single object.
     * @param {boolean} [clearTable] If enabled, the table will be cleared.
     */
    createTableIfNotExist : function(table, schema, kvps, clearTable, callback, failback){
        this.connector.createTableIfNotExist(table, schema, kvps, clearTable, function(){
            if(typeof callback === typeof Function)
                callback();
        }, function(e){
            if(typeof failback === typeof Function)
                failback(e);
        });
    },
    /**
     * Selects the best storage persister available to be used by the platform.
     */
    setupConnector : function(){
        if(MagnetJS.Utils.hasFeature('openDatabase')){
            MagnetJS.SQLConnector.db = window.openDatabase(
                MagnetJS.SQLConnector.dbOptions.name,
                MagnetJS.SQLConnector.dbOptions.version,
                MagnetJS.SQLConnector.dbOptions.display,
                MagnetJS.SQLConnector.dbOptions.size
            );
            MagnetJS.Storage.connector = MagnetJS.SQLConnector;
        }else if(MagnetJS.Utils.hasFeature('localStorage') === true){
            MagnetJS.Storage.connector = MagnetJS.LocalStorageConnector;
        }else{
            MagnetJS.Storage.connector = MagnetJS.MemoryStoreConnector;
        }

    }
};
MagnetJS.Storage.setupConnector();

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
 * @desc Set MagnetJS SDK configuration attributes.
 * @param {object} obj An object containing key-value pairs to be set in the MagnetJS attributes.
 */
MagnetJS.set = function(obj){
    for(var prop in obj){
        if(obj.hasOwnProperty(prop)){
            if(prop == 'endpointUrl' && /^(ftp|http|https):/.test(obj[prop] === false))
                throw('invalid endpointUrl - no protocol');
            MagnetJS.Config[prop] = obj[prop];
        }
    }
    return this;
}

/**
 * @method
 * @desc Reset MagnetJS SDK configuration attributes to their default values.
 */
MagnetJS.reset = function(){
    MagnetJS.set({
        endpointUrl            : '',
        logging                : true
    });
    return this;
}

/**
 * @method
 * @desc Load a model or controller resource into memory. For NodeJS only.
 * @param {string} path A relative path to the entity or controller resource.
 */
MagnetJS.define = function(path){
    var resource = require(path), type = resource.Controllers ? 'Controllers' : 'Models';
    MagnetJS.Utils.mergeObj(MagnetJS[type], resource[type]);
    return this;
}

/**
 * A class designed to assist in creating constraints related to geolocation.
 * @memberof MagnetJS
 * @namespace Geolocation
 */
MagnetJS.Geolocation = {
    /**
     * Converts a Cordova Position object returned from navigator.geolocation APIs into a geo URI based on RFC 5870.
     * @param {Position} position A Cordova Position object.
     * @returns {string} RFC 5870 geo URI.
     */
    positionToRFC5870 : function(position){
        if(typeof position === 'undefined' || position === null || !position.coords) return false;
        return 'geo:'+position.coords.latitude+','+position.coords.longitude+','+(position.coords.altitude ? position.coords.altitude : 0)+',crs=wgs84,u='+(position.coords.accuracy ? Math.round(position.coords.accuracy) : 0);
    },
    /**
     * Determines whether the given MagnetJS.Geoentry is within the polygon defined by the MagnetJS.Geostore.
     * @param {MagnetJS.Geostore} geostore A MagnetJS.Geostore object.
     * @param {MagnetJS.Geoentry} geoentry A MagnetJS.Geoentry object.
     */
    isWithinPolygon : function(geostore, geoentry){
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
    },
    /**
     * Determines whether the given geo point is within the radius of the target geo point.
     * @param {MagnetJS.Geoentry} target A MagnetJS.Geoentry point whose radius will be searched.
     * @param {MagnetJS.Geoentry} point A MagnetJS.Geoentry point that will be tested to determine whether it is in range of the target.
     * @param {integer} radius An integer representing the radius of the point in meters.
     */
    isWithinPointRadius : function(target, point, radius){
        function dist(target, point){
            var toRad = function(x){
                return x * Math.PI / 180;
            };
            var dLat = toRad(point.lat-target.lat);
            var dLon = toRad(point.lng-target.lng);
            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(toRad(target.lat)) * Math.cos(toRad(point.lat)) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return (6378137 * c);
        }
        return radius <= dist(point, target);
    }
};

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
        metadata.contentType = metadata.contentType == 'application/json' ? 'application/json; magnet-type=controller-params' : metadata.contentType;
        if(MagnetJS.Utils.isNode){
            this.initNodeRequest(body, metadata, options, callback, failback);
        }else if(MagnetJS.Utils.isCordova && options.callOptions && options.callOptions.saveAs && !options.callOptions.returnRaw){
            this.cordovaFileTransfer(body, metadata, options, callback, failback);
        }else if(typeof jQuery !== 'undefined' && !MagnetJS.Utils.isBinaryType(metadata.returnType) && !metadata.isBinary){
            this.requestJQuery(body, metadata, options, callback, failback);
        }else if(XMLHttpRequest !== 'undefined'){
            this.requestXHR(body, metadata, options, callback, failback);
        }else{
            throw('request-transport-unavailable');
        }
    },
    /**
     * Transport with JQuery over HTTP/SSL protocol with REST. Cross-origin requests from a web browser are currently not supported.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    requestJQuery : function(body, metadata, options, callback, failback){
        var me = this;
        var reqBody = me.parseBody(metadata.contentType, body);
        $.support.cors = true;
        var details = {
            body : reqBody,
            info : {
                url : metadata._path
            }
        };
        options.call.transportHandle = $.ajax({
            type        : metadata.method,
            url         : metadata._path,
            timeout     : 30000,
            dataType    : metadata.dataType,
            contentType : metadata.contentType,
            data        : reqBody,
            beforeSend  : function(xhr){
                if(metadata.headers){
                    for(var i=metadata.headers.length;i--;){
                        xhr.setRequestHeader(metadata.headers[i].name, metadata.headers[i].val);
                    }
                }
                xhr.setRequestHeader('Accept', me.createAcceptHeader(metadata.dataType));
            },
            success : function(data, status, xhr){
                if(typeof callback === typeof Function){
                    details.info.xhr = MagnetJS.Utils.convertHeaderStrToObj(xhr);
                    details.contentType = xhr.getResponseHeader('Content-Type');
                    details.status = xhr.status;
                    data = data.result || data;
                    callback(data, details);
                }
            },
            error : function(xhr, metadata, error){
                details.info.xhr = MagnetJS.Utils.convertHeaderStrToObj(xhr);
                details.contentType = xhr.getResponseHeader('Content-Type');
                details.status = xhr.status;
                if(metadata == 'parsererror')
                    callback(xhr.responseText, details);
                else if(typeof failback === typeof Function)
                    failback(xhr.responseText, details);
            }
        });
    },
    /**
     * Transport with XMLHttpRequest over HTTP/SSL protocol with REST. Cross-origin requests from a web browser are currently not supported.
     * @param {object|string|number} [body] The body of the request.
     * @param {object} metadata Request metadata.
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    requestXHR : function(body, metadata, options, callback, failback){
        var me = this, resBody;
        var reqBody = me.parseBody(metadata.contentType, body);
        var details = {
            body : reqBody,
            info : {
                url : metadata._path
            }
        };
        options.call.transportHandle = new XMLHttpRequest();
        var xhr = options.call.transportHandle;
        xhr.timeout = 30000;
        if(MagnetJS.Utils.isBinaryType(metadata.returnType)) xhr.overrideMimeType('text/plain; charset=x-user-defined');
        xhr.onreadystatechange = function(){
            if(xhr.readyState == 4){
                details.status = xhr.status;
                details.contentType = xhr.getResponseHeader('Content-Type');
                details.info.xhr = MagnetJS.Utils.convertHeaderStrToObj(xhr);
                resBody = xhr.responseText;
                if(typeof xhr.responseXML !== 'undefined' && xhr.responseXML != null){
                    resBody = xhr.responseXML;
                }else{
                    try{
                        resBody = JSON.parse(resBody);
                        resBody = resBody.result;
                    }catch(e){}
                }
                if(me.isSuccess(xhr.status)){
                    if(MagnetJS.Utils.isBinaryType(metadata.returnType))
                        resBody = {
                            mimeType : details.contentType,
                            val      : resBody
                        };
                    if(typeof callback === typeof Function) callback(resBody, details);
                }else{
                    if(typeof failback === typeof Function) failback(resBody, details);
                }
            }
        };
        xhr.ontimeout = function(){
            details.status = 0;
            details.contentType = xhr.getResponseHeader('Content-Type');
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
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    initNodeRequest : function(body, metadata, options, callback, failback){
        var urlParser = require('url');
        var reqObj = urlParser.parse(metadata._path);
        var headers = MagnetJS.Utils.mergeObj({
            'Content-Type' : metadata.contentType
        }, MagnetJS.Transport.Headers);
        if(metadata.headers)
            for(var i=metadata.headers.length;i--;)
                headers[metadata.headers[i].name] = metadata.headers[i].val;
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
            }, options, callback, failback);
        }else{
            if(typeof failback === typeof Function){
                failback('error-parsing-url', {
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
     * @param {object} options Request options.
     * @param {function} [callback] Executes if the request succeeded.
     * @param {function} [failback] Executes if the request failed.
     */
    requestNode : function(body, metadata, httpRequestmetadata, options, callback, failback){
        var me = this, http = require('http'), https = require('https');
        var reqBody = me.parseBody(metadata.contentType, body);
        options.call.transportHandle = (metadata.protocol == 'https:' ? https : http).request(httpRequestmetadata, function(res){
            var resBody = '';
            var details = {
                body : reqBody,
                info : {
                    metadata : metadata,
                    url      : metadata._path,
                    request  : options.call.transportHandle,
                    response : res
                },
                contentType : res.headers['content-type'],
                status      : res.statusCode
            };
            res.setEncoding(MagnetJS.Utils.isBinaryType(metadata.returnType) ? 'binary' : 'utf8');
            res.on('data', function(chunk){
                resBody += chunk;
            });
            res.on('end', function(){
                try{
                    resBody = JSON.parse(resBody);
                    resBody = resBody.result || resBody;
                }catch(e){}
                if(me.isSuccess(res.statusCode)){
                    if(MagnetJS.Utils.isBinaryType(metadata.returnType))
                        resBody = {
                            mimeType : details.contentType,
                            val      : resBody
                        };
                    if(typeof callback === typeof Function)
                        callback(resBody, details);
                }else{
                    if(typeof failback === typeof Function)
                        failback(resBody, details);
                }
            });
        });
        options.call.transportHandle.on('error', function(e){
            if(typeof failback === typeof Function){
                var details = {
                    body : body,
                    info : {
                        metadata : metadata,
                        url      : metadata._path,
                        request  : options.call.transportHandle
                    },
                    status : 0
                };
                failback(e, details);
            }
        });
        if(body) options.call.transportHandle.write(reqBody, metadata.isBinary === true ? 'binary' : 'utf8');
        options.call.transportHandle.end();
    },
    /**
     * Determines whether the status code is a success or failure.
     * @param {number} code The HTTP request status code.
     */
    isSuccess : function(code){
        return code >= 200 && code <= 299;
    },
    /**
     * Formats the body into the appropriate string type using the specified Content-Type header.
     * @param {object|string|number} type The Content-Type of the request.
     * @param {string} input The original request body.
     */
    parseBody : function(type, input){
        var QS = MagnetJS.Utils.isNode ? require('querystring') : MagnetJS.Utils.objectToFormdata;
        switch(type){
            case 'application/x-www-form-urlencoded' : input = QS.stringify(input); break;
            case 'application/json' : input = JSON.stringify(input); break;
            case 'application/json; magnet-type=controller-params' : input = JSON.stringify(input); break;
        }
        return input;
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
            case 'json' : str = 'application/json; magnet-type=controller-result'; break;
            default     : str = '*/*;q=1.0'; break;
        }
        return str;
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
        MagnetJS.FileManager.getFS(function(fs, filePath){
            options.call.transportHandle = new FileTransfer();
            options.call.transportHandle.download(
                metadata._path,
                filePath+options.callOptions.saveAs,
                function(fileEntry){
                    if(typeof callback === typeof Function) callback(fileEntry, details);
                },
                function(e, sourceUrl, targetUrl, status){
                    details.status = status;
                    if(typeof failback === typeof Function) failback(e, details);
                }, MagnetJS.Config.debugMode, {
                    headers : headers
                }
            );
        }, function(){
            if(typeof failback === typeof Function) failback(MagnetJS.FileManager.status, details);
        });
    }
};
MagnetJS.Transport.Headers = {};


/**
 * @constructor
 * @class Request A request instance that handles the request and response.
 * @param [instance] The object creating the request.
 * @param options The object creating the request.
 * @ignore
 */
MagnetJS.Request = function(instance, options, metadata){
    this.instance = instance;
    this.options = options;
    this.metadata = metadata;
    this.options.callOptions = this.options.callOptions || new MagnetJS.CallOptions();
    this.options.call = this.options.call || new MagnetJS.Call();
    this.options.call.setOptions(this.options.callOptions);
}

/**
 * Send a request.
 * @param {function} [callback] Executes if the request succeeded.
 * @param {function} [failback] Executes if the request failed.
 */
MagnetJS.Request.prototype.send = function(callback, failback){
    var me = this;
    setTimeout(function(){
        me.beforeRequest(callback, failback, function(){
            me.metadata.params.contentType = me.metadata.params.contentType || (me.metadata.params.consumes ? me.metadata.params.consumes[0] : undefined) || 'application/json';
            var requestObj = me.setup(me.metadata.schema || {}, me.metadata.params, me.options.attributes);
            requestObj.params.headers = requestObj.params.headers || [];
            if(MagnetJS.Utils.isCordova && typeof device === typeof {} && device.uuid){
                requestObj.params.headers.push({
                    name : 'X-Magnet-Device-Id',
                    val  : device.uuid
                });
                requestObj.params.headers.push({
                    name : 'User-Agent',
                    val  : device.platform+' '+device.version+' '+device.model+' '+navigator.userAgent
                });
            }
            if(!MagnetJS.Utils.isNode)
                requestObj.params.headers.push({
                    name : 'X-Magnet-Auth-Challenge',
                    val  : 'disabled'
                });
            if(me.options && me.options.callOptions && me.options.callOptions.callId && me.options.callOptions.isReliable){
                requestObj.params.headers.push({
                    name : 'X-Magnet-Correlation-id',
                    val  : me.options.callOptions.callId
                });
                requestObj.params.headers.push({
                    name : 'X-Magnet-Result-Timeout',
                    val  : me.options.callOptions.serverTimeout || 0
                });
            }
            if(requestObj.params.produces && requestObj.params.produces[0] === 'multipart/related')
                requestObj.params.headers.push({
                    name : 'Accept',
                    val  : 'multipart/related'
                });
            if(me.options && me.options.callOptions && me.options.callOptions.headers)
                for(var prop in me.options.callOptions.headers)
                    requestObj.params.headers.push({
                        name : prop,
                        val  : me.options.callOptions.headers[prop]
                    });
            me.options.call.state = MagnetJS.CallState.EXECUTING;
            MagnetJS.Transport.request(requestObj.body, requestObj.params, me.options, function(result, details){
                if(me.metadata.params.controller == 'MMSDKLoginService' && me.metadata.params.name == 'login' && result != 'SUCCESS'){
                    me.options.call.state = MagnetJS.CallState.FAILED;
                    me.onResponseError(callback, failback, result, details);
                }else{
                    me.options.call.state = MagnetJS.CallState.SUCCESS;
                    me.onResponseSuccess(callback, result, details)
                }
            }, function(e, details){
                me.options.call.state = MagnetJS.CallState.FAILED;
                me.onResponseError(callback, failback, e, details);
            });
        });
    }, 1);
}

/**
 * Prepares a request for transport.
 * @param {object} schema A controller method schema object.
 * @param {object} params A request parameter object.
 * @param {object} attributes Controller method attributes, represented as a key-value pair.
 */
MagnetJS.Request.prototype.setup = function(schema, params, attributes){
    var query = '', body = {}, plains = {}, forms = {}, matrix = '', dataParam = false;
    params.dataType = params.dataType || 'json';
    params._path = params.path;
    var multipart = params.contentType == 'multipart/related' ? new MagnetJS.Multipart() : undefined;
    var requestData = formatRequest(attributes, multipart, undefined, schema);
    for(var attr in requestData){
        if(requestData.hasOwnProperty(attr) && schema[attr]){
            if((schema[attr].type == '_data' || schema[attr].type == 'binary') && typeof multipart == 'undefined'){
                dataParam = attr;
            }else{
                switch(schema[attr].style){
                    case 'TEMPLATE' :
                        params._path = setTemplateParam(params._path, attr, requestData[attr]);
                        break;
                    case 'QUERY' :
                        query += setQueryParam(attr, requestData[attr]);
                        break;
                    case 'PLAIN' :
                        if(this.metadata.params.method === 'DELETE' || this.metadata.params.method === 'GET')
                            query += setQueryParam(attr, requestData[attr]);
                        else
                            plains[attr] = requestData[attr];
                        break;
                    case 'HEADER' :
                        params.headers = params.headers || [];
                        params.headers.push({
                            name : attr,
                            val  : requestData[attr]
                        });
                        break;
                    case 'MATRIX' :
                        params._path = setTemplateParam(params._path, attr, setMatrixParam(attr, requestData[attr]));
                        break;
                    case 'FORM' :
                        params.contentType = 'application/x-www-form-urlencoded';
                        if(this.metadata.params.method === 'DELETE' || this.metadata.params.method === 'GET')
                            query += setQueryParam(attr, requestData[attr]);
                        else
                            forms[attr] = requestData[attr];
                        break;
                }
            }
        }
    }
    var attrs = MagnetJS.Utils.getAttributes(plains);
    if(dataParam){
        params.isBinary = true;
        params.contentType = requestData[dataParam].mimeType;
        body = requestData[dataParam].val;
    }else{
        body = MagnetJS.Utils.mergeObj(plains, forms);
    }
    if(typeof multipart != 'undefined')
        body = multipart.close(body);
    params._path = (params.basePathOnly === true ? params._path : '/rest'+params._path)+matrix+query;
    params._path = params._path.indexOf('?') == -1 ? params._path.replace('&', '?') : params._path;
    return {
        body   : body,
        params : params
    };
}

function setTemplateParam(path, attr, val){
    return path.replace('{'+attr+'}', val);
}

function setQueryParam(attr, val){
    return '&'+attr+'='+(typeof val === 'object' ? JSON.stringify(val) : val);
}

function setMatrixParam(attr, val){
    return attr+'='+(typeof val === 'object' ? JSON.stringify(val) : val);
}

/**
 * Handles pre-request operations, especially execution of CallOptions configurations.
 * @param {function} [callback] The success callback.
 * @param {function} [failback] The error callback.
 * @param {function} startRequest A callback function to continue execution of the request.
 */
MagnetJS.Request.prototype.beforeRequest = function(callback, failback, startRequest){
    var me = this, cacheObj = MagnetJS.CallManager.getCacheByHash(this.getCallHash());
    if(cacheObj){
        me.options.call.state = MagnetJS.CallState.SUCCESS;
        me.options.call.result = cacheObj.result;
        me.options.call.details = cacheObj.details;
        me.options.call.isResultFromCache = true;
        if(typeof callback === typeof Function) callback(cacheObj.result, cacheObj.details, true);
    }else{
        var callOptions = this.options.callOptions;
        if(callOptions && MagnetJS.CallManager.isConstraintMet(callOptions.constraint) === false){
            if(callOptions.isReliable === true && MagnetJS.CallManager.isExpired(callOptions.requestAge) === false){
                MagnetJS.CallManager.setRequestObject(me.options.call.callId, me.options, me.metadata);
                me.options.call.state = MagnetJS.CallState.QUEUED;
                if(typeof callback === typeof Function) callback('awaiting-constraint');
            }else{
                me.options.call.state = MagnetJS.CallState.FAILED;
                if(typeof failback === typeof Function) failback('constraint-failure', {
                    constraint : callOptions.constraint,
                    current    : MagnetJS.CallManager.getConnectionState()
                })
            }
        }else{
            if(MagnetJS.Utils.isCordova && MagnetJS.CallManager.getConnectionState() == 'NONE'){
                me.options.call.state = MagnetJS.CallState.FAILED;
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
    if(me.options.callOptions && me.options.callOptions.cacheAge != 0){
        me.options.call.cachedTime = new Date();
        MagnetJS.CallManager.setCacheObject(me.options.call.callId, me.getCallHash(), me.options.callOptions, result, details);
    }
    me.formatResponse(result, details, function(convertedResult){
        me.options.call.result = convertedResult;
        me.options.call.details = details;
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
        this.options.call.resultError = error;
        this.options.call.details = details;
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
 * Returns a cache ID based on a hash of the request parameters and body.
 * @returns {string} A cache ID.
 */
MagnetJS.Request.prototype.getCallHash = function(){
    try{
        return MagnetJS.CallManager.getCallHash(
            this.metadata.params.controller,
            this.metadata.params.name,
            (JSON.stringify(this.options.attributes) || ''));
    }catch(e){
        return false;
    }
}

/**
 * Format server response data into client data objects, and handle binary data.
 * @param {*} body The response body.
 * @param {object} details The response details.
 * @param {function} callback Executes upon completion.
 */
MagnetJS.Request.prototype.formatResponse = function(body, details, callback){
    var params = this.metadata.params;
    var options = this.options.callOptions || {};
    var out = body;
    if(!options.returnRaw && typeof out !== 'undefined'){
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
        }else if(MagnetJS.Utils.isDateType(params.returnType)){
            callback(MagnetJS.Utils.ISO8601ToDate(out));
        }else if(params.returnType == 'bytearray'){
            callback(MagnetJS.Utils.base64ToString(out));
        }else if(typeof body == 'string' && body.indexOf('--BOUNDARY--') != -1){
            callback(multipartToObject(body));
        }else{
            callback(out);
        }
    }else{
        callback(out);
    }
}

/**
 * Convert a JSON object into a MagnetJS Model or Collection, if the data is compatible.
 * @param {*} returnType The return content type specified by the controller metadata.
 * @param {*} body The response body.
 * @param {boolean} [multipart] Indicates whether to enable to skip parsing for multipart/related data.
 * @returns {*} MagnetJS Model or Collection.
 */
MagnetJS.Request.prototype.jsonToModel = function(returnType, body, multipart){
    var modelType = getModelType(returnType);
    if(MagnetJS.Models[modelType] && returnType.indexOf('[]') != -1 && body && MagnetJS.Utils.isArray(body)){
        body = new MagnetJS.Collection(modelType, body);
    }else if(MagnetJS.Models[modelType] && MagnetJS.Utils.isArray(body)){
        for(var i=0;i<body.length;++i)
            body[i] = this.jsonToModel(modelType, body[i]);
    }else if(MagnetJS.Models[modelType] && MagnetJS.Utils.isObject(body) && body['magnet-type']){
        body = new MagnetJS.Models[modelType](body);
        for(var attr in body.attributes)
            if(body.schema[attr])
                body.attributes[attr] = this.jsonToModel(getModelType(body.schema[attr].type), body.attributes[attr]);
    }else if(modelType == 'bytearray'){
        body = MagnetJS.Utils.base64ToString(body);
    }else if(MagnetJS.Utils.isDateType(modelType)){
        body = MagnetJS.Utils.ISO8601ToDate(out);
    }else if(!multipart && typeof body == 'string' && body.indexOf('--BOUNDARY--') != -1){
        var out = multipartToObject(body);
        body = MagnetJS.Utils.isObject(out) ? this.jsonToModel(modelType, out) : out;
    }
    return body;
}

// get type of Model
function getModelType(type){
    return (type.indexOf('[]') != -1) ? type.replace('[]', '') : type;
}

// A simple multipart/related parser.
function multipartToObject(str){
    var boundary = 'BOUNDARY';
    var parts = getParts(str, boundary);
    var json = getJSONContent(parts[0]);
    for(var i=1;i<parts.length;++i)
        getContent(json, parts[i]);
    return json;
}
// returns an array of parts.
function getParts(str, boundary){
    var ary = str.split('--'+boundary);
    ary.shift();
    ary.pop();
    return ary;
}
// get JSON object
function getJSONContent(str){
    var content = str, contentType, contents = str.split('\r\n');
    for(var i=0;i<contents.length;++i){
        if(contents[i].indexOf('Content-Type') != -1){
            contentType = contents[i].replace(/Content-Type[ ]*:/, '').replace(/^\s+|\s+$/g, '');
            content = content.replace(contents[i], '');
            break;
        }
    }
    return contentType == 'application/json' ? MagnetJS.Utils.getValidJSON(content) : content;
}
// returns an object containing the content-type and data.
function getContent(json, str){
    var content = {}, encoding, id;
    content.val = str;
    var contents = str.split('\r\n');
    for(var i=0;i<contents.length;++i){
        if(contents[i].indexOf('Content-Type') != -1){
            content.mimeType = contents[i].replace(/Content-Type[ ]*:/, '').replace(/^\s+|\s+$/g, '');
            content.val = content.val.replace(contents[i], '');
        }
        if(contents[i].indexOf('Content-Transfer-Encoding') != -1){
            encoding = contents[i].replace(/Content-Transfer-Encoding[ ]*:/, '').replace(/^\s+|\s+$/g, '');
            content.val = content.val.replace(contents[i], '');
        }
        if(contents[i].indexOf('Content-Id') != -1){
            id = contents[i].replace(/Content-Id[ ]*:/, '').replace(/^\s+|\s+$/g, '');
            content.val = content.val.replace(contents[i], '');
            break;
        }
    }
    if(encoding == 'base64')
        content.val = MagnetJS.Utils.base64ToString(content.val.replace(/(\r\n|\n|\r)/gm, ''));
    else if(content.mimeType == 'application/json')
        content.val = MagnetJS.Utils.getValidJSON(content.val);
    else if(!MagnetJS.Utils.isNode && (content.mimeType == 'application/xml' || content.mimeType == 'text/xml'))
        content.val = MagnetJS.Utils.getValidXML(content.val);
    else
        content.val = content.val.replace(/^\s+|\s+$/g, '');
    mapToObject(json, id, content);
}
// recursively format the content of a multipart/related part
function mapToObject(json, id, data){
    for(var attr in json){
        if(MagnetJS.Utils.isObject(json[attr]) || MagnetJS.Utils.isArray(json[attr]))
            mapToObject(json[attr], id, data);
        else if(json[attr] == id)
            json[attr] = data;
    }
}
// recursively format request data
function formatRequest(data, multipart, model, schema){
    for(var attr in data){
        if(data.hasOwnProperty(attr) && data[attr]){
            if(typeof schema !== 'undefined' && typeof schema[attr] !== 'undefined')
                schema[attr].type = schema[attr].type.trim();
            if(data[attr].isMagnetModel && data[attr].attributes){
                data[attr] = formatRequest(data[attr].attributes, multipart, data[attr]);
            }else if(MagnetJS.Utils.isArray(data[attr])){
                data[attr] = formatRequest(data[attr], multipart);
            }else if(typeof schema !== 'undefined' && schema[attr] && MagnetJS.Utils.isDateType(schema[attr].type)){
                data[attr] = typeof data[attr] === 'string' ? data[attr] : MagnetJS.Utils.dateToISO8601(data[attr]);
            }else if(typeof schema !== 'undefined' && schema[attr] && schema[attr].type == 'bytearray'){
                data[attr] = MagnetJS.Utils.stringToBase64(data[attr]);
            }else if(multipart && typeof model != 'undefined' && model.schema[attr] && (model.schema[attr].type == '_data' || model.schema[attr].type == 'binary')){
                data[attr] = multipart.add(data[attr].mimeType, data[attr].val);
            }
        }
    }
    return data;
}
// A simple multipart/related writer.
MagnetJS.Multipart = function(){
    this.boundary = 'BOUNDARY';
    this.message = '';
    this.prefix = 'DATA_';
    this.index = 0;
}
MagnetJS.Multipart.prototype.add = function(mime, val){
    var id = this.prefix+String(++this.index);
    this.message += '--'+this.boundary+'\r\n';
    this.message += 'Content-Type: '+mime+'\r\n';
    this.message += 'Content-Transfer-Encoding: base64\r\n';
    this.message += 'Content-Id: '+id+'\r\n\r\n';
    this.message += MagnetJS.Utils.stringToBase64(val)+'\r\n\r\n';
    return id;
}
MagnetJS.Multipart.prototype.close = function(body){
    this.message += '--'+this.boundary+'--';
    this.message = '--'+this.boundary+'\r\n'+'Content-Type: application/json\r\n\r\n'+JSON.stringify(body)+'\r\n\r\n'+this.message;
    return this.message;
}

/**
 * @constructor
 * @memberof MagnetJS
 * @class Model is a client representation of a Mobile App Server Bean. It stores data and performs attribute validations.
 * @param {object} attributes A key-value pair of attributes to be assigned to this Model.
 * @param {boolean} [doValidate] If enabled, validate attributes before set. Disabled by default.
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
 * @param {boolean} [isUpdate] If enabled, do not fail validation on missing required fields. Disabled by default.
 */
MagnetJS.Model.prototype.validate = function(attributes, isUpdate){
    return MagnetJS.Utils.validate(this.schema, attributes, isUpdate);
};

/**
 * Set the Model attributes, and optionally perform validation beforehand.
 * @param {object} attributes The attributes to set.
 * @param {boolean} [doValidate] If enabled, validate the attributes before setting. Disabled by default.
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
 * Clear all Models from the Collection.
 */
MagnetJS.Collection.prototype.clear = function(){
    this.models = [];
};

/**
 * Retrieve an array of Model objects with attribute matching the specified query.
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
 * @param {CallOptions} [options.callOptions] Call options.
 * @param {function} [options.success] Callback to fire after a successful request.
 * @param {function} [options.error] Callback to fire after a failed request.
 * @returns {MagnetJS.Promise} A Promise instance.
 */
MagnetJS.Method = function(data, options, metadata){
    var me = this;
    options = options || {};
    options.attributes = (typeof data === 'undefined' || data === null) ? undefined : data;
    options.attributes = MagnetJS.Utils.mergeObj(options.attributes, metadata.attributes);
    var invalid = MagnetJS.Utils.validate(metadata.schema, options.attributes);
    var deferred = new MagnetJS.Deferred();
    deferred.promise = new MagnetJS.Call();
    options.call = deferred.promise;
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
 * @param {*} error The error response body, or an error message.
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
 * @param {MagnetJS.CallOptions} [options.callOptions] Call options.
 * @param {ControllerSuccess} [options.success] Success callback. See Type for return values.
 * @param {ControllerError} [options.error] Error callback. See Type for return values.
 * @returns {MagnetJS.Promise} A Promise instance.
 */
MagnetJS.LoginService.login = function(data, options){
    return MagnetJS.Method.call(this, data, options, {
        params : {
            name        : 'login',
            path        : '/login',
            method      : 'POST',
            dataType    : 'html',
            contentType : 'application/x-www-form-urlencoded',
            returnType  : 'string'
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
 * Logout from the Magnet Mobile App Server. Subsequent requests to APIs requiring authentication will
 * fail with 401 HTTP status code (Unauthorized).
 * @memberof MagnetJS.LoginService
 * @param {object} options Request options.
 * @param {MagnetJS.CallOptions} [options.callOptions] Call options.
 * @param {ControllerSuccess} [options.success] Success callback. See Type for return values.
 * @param {ControllerError} [options.error] Error callback. See Type for return values.
 * @returns {MagnetJS.Promise} A Promise instance.
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
 * Log in to the Magnet Mobile App Server using the stored login credentials. If the credentials are missing, the error callback
 * will be fired with a response of "invalid-credentials".
 * @memberof MagnetJS.LoginService
 * @param {object} options Request options.
 * @param {MagnetJS.CallOptions} [options.callOptions] Call options.
 * @param {ControllerSuccess} [options.success] Success callback. See Type for return values.
 * @param {ControllerError} [options.error] Error callback. See Type for return values.
 */
MagnetJS.LoginService.loginWithSavedCredentials = function(options){
    var me = this;
    MagnetJS.Storage.get(me.store, null, function(records){
        var credentials = (records && records.length > 0) ? MagnetJS.Utils.getValidJSON(MagnetJS.Utils.base64ToString(records[0].hash)) : {};
        if(credentials.name && credentials.password && credentials.endpointUrl && credentials.authority){
            MagnetJS.set({
                endpointUrl : credentials.endpointUrl
            });
            delete credentials.endpointUrl;
            me.login(credentials, {
                success : options.success,
                error   : options.error
            });
        }else{
            if(typeof options.error === typeof Function) options.error('invalid-credentials');
        }
    }, options.error);
}

MagnetJS.LoginService.on('MMSDKComplete', function(methodName, result, details){
    if(methodName == 'login' && result == 'SUCCESS'){
        MagnetJS.LoginService.connectionStatus = 'Authorized';
        MagnetJS.LoginService.invoke(['Authorized'], result, details);
        if(MagnetJS.Utils.isMobile && MagnetJS.Config.storeCredentials === true){
            var body = JSON.parse('{"'+decodeURI(details.body).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
            MagnetJS.Storage.createTableIfNotExist(this.store, {
                hash : 'TEXT'
            }, {
                hash : MagnetJS.Utils.stringToBase64(JSON.stringify(MagnetJS.Utils.mergeObj({
                endpointUrl : MagnetJS.Config.endpointUrl
            }, body)))}, true);
        }
        if(MagnetJS.Utils.isNode && details.info.response.headers['set-cookie'])
            MagnetJS.Transport.Headers.Cookie = details.info.response.headers['set-cookie'][0];
    }else if(methodName == 'logout'){
        MagnetJS.LoginService.connectionStatus = 'NoAuthorization';
        MagnetJS.LoginService.invoke(['NoAuthorization'], result, details);
        if(MagnetJS.Utils.isMobile) MagnetJS.Storage.clearTable(this.store);
        if(MagnetJS.Utils.isNode) delete MagnetJS.Transport.Headers.Cookie;
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
 * Catches errors due to an OAuthLoginException, and displays an OAuth dialog prompting the user to enter their credentials.
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
 * @property {MagnetJS.Controller} instance The controller instance that resulted in the OAuthLoginException.
 * @property {object} options The request options.
 */
/**
 * This event is fired when an OAuth flow has completed.
 * @event MagnetJS.OAuthHandler#OAuthFlowComplete
 * @type {object}
 * @property {MagnetJS.Controller} instance The controller instance that resulted in the OAuthLoginException.
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
    queueTableName   : 'MMSDKReliableQueues',
    defaultQueueName : 'MMSDKDefault',
    queues           : {},
    cache            : {}
};
// retrieve reliable callOptions and store to memory
function storeCache(){
    MagnetJS.Storage.get(MagnetJS.CallManager.queueTableName, null, function(records){
        for(var i=0;i<records.length;++i){
            MagnetJS.CallManager.queues[records[i].queueName] = MagnetJS.CallManager.queues[records[i].queueName] || [];
            MagnetJS.CallManager.queues[records[i].queueName].push({
                id          : records[i].id,
                callId      : records[i].callId,
                callOptions : MagnetJS.Utils.getValidJSON(records[i].callOptions),
                options     : MagnetJS.Utils.getValidJSON(records[i].options),
                metadata    : MagnetJS.Utils.getValidJSON(records[i].metadata),
                queueName   : records[i].queueName
            });
        }
    });
}
// create a callOptions store if it does not already exist.
MagnetJS.Storage.createTableIfNotExist(MagnetJS.CallManager.queueTableName, {
    callId      : 'TEXT',
    callOptions : 'TEXT',
    options     : 'TEXT',
    metadata    : 'TEXT',
    queueName   : 'TEXT'
}, null, false, storeCache);
/**
 * Clear all cached results.
 * @param {string} [callId] Optionally specify a call ID to remove.
 */
MagnetJS.CallManager.clearCache = function(callId){
    if(callId && this.cache[callId]) delete this.cache[callId];
    else this.cache = {};
};
/**
 * Cancel all pending reliable calls.
 * @param {string} [queueName] The queue name.
 * @param {function} [callback] Fires upon completion.
 */
MagnetJS.CallManager.cancelAllPendingCalls = function(queueName, callback){
    if(queueName && this.queues[queueName]){
        delete this.queues[queueName];
        MagnetJS.Storage.remove(this.queueTableName, {
            queueName : queueName
        }, callback);
    }else{
        this.queues = {};
        MagnetJS.Storage.clearTable(this.queueTableName, callback);
    }
};
/**
 * Shortcut for calling cancelAllPendingCalls and clearCache.
 * @param {function} [callback] Fires upon completion.
 */
MagnetJS.CallManager.reset = function(callback){
    this.clearCache();
    this.cancelAllPendingCalls(undefined, callback);
};
/**
 * Triggers all non-empty thread queues to be awaken (if asleep) to re-attempt processing.
 * @param {function} [callback] Fires upon completion.
 */
MagnetJS.CallManager.run = function(callback){
    var me = this, ctr = 0, deletedIds = [];
    function done(){
        if(deletedIds.length > 0)
            MagnetJS.Storage.remove(me.queueTableName, {
                id : deletedIds
            }, callback);
    }
    if(MagnetJS.Utils.isEmptyObject(me.queues)){
        done();
    }else{
        for(var queue in me.queues){
            if(me.queues.hasOwnProperty(queue)){
                ++ctr;
                me.runQueue(queue, [], function(ids){
                    setTimeout(function(){
                        deletedIds = deletedIds.concat(ids);
                        if(--ctr == 0) done();
                    }, 1);
                });
            }
        }
    }
};
/**
 * Removes a call from the ReliableCallOptions queue.
 * @param {string} callId The ID of the call to remove.
 * @param {function} [callback] Fires upon completion.
 */
MagnetJS.CallManager.removeCallFromQueue = function(callId, callback){
    for(var queue in this.queues){
        if(this.queues.hasOwnProperty(queue)){
            for(var i=0;i<this.queues[queue].length;++i)
                if(this.queues[queue][i].callId === callId){
                    this.queues[queue].splice(i, 1);
                    break;
                }
        }
    }
    callback();
};
/**
 * Dispose all reliable calls having SUCCESS or FAILED state.
 * @param {function} [clearCache] Enable removal of the calls from the cache.
 * @param {function} [callback] Fires upon success.
 * @param {function} [failback] Fires upon failure.
 */
MagnetJS.CallManager.disposeAllDoneCalls = function(clearCache, callback, failback){
    var ids = [];
    for(var callId in this.cache)
        ids.push(callId);
    MagnetJS.CallManager.requestCorrelationCleanup(ids, function(data, details){
        if(clearCache === true) MagnetJS.CallManager.clearCache();
        callback(data, details);
    }, failback);
};
/**
 * Retrieve a Call instance by its unique ID. It is for reliable calls only. May return null if the ID is invalid, the call is timed out, or the asynchronous call was done,
 * which is defined as its cached result becomes obsoleted or overwritten by another invocation.
 * @param {string} callId The call ID to remove.
 * @returns {object} The Call instance to be retrieved.
 */
MagnetJS.CallManager.getCall = function(callId){
    var call;
    for(var queue in this.queues){
        if(this.queues.hasOwnProperty(queue)){
            for(var i=0;i<this.queues[queue].length;++i)
                if(this.queues[queue][i].callId === callId){
                    call = this.queues[queue][i].options.call;
                    break;
                }
        }
    }
    return call;
};
/**
 * Iterates through an array of reliable call requests, and performs each request in FIFO synchronously until the array is empty or a constraint is not met.
 * @param {string} [queueName] The queue name, if applicable.
 * @param {array} [ids] An array of call option IDs that have been completed.
 * @param {function} done Executes after the queue is drained or a constraint is not met.
 */
MagnetJS.CallManager.runQueue = function(queueName, ids, done){
    var me = this;
    var store = me.queues[queueName];
    if(MagnetJS.Utils.isArray(store) && store.length > 0){
        if(me.isExpired(store[0].callOptions.requestAge) === true){
            ids.push(store[0].id);
            store.shift();
            me.runQueue(queueName, ids, done);
        }else if(me.isConstraintMet(store[0].callOptions.constraint)){
            var req = new MagnetJS.Request(undefined, store[0].options, store[0].metadata);
            req.send(function(result, details){
                MagnetJS.ReliableCallListener.invoke(['onSuccess', store[0].callOptions.success], store[0].metadata.params, result, details);
                ids.push(store[0].id);
                store.shift();
                me.runQueue(queueName, ids, done);
            }, function(e, details){
                MagnetJS.ReliableCallListener.invoke(['onError', store[0].callOptions.error], store[0].metadata.params, e, details);
                ids.push(store[0].id);
                store.shift();
                me.runQueue(queueName, ids, done);
            });
        }else{
            me.queues[queueName] = store;
            done(ids);
        }
    }else{
        delete me.queues[queueName];
        done(ids);
    }
};
/**
 * Cache the given request object.
 * @param {string} callId A unique identifier for this request.
 * @param {object} options The request options to cache.
 * @param {object} metadata The request metadata to cache.
 * @param {function} [callback] Executes after the request object is set.
 */
MagnetJS.CallManager.setRequestObject = function(callId, options, metadata, callback){
    var queueName = (options.callOptions.queueName && options.callOptions.queueName != '') ? options.callOptions.queueName : this.defaultQueueName;
    var store = this.queues[queueName];
    store = store || [];
    store.push({
        callId      : callId,
        callOptions : options.callOptions,
        options     : options,
        metadata    : metadata,
        queueName   : queueName
    });
    var callObj = {
        callId      : store[store.length-1].callId,
        callOptions : JSON.stringify(store[store.length-1].callOptions),
        options     : JSON.stringify(store[store.length-1].options),
        metadata    : JSON.stringify(store[store.length-1].metadata),
        queueName   : store[store.length-1].queueName
    };
    delete callObj.options.callOptions;
    this.queues[queueName] = store;
    MagnetJS.Storage.create(this.queueTableName, callObj, callback);
};
/**
 * Set the cached value of the specified call ID.
 * @param {string} callId A unique identifier for this request.
 * @param {string} callHash A hash created using the request parameters and body.
 * @param {CallOptions} callOptions The CallOptions object instance.
 * @param {*} result The result data to cache.
 * @param {object} details The details object to cache.
 */
MagnetJS.CallManager.setCacheObject = function(callId, callHash, callOptions, result, details){
    this.cache[callId] = {
        callOptions : callOptions,
        callHash    : callHash,
        result      : result,
        details     : details || {}
    };
};
/**
 * Retrieve the cached value of the specified call ID if the cached value exists and has not expired.
 * @param {string} callHash A hashed string to match with a cached call.
 * @returns {object} The cached value, or undefined if the cached value has expired or is not available.
 */
MagnetJS.CallManager.getCacheByHash = function(callHash){
    var cache;
    for(var callId in this.cache){
        if(this.cache[callId].callHash === callHash){
            if(this.isExpired(this.cache[callId].callOptions.cacheAge)
                && (this.cache[callId].callOptions.ignoreAgeIfOffline === false
                || this.getConnectionState() != 'NONE'))
                delete this.cache[callId];
            cache = this.cache[callId];
        }
    }
    return cache;
};
/**
 * Generate a call hash given arbitrary string arguments. Uses the CryptoJS MD5 library to generate a hash, or falls back to encodeURIComponent.
 * @param {string} An arbitrary number of string arguments to convert into a hash.
 * @returns {string} A call hash.
 */
MagnetJS.CallManager.getCallHash = function(){
    var args = [].slice.call(arguments).join('|');
    return CryptoJS ? CryptoJS.MD5(args).toString() : encodeURIComponent(args);
};
/**
 * Get the current time in seconds.
 * @returns {number} The current time in seconds.
 */
MagnetJS.CallManager.getTimeInSeconds = function(){
    return Math.round(new Date().getTime() / 1000);
};
/**
 * Determines whether the given age is expired.
 * @returns {boolean} true if the given age is expired, false otherwise.
 */
MagnetJS.CallManager.isExpired = function(age){
    return this.getTimeInSeconds() >= age;
};
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
};
/**
 * Determines whether the specified constraint is met.
 * @param {array} constraint The constraint requirement object.
 * @returns {boolean} True if the constraint is met, false otherwise.
 */
MagnetJS.CallManager.isConstraintMet = function(constraint){
    if(constraint && MagnetJS.Utils.isArray(constraint)){
        var networkTypes = [], validGeo = true, validCustom = true, networkState = this.getConnectionState(), geo = MagnetJS.Geolocation.current;
        for(var i=0;i<constraint.length;++i){
            if(typeof constraint[i] == 'string')
                networkTypes.push(constraint[i]);
            else if(typeof constraint[i] === typeof Function)
                validCustom = constraint[i]();
        }
        return ((networkTypes.length > 0 ? networkTypes.indexOf(networkState) != -1 : true) && validGeo === true && validCustom === true);
    }else{
        return true;
    }
};
/**
 * Returns the current network connection state through the javascript-native bridge.
 */
MagnetJS.CallManager.getConnectionState = function(){
    var state = 'WIFI';
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
};
/**
 * Dispose of completed call IDs on the server.
 *
 */
MagnetJS.CallManager.requestCorrelationCleanup = function(ids, callback, failback){
    MagnetJS.Transport.request(null, {
        method : 'GET',
        path   : '/_magnet_cc?ids='+(typeof ids === 'string' ? ids : ids.join(','))
    }, {
        call : new MagnetJS.Call()
    }, callback, failback);
};

/**
 * This interface represents an asynchronous invocation to a controller. An instance of the Call is typically returned by a method call from any Controller
 * implementation. If the options are not specified in the Controller subclass method call, a fail-fast asynchronous call will be assumed.
 * @augments MagnetJS.Promise
 * @constructor
 * @memberof MagnetJS
 */
MagnetJS.Call = function(){
    /**
     * A system generated unique ID for this call.
     * @type {string}
     */
    this.callId;
    /**
     * A custom opaque token provided by the caller.
     * @type {string}
     */
    this.token;
    /**
     * The last cached time of the result. It is available only if the call has completed.
     * @type {Date}
     */
    this.cachedTime;
    /**
     * Indicates whether the result was retrieved from the cache.
     * @type {boolean}
     */
    this.isResultFromCache;
    /**
     * The result returned by the call. This property is undefined if the call failed.
     * @type {*}
     */
    this.result;
    /**
     * The error, if any, that occurred during execution of the call. An undefined error value indicates that the call completed successfully.
     * @type {*}
     */
    this.resultError;
    /**
     * An object containing details of the request.
     * @type {object}
     */
    this.details;
    this.state = MagnetJS.CallState.INIT;
    MagnetJS.Promise.apply(this, arguments);
};
MagnetJS.Call.prototype = new MagnetJS.Promise();
MagnetJS.Call.prototype.constructor = MagnetJS.Call;
/**
 * Set parameters on the Call using the specified CallOptions object.
 * @param {MagnetJS.CallOptions} callOptions A CallOptions object.
 */
MagnetJS.Call.prototype.setOptions = function(callOptions){
    this.token = callOptions.token;
    this.callId = callOptions.callId;
    this.isReliable = callOptions.isReliable;
};
/**
 * Cancel a queued or executing call. If the call has been disposed, completed, cancelled, or unable to cancel, it will return false. Upon successful completion, this
 * call object will be disposed too.
 * @param {function} [callback] Fires after completion.
 */
MagnetJS.Call.prototype.cancel = function(callback){
    if(this.state != MagnetJS.CallState.SUCCESS && this.state != MagnetJS.CallState.FAILED){
        if(this.transportHandle) this.transportHandle.abort();
        this.state = MagnetJS.CallState.CANCELLED;
        MagnetJS.CallManager.removeCallFromQueue(this.callId, function(){
            if(typeof callback == typeof Function) callback(true);
        });
    }else{
        if(typeof callback == typeof Function) callback(false);
    }
};
/**
 * Dispose this Call, optionally clearing its result from cache. The call must be in SUCCESS or FAILED state. All resources used by this Call will be released. To dispose a
 * queued or executing call, it must be cancelled first.
 * @param {function} [clearCache] Enable removing the call from the cache.
 * @param {function} [callback] Fires upon success.
 * @param {function} [failback] Fires upon failure.
 */
MagnetJS.Call.prototype.dispose = function(clearCache, callback, failback){
    var callId = this.callId;
    if(callId && (this.state === MagnetJS.CallState.FAILED || this.state === MagnetJS.CallState.SUCCESS)){
        MagnetJS.CallManager.requestCorrelationCleanup(callId, function(data, details){
            if(clearCache == true) MagnetJS.CallManager.clearCache(callId);
            callback(data, details);
        }, failback);
    }else{
        if(typeof failback === typeof Function) failback('invalid-call-state');
    }
};
/**
 * A set of constants used by a MagnetJS.Call object to determine the current state of the call.
 * @memberof MagnetJS
 * @namespace CallState
 */
MagnetJS.CallState = {
    /**
     * The call has been initialized but the request has not yet started.
     * @type {string}
     */
    INIT       : 'init',
    /**
     * The call is in progress.
     * @type {string}
     */
    EXECUTING  : 'executing',
    /**
     * The call is in a reliable queue.
     * @type {string}
     */
    QUEUED     : 'queued',
    /**
     * The call has been cancelled.
     * @type {string}
     */
    CANCELLED  : 'cancelled',
    /**
     * The call has completed successfully.
     * @type {string}
     */
    SUCCESS    : 'success',
    /**
     * The call has failed.
     * @type {string}
     */
    FAILED     : 'failed'
}
/**
 * A reliable call listener that dispatches success and error events provided by a ReliableCallOptions object. To execute a callback
 * of name "reliableSuccess" after a ReliableCallOptions request, bind an event to the ReliableCallListener: MagnetJS.ReliableCallListener.on('reliableSuccess', function(){});
 * To unbind an event, invoke MagnetJS.ReliableCallListener.unbind('reliableSuccess');
 * @memberof MagnetJS
 * @namespace ReliableCallListener
 */
MagnetJS.ReliableCallListener = {
    /**
     * Bind a callback function associated with the specified callback ID to fire when it is invoked after a ReliableCallOptions request.
     * @param callbackId The callback ID.
     * @param callback A callback function.
     */
    on     : function(callbackId, callback){},
    /**
     * Unbind the callback functions associated with the specified callback ID.
     * @param callbackId The callback ID.
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
     * Invoke the call only if this constraint is met. This means asynchronous (non-reliable) calls will fail fast. Reliable calls will wait.
     * @property {string}
     */
    this.callId = MagnetJS.Utils.getGUID();
    /**
     * Invoke the call only if this constraint is met. This means asynchronous (non-reliable) calls will fail fast. Reliable calls will wait.
     * @property {string}
     */
    this.constraint;
    /**
     * Optional. A user can set a custom opaque token for this call.
     * @type {string}
     */
    this.token;
    /**
     * The epoch time in seconds when the cached value will expire. Specify 0 to discard the cache, or a value greater than 0 to use the cache if the age is still valid. This value can be set by specifying a timeout with CallOptions.setCacheTimeout().
     * @type {number}
     */
    this.cacheAge = 0;
    /**
     * An object containing the HTTP header name and value pairs to send in the request. For example, the Content-Type header can be set like this: var opts = new MagnetJS.CallOptions({headers:{"Content-Type":"application/json"}});
     * @type {boolean}
     */
    this.headers = undefined;
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
 * Specify the length of time (seconds) before the cached value expires. If this option is specified, the call will attempt to use the cached value, and the response will always be cached. If not specified, the cached value will be discarded and the response will not be cached.
 * @param {number} [timeout] The number of seconds until the cache expires. Specify 0 to discard the cache, or a value greater than 0 to use the cache if the age is still valid.
 * @param {boolean} [ignoreAgeIfOffline] Indicates whether to use the cached value in an offline mode despite its age. The default is false.
 */
MagnetJS.CallOptions.prototype.setCacheTimeout = function(timeout, ignoreAgeIfOffline){
    this.cacheAge = timeout ? MagnetJS.CallManager.getTimeInSeconds() + timeout : 0;
    this.ignoreAgeIfOffline = ignoreAgeIfOffline;
}
/**
 * Set an HTTP header to be used by this CallOptions object.
 * @param {string} name The name of the HTTP header.
 * @param {string} value The value of the HTTP header.
 */
MagnetJS.CallOptions.prototype.addTag = function(name, value){
    this.headers = this.headers || {};
    this.headers[name] = value;
}
/**
 * Set one or more HTTP headers to be used by this CallOptions object.
 * @param {object} tags An object containing key-value pairs of HTTP headers to add to the CallOptions object.
 */
MagnetJS.CallOptions.prototype.addTags = function(tags){
    this.headers = this.headers || {};
    MagnetJS.Utils.mergeObj(this.headers, tags);
}

/**
 * Options for an asynchronous call. An asynchronous call allows the caller to use the cached value and impose a restriction on when the call can be invoked. These types of options are only applicable when the user is online and connected to the server. If you would like to submit operations while offline or need more reliable, long-lasting durable operations, use ReliableCallOptions instead. If no options are specified, an asynchronous (unreliable) call is assumed.
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
 * Options for a reliable asynchronous call. A reliable asynchronous call allows the caller to:
 <ul>
   <li>use the cached value</li>
   <li>queue a call in persistent storage even if the caller is offline at submission time</li>
   <li>execute the calls in a sequential manner</li>
   <li>impose a restriction on when the call can be invoked</li>
   <li>specify a timeout for the call</li>
 </ul>
 * @augments MagnetJS.CallOptions
 * @constructor
 */
MagnetJS.ReliableCallOptions = function(){
    /**
     * Place a call on the specified queue.  The pending calls on the queue will be invoked sequentially. When using concurrent invocation, place the calls on multiple reliable queues.
     * @type {string}
     */
    this.queueName;
    /**
     * The time, in milliseconds, the server should retain to the result (the greater of the request and response timeouts).
     * @type {number}
     */
    this.serverTimeout = 0;
    /**
     * The epoch time, in seconds, until the request will expire. This value can be easily set  by specifying a timeout using ReliableCallOptions.setRequestTimeout().
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
    MagnetJS.CallOptions.apply(this, arguments);
};
MagnetJS.ReliableCallOptions.prototype = new MagnetJS.CallOptions();
MagnetJS.ReliableCallOptions.prototype.constructor = MagnetJS.ReliableCallOptions;

/**
 * Specify the time, in seconds, until the request expires.
 * @param {number} timeout The number of seconds before the request expires. Specify 0 to discard the request; specify a value greater than 0 to use the request if the age is still valid.
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
     * The device must have a Wifi connection available to satisfy this constraint.
     */
    Wifi : ['WIFI'],
    /**
     * The device must have a cellular connection available to satisfy this constraint.
     */
    WWAN : ['CELL'],
    /**
     * Create a custom constraint. A user-defined function can be bound to this constraint to provide custom
     * validation of whether a constraint is met. Optionally, network constraints can be specified to further
     * refine the constraint.
     * @param {string} name The name of the constraint to be created.
     * @param {array} [definitions] An array of constraints. For example, ['WIFI', 'CELL'] would specify that the
     * constraint will be met if the device is on a Wifi or cellular network connection. A MagnetJS.Geostore
     * object can be passed in the array. If the constraint contains a Geostore, the controller call will only execute
     * if the current geolocation of the device is within the boundaries of the Geostore object.
     */
    createConstraint : function(name, definitions){
        this[name] = definitions;
    }
};

/**
 * A class designed to simplify storage of binary data from controller requests to the file system in a Phonegap app.
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
     * @property {string} filePath File system path to the Documents directory, since it is a different path for each file system.
     */
    filePath   : null,
    /**
     * @property {string|object} status Status of the file system retrieval.
     */
    status     : false,
    /**
     * @property {string} tempFile A file name. The file will be created temporarily to obtain the file system path.
     */
    tempFile   : '_magnet_temp.txt',
    /**
     * Request an instance of a Phonegap LocalFileSystem object. Updates these FileManager properties after completion: fileSystem, filePath, and status.
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
                    me.filePath = fileEntry.toURL ? fileEntry.toURL().replace(me.tempFile, '') : fileEntry.fullPath.replace(me.tempFile, '');
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
     * Save a file to the file system, and return a fileEntry object upon completion.
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

/*!
 *  window.btoa/window.atob shim
 */
(function(){function t(t){this.message=t}var e="undefined"!=typeof exports?exports:this,r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";t.prototype=Error(),t.prototype.name="InvalidCharacterError",e.btoa||(e.btoa=function(e){for(var o,n,a=0,i=r,c="";e.charAt(0|a)||(i="=",a%1);c+=i.charAt(63&o>>8-8*(a%1))){if(n=e.charCodeAt(a+=.75),n>255)throw new t("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");o=o<<8|n}return c}),e.atob||(e.atob=function(e){if(e=e.replace(/=+$/,""),1==e.length%4)throw new t("'atob' failed: The string to be decoded is not correctly encoded.");for(var o,n,a=0,i=0,c="";n=e.charAt(i++);~n&&(o=a%4?64*o+n:n,a++%4)?c+=String.fromCharCode(255&o>>(6&-2*a)):0)n=r.indexOf(n);return c})})();

})(typeof exports === 'undefined' ? this['MagnetJS'] || (this['MagnetJS']={}) : exports);