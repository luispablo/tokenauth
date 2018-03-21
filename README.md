# tokenauth
Simple express.js middleware to use a token for API authentication.

**News in 2.1.0 version: added support for Node 0.10**

**It's meant to use combined with jwt-simple (https://www.npmjs.com/package/jwt-simple)**

# Authentication / authorization middleware for Express JS

You must supply a JSON object with the following configuration:

```javascript
var properties = {
	secret: "asdjfasdf7fta9sd6f7asdfy7698698asd6faqhkjewr", // very long random string
	staticKeys: {
		"MOBILE_APP": "añlkajsdfkaaa66797987080adaaaeer33",
		"INTERNAL_APP": "hhklkiokjr878778fdjn3nn3nmn333jkkjlñ"
	}
};

// Build the ExpressJS middleware
var authMiddleware = require("tokenauth")(properties).Middleware;

// now you can do:
app.use("api/users", authMiddleware, require("routers/users"));
```

# Router

This helper object has already built-in the basic routes for handling the JSON web token management.

```javascript
var logger = ... // this param is optional, but you can use something similar to @luispablo/multilog (https://www.npmjs.com/package/@luispablo/multilog)

var tokenauth = require("tokenauth")(properties, logger);

var authenticator = ... // an object with an authenticate(user, pass) method, handling es6 promises, like 'ws-credentials'
var secret = "añkldjfañsdfa718749823u4h12jh4ñ123"; // to encode / decode the token
var validDays = 7; // how many days you want to keep the tokens valid, no limit
var routes = tokenauth.Router(authenticator, secret, validDays, log); // The log params is optional, defaults to console
```

and when you define the Express JS routes do something like:

```javascript
var express = require("express");
var app = express();

...

app.post("/api/auth/token", routes.createToken()); // Creates new JSON web taken with username / password authentication
app.get("/api/auth/validate_token", routes.validateToken); // Validate if a given JWT exists and is not expired
app.delete("/api/auth/token", routes.deleteToken); // Removes JWT from local storage
```

and that's it.

## Middleware auth data provided

Tokenauth leaves the decoded token info in the request.

```javascript
req.decodedToken // => { iss: "jsmith", exp: 1318874398806 }
```

The *iss* field is the username, and the *exp* field is the expiration date, expressed as the number of 
milliseconds since the Unix Epoch, just like `Date#valueOf`.

### The authenticator

In the previous section you saw the following:

```javascript
var authenticator = ... // an object with an authenticate(user, pass) method, handling es6 promises, like 'ws-credentials'
```

this is expecting an object with a function like this:

```javascript
authenticate: function (username, password) {
	return new Promise(function (resolve, reject) {
		if ( /* ¿authenticated? */) {
			resolve();
		} else {
			reject();
		}
	};
}
```

by default token auth will put the **username** and the **expires** timestamp in
the JWT. If you want to include other fields, include them in the resolve, like so:

```javascript
authenticate: function (username, password) {
	return new Promise(function (resolve, reject) {
		if ( /* ¿authenticated? */) {
			resolve({name: "Richard", lastname: "Nixon", age: 57});
		} else {
			reject();
		}
	};
}
```

## One additional step: authorization

If you want to restrict which users can get a JSON web token, you can provide the groups allowed to do so to the router thats handles the POSTing to request such new JWTs.
So going back to the last example, instead of just doing:

```javascript
	app.post("/api/auth/token", routes.createToken());
```

you can do

```javascript
	app.post("/api/auth/token", routes.createToken("Group1", "TeamA"));
```

where _Group1_ and _TeamA_ are the only groups allowed to access, the only ones with permission to create new JSON web tokens. So, going back to our example, when building the router you did:

```javascript
	var routes = tokenauth.Router(authenticator, secret, validDays, log);
```

The **authenticator** object has to provide a **groups** function that responds an ES6 promise, and resolves an array of group names. If any of the user groups is in the provided group list, the JWT will be created.

## Secure routes with username + password instead of the JWT

If you need to guard a route with the username and the password instead of the JWT (i.e.: ask the password again for a sensitive operation) you can secure the route with a special middleware instead of the default JWT one:

```javascript
router.get("/sensitiveResource/:id", routes.validateCredentials, sensitiveResource.getById);
```

This middleware expects the username in a HTTP header called **x-credentials-username**, and the password in another called **x-credentials-password**.

# Fetching authenticated data from client

We also have a helper for your authenticated HTTP fetching, like so:

```javascript
var AuthFetch = require("tokenauth").AuthFetch;

// and say you already have a jwt object
// then you can do:
var authFetch = AuthFetch(jwt);

// and then
authFetch("api/users").then(res => {
	// your magic here...
});
```

This works as the new **window.fetch** that we have now (see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

## Using app ID + token instead of user credentials

If you want to issue and authenticated fetch from another program, instead of a JWT created through user credentials, you can use the static application ID + token provided in the init config.
If you set it to:

```javascript
var properties = {
	secret: "asdjfasdf7fta9sd6f7asdfy7698698asd6faqhkjewr", // very long random string
	staticKeys: {
		"MOBILE_APP": "añlkajsdfkaaa66797987080adaaaeer33",
		"INTERNAL_APP": "hhklkiokjr878778fdjn3nn3nmn333jkkjlñ"
	}
};
```

then you can use it like this:

```javascript
var AuthFetch = require("tokenauth").AuthFetch;

// and say you already have a jwt object
// then you can do:
var authFetch = AuthFetch({ appId: "MOBILE_APP", token: "añlkajsdfkaaa66797987080adaaaeer33" });

// and then
authFetch("api/users").then(res => {
	// your magic here...
});

```

## Multipart/Form-Data

If you're submiting a form POST or PUT with multipart content, you must add a
parameter ```multipart``` set to **true**.

```javascript
var AuthFetch = require("tokenauth").AuthFetch;
var authFetch = AuthFetch(jwt);

authFetch("api/some-post", { multipart: true }).then(res => {
	// your magic here...
});
```

_This will prevent the component from setting the ```Content-Type``` to
```application/json```, and the ```JSON.strnigify``` from the body content
(it usually is a ```FormData```)_

# Logging

When you first create **TokenAuth** you can provide it with a logger, so instead
of doing

```javascript
var TokenAuth = require("tokenauth")(properties);
```

you can do

```javascript
var TokenAuth = require("tokenauth")(properties, log);
```

The **log** object is any object with four methods: info(msg), warn(msg), error(msg),
debug(msg). So you can use whichever you want, or none, and by default TokenAuth
will log to console.
Inside it's using ```@luispablo/multilog``` (you should check it out ;))

# Operation

This module will expect the header **x-access-token** for all requests, and the
header **x-access-app-id** for the static keys.
So, if a mobile app should have a fixed key to access your API, it can use an id-key
pair to identify itself, providing them in these two headers.
But if you are in a webapp, with a signed in user, it can locally store the token
recived upon signing in, and include it in each request with the **x-access-token**
HTTP header.

## Credits

[@luispablo](https://twitter.com/luispablo)
