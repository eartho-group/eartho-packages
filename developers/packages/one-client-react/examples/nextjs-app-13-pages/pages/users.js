import React from 'react';
import { withAccessRequired } from '@eartho/one-client-react';
import { callToApiExample } from '../hooks/callToApiExample';
import { Loading } from '../components/Loading';
import { Error } from '../components/Error';

const PORT = process.env.NEXT_PUBLIC_API_PORT || 3001;

const Users = () => {
  const {
    loading,
    error,
    data: users = [],
  } = callToApiExample(`http://localhost:${PORT}/users`, {
    access_id: process.env.NEXT_PUBLIC_ACCESS_ID,
  });

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Email</th>
        </tr>
      </thead>
      <tbody>
        {users.map(({ name, email }, i) => (
          <tr key={i}>
            <td>{name}</td>
            <td>{email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default withAccessRequired(Users, {
  requiredAccess: ['admin', 'editor'],
  redirectPaths: {
    admin: '/admin-dashboard',
    editor: '/editor-dashboard'
  },
  defaultRedirectPath: '/no-access',
  returnTo: '/users',
  onRedirecting: () => <Loading />,
  onBeforeRedirect: async () => {
    console.log('Access check in progress');
  },
});
