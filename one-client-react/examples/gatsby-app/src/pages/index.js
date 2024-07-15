import React from 'react';
import { useEarthoOne } from '@eartho/one-client-react';
import { Nav } from '../components/Nav';
import { Loading } from '../components/Loading';
import { Error } from '../components/Error';

const IndexPage = () => {
  const { isLoading, error } = useEarthoOne();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Nav />
      {error && <Error message={error.message} />}
    </>
  );
};

export default IndexPage;
