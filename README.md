# Do It! JSON-RPC

This is the probably the most complete and advanced (i’m modest;) JavaScript JSON-RCP 2.0 client.

It is called ‘Do It! JSON-RPC’ or ‘dijr’ in short. And here is some usage information:

## Setting up

To use dijr you need two additional libraries:

*   jQuery
*   JSON2.js

Basically to enable dijr for your web application you should add something like that in the section:

```javascript
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js"></script>
<script type="text/javascript" src="https://raw.github.com/douglascrockford/JSON-js/master/json2.js"></script>
<script type="text/javascript" src="dijr.js"></script>
```

## Initialization

When the page is loaded you should initialize dijr. The best way to do that is on page load, so in JavaScript code it would look like:

```javascript
var remote = false; // this is dijr, not initialized yet
$(function() {
  remote = dijr('/remote/json-rpc');
});
```

The code above will initialize dijr on page load, and will create an object that will use `/remote/json-rpc` as url to the JSON-RPC server.

## Calling remote method

Calling a remote method is simple but yet powerful. The remote call can be asynchronous or synchronous.

To illustrate the both ways, we will use as example the following remote method:

```javascript
myModule.method(boolean param1, int param2, String param3)
```

### Synchronous

To call the remote method above in synchronous way, you should use dijr this way:

```javascript
var response = remote.call('myModule.method', true, 2, 'abc')
```

Note, that synchronous mode will send the HTTP request, wait for it’s completion and return the parsed JSON-RPC response immediately. But if you do a lot of calls, this method is **slow** because it waits for completion .

### Asynchronous

To optimize the performance of your web application you’d better use asynchronous calls. To call the example method in asynchronous mode your code should look like this:

```javascript
remote.call('myModule.method', true, 2, 'abc', function(response, jqXHR) {
   alert(response);
});
```

Note that in asynchronous mode you **don’t have a return value** but instead you use a **callback method** to receive the response.

The callback method receives 2 parameters:

* parameter 1 – JSON object containing the parsed JSON-RCP response
* parameter 2 – [jqXHR](http://api.jquery.com/jQuery.ajax/#jqXHRwhich) provides direct access to the XMLHttpRequest.

## Calling remote methods (multicall)

This JSON-RCP library supports ‘multicall’ specification. This means that you can invoke multiple JSON-RPC methods just with one call.

Let’s assume that you have a second remote method:

```javascript
myModule.sayHello(String message)
```

To invoke the two remote methods in one call you can use something like that:

```javascript
var response = remote.multicall({
  'myModule.method' : \[ true, 2, 'abc' \],
  'myModule.sayHello': \[ 'hello world'
});
var method1Response = response\[0\];
var method2Response = response\[1\];
```

The same thing, but done asynchronously will look the way below:

```javascript
remote.multicall({
    'myModule.method' : \[ true, 2, 'abc' \],
    'myModule.sayHello': \[ 'hello world'
  },
  function(response,jqXHR) {
    var method1Response = response\[0\];
    var method2Response = response\[1\];
  }
);
```

## Using method wrappers

During initialization, dijr will try to make a single synchronous call to invoke one special JSON-RPC function named ‘system.listMethods’. If that function is available in the system, dijr will create automatic wrappers for the methods returned by the function.

So if `system.listMethods` returns `[‘myModule.method’,‘myModule.sayHello’]`, you can use also the following construction for sync and async calls:

```javascript
// call synchronously
var response = remote.myModule_method(false, 1000000, 'apples');
// call asynchronously
remote.myModule_method(true, 10, 'cherries', function(response) {
  // handle response
});
```
