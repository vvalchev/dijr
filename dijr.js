/* USAGE
 *
 * var json_client = dijr(url)
 *
 * Where 'url' is the URL of the JSON-RPC server.
 *
 * To a remote method use:
 * json_client.<remote_method>([params]);
 *
 * Please note, that if the name of the remote method contains special symbols like / or dot
 * that special symbol will be transliterated to underscore (_) and the name of the method will
 * be changed. As example if listed method is: 'BOOKS/list'
 * You may call it using: json_client.BOOKS_list();
 *
 * For usage: https://github.com/vvalchev/dijr
 */

// if you are running with jQuery < 1.4.2 then you will not have the parseJSON function.
// so this piece of code is added for compatibility with older versions of jQuery
if ( typeof $.parseJSON != 'function') {
	$.parseJSON = function(data) {
		var rvalidchars = /^[\],:{}\s]*$/;
		var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
		var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
		var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
		if ( typeof data !== 'string' || !data ) {
			return null;
		}

		// Make sure leading/trailing whitespace is removed (IE can't handle it)
		data = $.trim( data );

		// Attempt to parse using the native JSON parser first
		if ( window.JSON && window.JSON.parse ) {
			return window.JSON.parse( data );
		}

		// Make sure the incoming data is actual JSON
		// Logic borrowed from http://json.org/json2.js
		if ( rvalidchars.test( data.replace( rvalidescape, '@' )
			.replace( rvalidtokens, ']' )
			.replace( rvalidbraces, '')) ) {
			return ( new Function( 'return ' + data ) )();
		}
		throw new Error( "Invalid JSON: " + data );
	}
}
// begin the real dijr code
dijr = function(_url, _ajaxOptions) {
	// Create an object that can be used to make JSON RPC calls.
	return new (function(_url, _ajaxOptions) {
		var seq = 1;
		// Self reference variable to be used all over the place
		var self = this;

		// Use the given ajax options (if any), override them with sane defaults
		var ajaxOptions = $.extend(_ajaxOptions, {
			async      : false, // by default use sync calls - to preserve compatibility with jQuery.JR
			contentType: 'application/json; charset=utf-8',
			type       : 'POST',
			dataType   : 'json',
			processData: false,
			cache      : false,
			url        : _url
		});

		_log('using ajax options', ajaxOptions);

		// helper function
		function _call(method, params, callback) {
			return _call2({ 'jsonrpc': '2.0', 'id': ++seq, 'method' : method, 'params' : params }, callback);
		}

		function _call2(request, callback) {
			var ret = null;
			// Extend the default ajax options and add the JSON-RPC formatted call
			// This also will enable callback. A result will be return only for 'synch: true' calls
			var fn = $.isFunction(callback) ? true : false;
			var opts = $.extend(ajaxOptions, {
				async   : fn,
				data    : JSON.stringify(request),
				success : function(data, textStatus, jqXHR) {
					ret = data;
					_log('received success', ret, status, jqXHR);
					if (fn) callback(ret, jqXHR)
				},
				error   : function(jqXHR, textStatus, throwable) {
					ret = $.parseJSON(jqXHR.responseText);
					_log('received error', ret, jqXHR);
					if (fn) callback(ret, jqXHR)
				}
			});
			_log('calling...', opts);
			$.ajax(opts);
			return ret;
		}

		function _attach(method) {
			_log('attaching method', method);
			self[method.replace(/\W/g,'_')] = function() {
				var args = _args(arguments, 0);
				return _call(method, args.p, args.c);
			}
		}

		function _log() {
			if (typeof console != 'undefined' && typeof console.log == 'function') console.log('jquery.dijr.js:', arguments);
		}

		function _args(a, start) {
			var p = [];
			var c = null;
			for(var i = start; i < a.length; i++) {
				var x = a[i];
				if ($.isFunction(x)) c = x; else p.push(x);
			}
			return {'p':p, 'c':c };
		}

		// public methods
		/**
		 * Calls a single remote method.
		 *
		 * @param {string} method the remote method to call
		 * @param {object} various number of parameters to the function you call, it could be
		 *   even a JSON object. In that case it will be mapped to a Java bean or Map.
		 * @param {function} callback(data, jqXHR) function. The first parameter will be the
		 *   JSON-RPC response, and the second one will give direct access to jqXHR object
		 * @return JSON-RPC response if the request is synchronous, or null
		 */
		this.call = function(method /* [, param1][, paramN][, callback]*/) {
			var args = _args(arguments, 1);
			return _call(method, args.p, args.c);
		}

		/**
		 * Calls multiple methods at once.
		 *
		 * @param {object} mobj - the format is :
		 *   {
		 *     method1: [params],
		 *     method2: null // or [] for no params
		 *   }
		 * @param {function} callback(data, jqXHR) function. The first parameter will be the
		 *   JSON-RPC response, and the second one will give direct access to jqXHR object
		 * @return JSON-RPC response if the request is synchronous, or null
		 */
		this.multicall = function(mobj, callback) {
			var req = [];
			for( var i in mobj ) {
				var method = i;
				var params = mobj[i];
				req.push({ 'jsonrpc': '2.0', 'id': ++seq, 'method' : method, 'params' : params });
			}
			return _call2(req, callback);
		}

		// init json methods - always call this in 'async: false' mode
		var data = _call('system.listMethods');
		if (data && data.result) for (var i in data.result) _attach(data.result[i]);
	})(_url, _ajaxOptions);
}
