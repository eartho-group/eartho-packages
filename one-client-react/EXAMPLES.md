# Examples
## Use with a Class Component

Use the `withEarthoOne` higher order component to add the `eartho` property to Class components:

```jsx
import React, { Component } from 'react';
import { withEarthoOne } from '@eartho/one-client-react';

class Profile extends Component {
  render() {
    // `this.props.eartho` has all the same properties as the `useEarthoOne` hook
    const { user } = this.props.eartho;
    return <div>Hello {user.name}</div>;
  }
}

export default withEarthoOne(Profile);
```

## Protect a Route

Protect a route component using the `withAuthenticationRequired` higher order component. Visits to this route when unauthenticated will redirect the user to the login page and back to this page after login:

```jsx
import React from 'react';
import { withAuthenticationRequired } from '@eartho/one-client-react';

const PrivateRoute = () => <div>Private</div>;

export default withAuthenticationRequired(PrivateRoute, {
  // Show a message while the user waits to be redirected to the login page.
  onRedirecting: () => <div>Redirecting you to the login page...</div>,
});
```

**Note** If you are using a custom router, you will need to supply the `EarthoOneProvider` with a custom `onRedirectCallback` method to perform the action that returns the user to the protected page. 

## Call an API

Call a protected API with an Access Token:

```jsx
import React, { useEffect, useState } from 'react';
import { useEarthoOne } from '@eartho/one-client-react';

const Posts = () => {
  const { getAccessTokenSilently } = useEarthoOne();
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://api.example.com/',
            scope: 'read:posts',
          },
        });
        const response = await fetch('https://api.example.com/posts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPosts(await response.json());
      } catch (e) {
        // Handle errors such as `login_required` and `consent_required` by re-prompting for a login
        console.error(e);
      }
    })();
  }, [getAccessTokenSilently]);

  if (!posts) {
    return <div>Loading...</div>;
  }

  return (
    <ul>
      {posts.map((post, index) => {
        return <li key={index}>{post}</li>;
      })}
    </ul>
  );
};

export default Posts;
```

## Protecting a route in a `react-router-dom v6` app

We need to access the `useNavigate` hook so we can use `navigate` in `onRedirectCallback` to return us to our `returnUrl`.

In order to access `useNavigate` when defining our `EarthoOneProvider` we must nest it in `BrowserRouter` and use the navigate method from the hook in our `onRedirectCallback` config.

We can then use the `withAuthenticationRequired` HOC (Higher Order Component) to create a `ProtectedRoute` component that redirects anonymous users to the login page, before returning them to the protected route:

```jsx
import React from 'react';
import { Route, BrowserRouter, Routes, useNavigate } from 'react-router-dom';
import { EarthoOneProvider, withAuthenticationRequired } from '@eartho/one-client-react';
import Profile from './Profile';

const ProtectedRoute = ({ component, ...args }) => {
  const Component = withAuthenticationRequired(component, args);
  return <Component />;
};

const EarthoOneProviderWithRedirectCallback = ({ children, ...props }) => {
  const navigate = useNavigate();
  const onRedirectCallback = (appState) => {
    navigate((appState && appState.returnTo) || window.location.pathname);
  };
  return (
    <EarthoOneProvider onRedirectCallback={onRedirectCallback} {...props}>
      {children}
    </EarthoOneProvider>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <EarthoOneProviderWithRedirectCallback
        domain="YOUR_EARTHO_DOMAIN"
        clientId="YOUR_EARTHO_CLIENT_ID"
        authorizationParams={{
          redirect_uri: window.location.origin,
        }}
      >
        <Routes>
          <Route path="/" exact />
          <Route
            path="/profile"
            element={<ProtectedRoute component={Profile} />}
          />
        </Routes>
      </EarthoOneProviderWithRedirectCallback>
    </BrowserRouter>
  );
}
```

See [react-router example app](./examples/cra-react-router)

## Protecting a route in a Gatsby app

Wrap the root element in your `EarthoOneProvider` to configure the SDK and setup the context for the `useEarthoOne` hook.

The `onRedirectCallback` will use `gatsby`'s `navigate` function to return the user to the protected route after the login:

