# tokenauth
Simple express.js middleware to use a token for API authentication.

**It's meant to use combined with jwt-simple (https://www.npmjs.com/package/jwt-simple)**

# Configuration
You must supply a JSON object with the following configuration:

```
const properties = {
	secret: "asdjfasdf7fta9sd6f7asdfy7698698asd6faqhkjewr", // very long random string
	excludedRoutes: ["api/login", "api/verify"],
	staticKeys: {
		"MOBILE_APP": "añlkajsdfkaaa66797987080adaaaeer33",
		"INTERNAL_APP": "hhklkiokjr878778fdjn3nn3nmn333jkkjlñ"
	}
};
```

and then build the middleware:

```
const TokenAuth = require("tokenauth")(properties);
```

and then just use it as an express JS middleware. For example, when adding routes:

```
app.use("api/users", TokenAuth.Middleware("api/users"), require("routers/users"));
```

and to sign in a user do:

```
const token = TokenAuth.TokenBuilder(username, days);
```

where username is the username (dogh!), and days is the number of days you want
this token to be valid. And then... use it as you like.

# Router

You also have a Router to add to your Express JS app. Do it like this:

```
const authenticator = <an object with an authenticate(user, pass) method, handling es6 promises, like 'ws-credentials'>;
const secret = "añkldjfañsdfa718749823u4h12jh4ñ123"; // to encode / decode the token
const validDays = 7; // how many days you want to keep the tokens valid, no limit
const routes = TokenAuth.Router(authenticator, secret, validDays, log); // The log params is optional, defaults to console
```

and when you define the Express JS routes do something like:

```
const express = require("express");
const app = express();
...
app.post("/api/auth/token", routes.createToken);
app.get("/api/auth/validate_token", routes.validateToken);
```

and that's it.

# Logging

When you first create **TokenAuth** you can provide it with a logger, so instead
of doing

```
const TokenAuth = require("tokenauth")(properties);
```

you can do

```
const TokenAuth = require("tokenauth")(properties, log);
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
