# Next.js example

This is an example of using `@eartho/one-client-react` with [Next.js](https://nextjs.org/).

Follow the steps in [examples/README.md](../README.md) to setup an Eartho application and API.

Add the file `./examples/nextjs-app/.env` with the `domain` and `clientId` of the application and `audience` (your API identifier)

```dotenv
NEXT_PUBLIC_DOMAIN=yourdomain.com
NEXT_PUBLIC_CLIENT_ID=yourclientid
NEXT_PUBLIC_ACCESS_ID=https://api.example.com/users
```

Run `npm run dev` to start the application at http://localhost:3000

Start the API using the instructions in [examples/users-api/README.md](../users-api/README.md)
