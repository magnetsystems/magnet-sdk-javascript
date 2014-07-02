## Magnet Mobile SDK for JavaScript

The Magnet Mobile SDK for JavaScript is a framework that simplifies user authentication, enables device management, provides efficient synchronization of data, facilitates capture of device logs and performance metrics,
and facilitates backup and restore of Magnet application-specific data. The SDK enables you to focus on the design and user experience of mobile apps rather than spending time building complex frameworks and infrastructure. Built with portability in mind, the SDK is supported across a variety of clients: hybrid mobile apps with PhoneGap, server side JavaScript with Node.js, and web/mobile web applications.

The SDK also handles the intricacies of communicating with controllers and resource nodes exposed by the server through the use of conventional JavaScript APIs. This is accomplished by importing custom API libraries generated
using with Magnet Mobile App Builder into the SDK. These libraries provide an interface for communicating with the server, and can be extended to utilize valuable mobile capabilities such as reliable calls, response/response caching, and enforcement of constraints based on network/location.

More information is available at [http://www.magnet.com](http://www.magnet.com/developers/develop-with-magnet/).

The SDK is licensed under the terms of the [Magnet Software License Agreement](http://www.magnet.com/resources/tos.html).  Please see [LICENSE](https://github.com/magnetsystems/magnet-sdk-javascript/blob/master/LICENSE) file for full details.

A tutorial for getting started is available at [Developer Factory - Get Started](https://factory.magnet.com/get-started/).

### Import the SDK into your own PhoneGap or Web app

Download and place magnet-sdk.js into a directory within your project. In your HTML file, add a script tag reference to the file.

```html
<!DOCTYPE html>
<html>
<head>
<title>My PhoneGap App</title>
<script type="text/JavaScript" src="js/magnet-sdk.js"></script>
</head>
<body>
</body>
</html>
```

### Import the SDK into your Node.js app

From command line, navigate to the root directory of a node.js project. Place the magnet-sdk.js into a directory with your project. You will need to reference the SDK within your application logic as shown below.

```
var MagnetJS = require('./lib/magnet-sdk');
```

## Notes / Caveats

### PhoneGap

#### SDK Requires PhoneGap Plugins

The SDK relies on several PhoneGap plugins. These plugins should be included in every app in order to leverage mobile capabilities. These plugins can be added easily using the PhoneGap command line interface. For example, the PhoneGap Device plugin can be added by navigating to the root directory of the PhoneGap project, and running the following command:

```
$ phonegap local plugin add org.apache.cordova.device
```

##### Required PhoneGap Plugins:
* org.apache.cordova.device
* org.apache.cordova.file
* org.apache.cordova.file-transfer
* org.apache.cordova.geolocation
* org.apache.cordova.inappbrowser
* org.apache.cordova.network-information


#### Self-Signed Certificates Over SSL On Android

Current versions of the Cordova framework on Android clients cannot execute AJAX requests to an SSL-enabled server which uses a self-signed certificate. There are two workarounds:

* Use a valid SSL certificate while developing your app.
* Disable SSL while developing your app, then switch to a valid SSL certificate in production.


#### Self-Signed Certificates Over SSL On iOS

Current versions of the Cordova framework on iOS clients cannot execute AJAX requests to an SSL-enabled server which uses a self-signed certificate. To circumvent this issue during development, following the steps listed below.

1. Open AppDelegate.m in a text editor.

```
ios/<project name>/Classes/AppDelegate.m
```

2. Append the following Objective-C code into the bottom of the file.

```
@implementation NSURLRequest(DataController)
+ (BOOL)allowsAnyHTTPSCertificateForHost:(NSString *)host
{
    return YES;
}
@end
```

3. Rebuild the iOS app from Xcode.

4. Make sure to remove this code in production to avoid security issues.


#### How to test GPS on Android or iOS emulator

Simulate a change in GPS location by changing the latitude and longitude values:

Android
In the Android emulator, enableHighAccuracy must be set to true in the SDK.
```
Eclipse -> DDMS -> Emulator Control -> Location Controls
```

iOS
```
iOS Simulator -> Debug -> Location -> Custom Location
```

### Node.js

#### Limited Set Of Features

While the SDK is compatible with Node.js, several SDK features not applicable. Refer to the Feature Comparison chart in  the Magnet Mobile SDK for JavaScript Developer Guide to determine which features are supported.


### Web

#### Limited Set Of Features

While the SDK is compatible with web applications, several SDK features are either not applicable, or not supported on a majority of the modern web browsers. Refer to the Feature Comparison chart in the Magnet Mobile SDK for JavaScript Developer Guide to determine which features are supported.

#### Lack Of Support For Cross-Domain AJAX Requests

Browser-based web applications suffer from the "same-origin policy", a security concept which prevents AJAX requests across domain boundaries. As a result, the web application must reside on the same host and port as the target server in order to make requests. A workaround is to use CORS (Cross Origin Resource Sharing), a client and server implementation which circumvents this limitation through the use of HTTP headers and a pre-flight request.

More information about CORS is available from this external link:
[Enable CORS](http://enable-cors.org/)

PhoneGap apps can be configured to make cross-domain AJAX requests from the config.xml file. More information can be found in the [Whitelist Guide](http://docs.phonegap.com/en/3.5.0/guide_appdev_whitelist_index.md.html#Whitelist%20Guide).

