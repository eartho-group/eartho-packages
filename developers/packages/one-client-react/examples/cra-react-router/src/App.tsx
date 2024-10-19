import React from 'react';
import { useEarthoOne, withAccessRequired } from '@eartho/one-client-react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import { Nav } from './Nav';
import { Error } from './Error';
import { Loading } from './Loading';
import { Users } from './Users';

const ProtectedUsers = withAccessRequired(Users);

function App() {
  const { isLoading, error } = useEarthoOne();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Nav />
      {error && <Error message={error.message} />}
      <Routes>
        <Route path="/" />
        <Route path="/users" element={<ProtectedUsers />} />
      </Routes>
    </>
  );
}

export default App;
