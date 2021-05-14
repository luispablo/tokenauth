# tokenauth
express.js middleware to implement JWT auth.

**This module uses [jwt-simple](https://www.npmjs.com/package/jwt-simple) to create / encode and decode JWTs**

# Auth middleware for Express JS

The settings are provided through JSON.

```javascript
const properties = {
  token: {
    secret: "asdjfasdf7fta9sd6f7asdfy7698698asd6faqhkjewr",
    validDays: 90
  },
  staticKeys: {
    "MOBILE_APP": "añlkajsdfkaaa66797987080adaaaeer33",
    "INTERNAL_APP": "hhklkiokjr878778fdjn3nn3nmn333jkkjlñ"
  },
  roles: {
    "role_default": { defaultRole: true },
    "role_name_1": {
      groups: ["GROUP_NAME_1", "GROUP_NAME_2"],
      users: ["username1", "username2"]
    },
    "role_name_2": {
      groups: ["GROUP_NAME_1"]
    }
  }
};

// Build the ExpressJS middleware
const authMiddleware = require("tokenauth")(properties).Middleware;

// now you can do:
app.use("api/users", authMiddleware, require("routers/users"));
```

# Router

tokenauth provides an Express router to create, validate an destroy the JWTs.

```javascript
const logger = ... // this param is optional, but you can use something similar to @luispablo/multilog (https://www.npmjs.com/package/@luispablo/multilog)

const initTokenauth = require("tokenauth");

const tokenauth = initTokenauth(properties, logger);
const authenticator = ... // an object with an authenticate(user, pass) function, with a thenable response
const secret = "añkldjfañsdfa718749823u4h12jh4ñ123"; // to encode / decode the token
const validDays = 7; // how many days you want to keep the tokens valid, no limit
const routes = tokenauth.Router(authenticator, secret, validDays, log); // The log params is optional, defaults to console
```

and when you define the Express JS routes do something like:

```javascript
const express = require("express");
const app = express();

...

app.post("/api/auth/token", routes.createToken); // Creates new JWT with username / password authentication
app.get("/api/auth/validate_token", routes.validateToken); // Validate if a given JWT exists and is not expired
app.delete("/api/auth/token", routes.deleteToken); // Removes JWT from local storage
```

and that's it.

The POST route that creates a new JWT, returns an object as such:

```JSON
{
  "token": <<jwt>>,
  "expires": 229919339883,
  "user": { 
    "username": "the-username",
    "roles": ["role-name-1", "role-name-2"],
    // Whaever else info authenticator returns...
  }
}
```

The **roles** property of the user object contains the computed roles for the user, from its username and groups.


## SPECIAL CASE: Google OAuth

If you want to use Google OAuth service, you can set the router up in the following way (using passport & passport-google-oauth20 npm modules):

```javascript
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const secret = "añkldjfañsdfa718749823u4h12jh4ñ123"; // to encode / decode the token
const initTokenauth = require("tokenauth");

const tokenauth = initTokenauth({
  token: {
    secret,
    validDays: 90
  },
  staticKeys: {
    "MOBILE_APP": "añlkajsdfkaaa66797987080adaaaeer33",
    "INTERNAL_APP": "hhklkiokjr878778fdjn3nn3nmn333jkkjlñ"
  }
});
const auth = tokenauth.Middleware;
const authRouter = tokenauth.Router(null, secret, validDays);

passport.use(new GoogleStrategy({ 
  clientID: process.env.GOOGLE_CLIENT_ID, 
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
  callbackURL: process.env.GOOGLE_CALLBACK_URL 
}, function (accessToken, refreshToken, profile, done) {
  done(null, profile);
}));
passport.serializeUser(function(user, cb) {
  cb(null, user);
});
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

app.get("/auth/token/validate", authRouter.validateToken); // Validate if a given JWT exists and is not expired
app.delete("/auth/token", authRouter.deleteToken); // Removes JWT from local storage
app.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email', 'openid'] }));
app.get("/auth/google/callback", passport.authenticate('google', { failureRedirect: '/login' }), async function (req, res) {
  const email = req.user.emails[0].value;
  const [dbUser] = await knex("users").where({ email });
  const responseItems = [];
  if (dbUser) { 
    const { token, exp, user } = authRouter.addToken(email, req.user);
    responseItems.push(["user.email", email]);
    responseItems.push(["JWT", token]);
  } else {
    responseItems.push(["error", "Inexistent user"]);
  }
  res.send(`
    <html><script>
      ${responseItems.map(i => `window.localStorage.setItem("${i[0]}", "${i[1]}")`)}
      window.location.href = "/";
    </script></html>
  `);
});

```

## Middleware auth data provided

Tokenauth leaves the decoded token info in the request.

```javascript
req.decodedToken // => { "sub": "jsmith", "exp": 1318874398806 }
```

The **sub** (Subject) and **exp** (Expiration Time) fields are set as defined in the standard about JSON Web Tokens from the IETF: [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.txt).

The **username** provided is set as the Subject field.

### The authenticator

In the previous section you saw the following:

```javascript
const authenticator = ... // an object with an authenticate(user, pass) function, with a thenable response
```

this is expecting an object with a function like this:

```javascript
authenticate: (username, password) => new Promise((resolve, reject) => {
  if ( /* ¿authenticated? */) {
    resolve();
  } else {
    reject();
  }
})
```

by default token auth will put the **sub** (Subject, the username) and the **exp** (Expiration Time) timestamp in
the JWT claim set. If you want to include other fields, include them in the resolve, like so:

```javascript
authenticate: (username, password) => new Promise((resolve, reject) => {
  if ( /* ¿authenticated? */) {
    resolve({ name: "Richard", lastname: "Nix", age: 57 });
  } else {
    reject();
  }
})
```

## Authorization

Inside the configuration you have an optional parameter named ```roles``` which rules the authorization part of the library.

```json
  ...
  roles: {
    "role_default": { defaultRole: true },
    "role_name_1": {
      groups: ["GROUP_NAME_1", "GROUP_NAME_2"],
      users: ["username1", "username2"]
    },
    "role_name_2": {
      groups: ["GROUP_NAME_1"]
    }
  }
  ...
```

If you omit this item in your settings, everyone with a user and password will be able to create a JWT and no further check will be performed. If you include it, tokenauth will give you computed roles for the authenticated user inside the JWT.

You can include a **default** role, to be given to anyone with a user and password. To state that a role is default set its ```defaultRole``` property to **true**.

```json
    ...
    "role_default": { defaultRole: true },
    ...
```

Going further, when you want to assign roles to specific users, set to such roles a ```users``` property, with a string array of usernames.

```json
    ...
    "role_name_3": {
      users: ["username1", "username2"]
    },
    ...
```

Furthermore, if you want to assing the roles based on groups from your authenticator, it has to return, inside the additional data, a property named ```groups```, with an array of strings representing the group names in it.

The roles computation will search the ```roles``` property in tokenauth config to see if any of the auhtenticated user groups are there.

```json
    ...
    "role_name_2": {
      groups: ["GROUP_NAME_1"]
    }
    ...
```

The final computed ```roles``` property will look like this:

```json
// JWT
{
  ...
  "user": {
    ...
    "roles": ["role2", "role3", "role6"]
    ...
  }
}
```

**IMPORTANT NOTE**: If you include the ```roles``` property in your configuration, _without_ a default role, the users that aren't included in any role won't be able to authenticate.

## Secure routes with username + password instead of the JWT

If you need to guard a route with the username and the password instead of the JWT (i.e.: ask the password again for a sensitive operation) you can secure the route with a special middleware instead of the default JWT one:

```javascript
router.get("/sensitiveResource/:id", routes.validateCredentials, sensitiveResource.getById);
```

This middleware expects the username in a HTTP header called **x-credentials-username**, and the password in another called **x-credentials-password**.

# Fetching authenticated data from client

We also have a helper for your authenticated HTTP fetching, like so:

```javascript
const { authFetch } = require("tokenauth");

try {
   // By default it'll try to take the JWT from localStorage: localStorage.get("JWT")
  const res = await authFetch("api/users");

  // If you have the JWT somewhere else, you can provide one as an option
  const res = await authFetch("api/users", { jwt: ctx.jwt });
  
  if (res.status === 401) {
    // Your JWT is invalid, get a new one!
  } else if (res.status === 200) {
    const data = await res.json();
  }
} catch (err) {
  if (err.message === "NO_JWT") {
    // No JSON Web Token found in local storage, get one!
  }
}
```

To keep legacy compatibilty, this still works:

```javascript
const { AuthFetch } = require("tokenauth");
const authFetch = AuthFetch(jwt);

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
const { AuthFetch } = require("tokenauth");

// and say you already have a jwt object
// then you can do:
const authFetch = AuthFetch({ appId: "MOBILE_APP", token: "añlkajsdfkaaa66797987080adaaaeer33" });

// and then
authFetch("api/users").then(res => {
	// your magic here...
});

```

## Multipart/Form-Data

If you're submiting a form POST or PUT with multipart content, you must add a
parameter ```multipart``` set to **true**.

```javascript
const { AuthFetch } = require("tokenauth");
const authFetch = AuthFetch(jwt);

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
const initTokenauth = require("tokenauth");
const tokenauth = initTokenauth(properties);
```

you can do

```javascript
const initTokenauth = require("tokenauth");
const tokenauth = initTokenauth(properties, log);
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