```jsx
// gatsby-browser.js
import React from 'react';
import { EarthoOneProvider } from '@eartho/one-client-react';
import { navigate } from 'gatsby';

const onRedirectCallback = (appState) => {
  // Use Gatsby's navigate method to replace the url
  navigate(appState?.returnTo || '/', { replace: true });
};

export const wrapRootElement = ({ element }) => {
  return (
    <EarthoOneProvider
      domain="YOUR_EARTHO_DOMAIN"
      clientId="YOUR_EARTHO_CLIENT_ID"
      onRedirectCallback={onRedirectCallback}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      {element}
    </EarthoOneProvider>
  );
};
```

Create a page that you want to be protected, e.g. a profile page, and wrap it in the `withAuthenticationRequired` HOC:

```jsx
// src/pages/profile.js
import React from 'react';
import { useEarthoOne, withAuthenticationRequired } from '@eartho/one-client-react';

const Profile = () => {
  const { user } = useEarthoOne();
  return (
    <ul>
      <li>Name: {user.nickname}</li>
      <li>E-mail: {user.email}</li>
    </ul>
  );
};

// Wrap the component in the withAuthenticationRequired handler
export default withAuthenticationRequired(Profile);
```

See [Gatsby example app](./examples/gatsby-app)

## Protecting a route in a Next.js app (in SPA mode)

Wrap the root element in your `EarthoOneProvider` to configure the SDK and setup the context for the `useEarthoOne` hook.

The `onRedirectCallback` will use `next`'s `Router.replace` function to return the user to the protected route after the login:

```jsx
// pages/_app.js
import React from 'react';
import App from 'next/app';
import Router from 'next/router';
import { EarthoOneProvider } from '@eartho/one-client-react';

const onRedirectCallback = (appState) => {
  // Use Next.js's Router.replace method to replace the url
  Router.replace(appState?.returnTo || '/');
};

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <EarthoOneProvider
        domain="YOUR_EARTHO_DOMAIN"
        clientId="YOUR_EARTHO_CLIENT_ID"
        onRedirectCallback={onRedirectCallback}
        authorizationParams={{
          redirect_uri:
            typeof window !== 'undefined' ? window.location.origin : undefined,
        }}
      >
        <Component {...pageProps} />
      </EarthoOneProvider>
    );
  }
}

export default MyApp;
```

Create a page that you want to be protected, e.g. a profile page, and wrap it in the `withAuthenticationRequired` HOC:

```jsx
// pages/profile.js
import React from 'react';
import { useEarthoOne, withAuthenticationRequired } from '@eartho/one-client-react';

const Profile = () => {
  const { user } = useEarthoOne();
  return (
    <ul>
      <li>Name: {user.nickname}</li>
      <li>E-mail: {user.email}</li>
    </ul>
  );
};

// Wrap the component in the withAuthenticationRequired handler
export default withAuthenticationRequired(Profile);
```

See [Next.js example app](./examples/nextjs-app)

## Use with Eartho organizations


```jsx
ReactDOM.render(
  <React.StrictMode>
    <EarthoOneProvider
      domain="YOUR_EARTHO_DOMAIN"
      clientId="YOUR_EARTHO_CLIENT_ID"
      authorizationParams={{
        organization: "YOUR_ORGANIZATION_ID_OR_NAME"
        redirectUri: window.location.origin,
      }}
    >
      <App />
    </EarthoOneProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

To accept an invite from an organization, you should call `connectWithRedirect` with the `invitation` and `organization` parameters.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { EarthoOneProvider, useEarthoOne } from '@eartho/one-client-react';

const App = () => {
  const { connectWithRedirect } = useEarthoOne();
  const url = window.location.href;
  const inviteMatches = url.match(/invitation=([^&]+)/);
  const orgMatches = url.match(/organization=([^&]+)/);
  if (inviteMatches && orgMatches) {
    connectWithRedirect({
      authorizationParams: {
        organization: orgMatches[1],
        invitation: inviteMatches[1],
      }
    });
  }
  return <div>...</div>;
};
```

## Protecting a route with a claims check

In order to protect a route with a claims check alongside an authentication required check, you can create a HOC that will wrap your component and use that to check that the user has the required claims.

```jsx
const withClaimCheck = (Component, myClaimCheckFunction, returnTo) => {
  const { user } =  useEarthoOne();
  if (myClaimCheckFunction(user)) {
    return <Component />
  }
  Router.push(returnTo);
}

const checkClaims = (claim?: User) => claim?.['https://my.app.io/jwt/claims']?.ROLE?.includes('ADMIN');

// Usage
const Page = withAuthenticationRequired(
  withClaimCheck(Component, checkClaims, '/missing-roles' )
);
```
