import '@testing-library/jest-dom/extend-expect';
import React, { Component } from 'react';
import withEarthoOne, { WithEarthoOneProps } from '../src/with-eartho';
import { render, screen } from '@testing-library/react';
import { EarthoOneContextInterface, initialContext } from '../src/eartho-context';

describe('withEarthoOne', () => {
  it('should wrap a class component', () => {
    class MyComponent extends Component<WithEarthoOneProps> {
      render(): JSX.Element {
        return <>hasAuth: {`${!!this.props.eartho}`}</>;
      }
    }
    const WrappedComponent = withEarthoOne(MyComponent);
    render(<WrappedComponent />);
    expect(screen.getByText('hasAuth: true')).toBeInTheDocument();
  });

  it('should wrap a class component and provide context', () => {
    const context = React.createContext<EarthoOneContextInterface>(initialContext);
    class MyComponent extends Component<WithEarthoOneProps> {
      render(): JSX.Element {
        return <>hasAuth: {`${!!this.props.eartho}`}</>;
      }
    }
    const WrappedComponent = withEarthoOne(MyComponent, context);
    render(<WrappedComponent />);
    expect(screen.getByText('hasAuth: true')).toBeInTheDocument();
  });
});
