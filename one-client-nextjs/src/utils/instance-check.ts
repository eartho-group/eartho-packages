let isUsingNamedExports = false;
let isUsingOwnInstance = false;

const instanceCheck = () => {
  if (isUsingNamedExports && isUsingOwnInstance) {
    throw new Error(
      'You cannot mix creating your own instance with `initEartho` and using named ' +
        "exports like `import { handleAccess } from '@eartho/one-client-nextjs'`"
    );
  }
};

export const setIsUsingNamedExports = (): void => {
  isUsingNamedExports = true;
  instanceCheck();
};

export const setIsUsingOwnInstance = (): void => {
  isUsingOwnInstance = true;
  instanceCheck();
};
