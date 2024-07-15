import createEarthoOne, {
  EarthoOne,
  GenericError,
  AuthenticationError,
} from './index';

/**
 * @ignore
 */
const wrapper = createEarthoOne as any;

wrapper.EarthoOne = EarthoOne;
wrapper.createEarthoOne = createEarthoOne;
wrapper.GenericError = GenericError;
wrapper.AuthenticationError = AuthenticationError;

export default wrapper;
