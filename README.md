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
