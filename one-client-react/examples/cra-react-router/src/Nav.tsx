import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useEarthoOne } from '@eartho/one-client-react';

export function Nav() {
  const { isConnected, user, connectWithRedirect, logout } = useEarthoOne<{
    name: string;
  }>();
  const { pathname } = useLocation();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <span className="navbar-brand">@eartho/one-client-react</span>
      <div className="collapse navbar-collapse">
        <div className="navbar-nav">
          <Link
            to="/"
            className={`nav-item nav-link${pathname === '/' ? ' active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/users"
            className={`nav-item nav-link${
              pathname === '/users' ? ' active' : ''
            }`}
          >
            Users
          </Link>
        </div>
      </div>

      {isConnected ? (
        <div>
          <span id="hello">Hello, {user?.name}!</span>{' '}
          <button
            className="btn btn-outline-secondary"
            id="logout"
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
          >
            logout
          </button>
        </div>
      ) : (
        <button
          className="btn btn-outline-success"
          id="login"
          onClick={() => connectWithRedirect()}
        >
          login
        </button>
      )}
    </nav>
  );
}
