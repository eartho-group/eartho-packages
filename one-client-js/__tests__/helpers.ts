import { expect } from '@jest/globals';

export const expectToHaveBeenCalledWithEarthoOneParam = (mock, expected) => {
  const [[url]] = (<jest.Mock>mock).mock.calls;
  const param = new URL(url).searchParams.get('earthoOneClient');
  const decodedParam = decodeURIComponent(atob(param));
  const actual = JSON.parse(decodedParam);
  expect(actual).toStrictEqual(expected);
};

export const expectToHaveBeenCalledWithHash = (mock, expected) => {
  const [[url]] = (<jest.Mock>mock).mock.calls;
  const hash = new URL(url).hash;
  expect(hash).toEqual(expected);
};
