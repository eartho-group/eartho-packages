'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, connectWithPopup } from '@eartho/one-client-nextjs/client';

export default function Nav() {
  const { user } = useUser();
  const pathname = usePathname();
  const pageName = pathname?.split('/').pop() || 'home';

  return (
    <>
      {/* Primary Navigation */}
      <div className={`header ${pageName}`}>
        <nav>
          <div className="nav-container">
            <Link href="/" legacyBehavior>
              <a className="nav-item active">App Router</a>
            </Link>
            <Link href="/page-router" legacyBehavior>
              <a className="nav-item">Page Router</a>
            </Link>
          </div>
        </nav>
      </div>

      {/* Authentication Controls */}
      <div className={`header ${pageName} auth`}>
        <nav>
          <h3>Authentication</h3>
          <div className="nav-container">
            {user ? (
              <>
                <a href="/api/access/logout" className="nav-item" data-testid="logout">
                  Logout
                </a>
                <a href="/api/edge-access/logout" className="nav-item" data-testid="logout-edge">
                  Logout (Edge)
                </a>
              </>
            ) : (
              <>
                <button
                  className="nav-item"
                  onClick={async () => {
                    connectWithPopup('login');
                  }}
                  data-testid="login"
                >
                  Login
                </button>
                <a href="/api/edge-access/login" className="nav-item" data-testid="login-edge">
                  Login (Edge)
                </a>
              </>
            )}
          </div>
        </nav>
      </div>

      <div className={`header ${pageName} secondary`}>
        <nav>
          <div className="nav-section">
            <h3>Client</h3>
            <div className="nav-container">
              <Link href="/" legacyBehavior>
                <a className="nav-item">Home</a>
              </Link>
              <Link href="/client/profile" legacyBehavior>
                <a className="nav-item">Profile Using SDK</a>
              </Link>
              <Link href="/client/profile-node-api" legacyBehavior>
                <a className="nav-item">Profile Using Node API</a>
              </Link>
              <Link href="/client/profile-edge-api" legacyBehavior>
                <a className="nav-item">Profile Using Edge API</a>
              </Link>
            </div>
          </div>

          <div className="nav-section">
            <h3>Node (SSR)</h3>
            <div className="nav-container">
              <Link href="/node/profile-node-api" legacyBehavior>
                <a className="nav-item">Profile</a>
              </Link>
            </div>
          </div>

          <div className="nav-section">
            <h3>Edge (SSR)</h3>
            <div className="nav-container">
              <Link href="/edge-profile" legacyBehavior>
                <a className="nav-item">Profile</a>
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
