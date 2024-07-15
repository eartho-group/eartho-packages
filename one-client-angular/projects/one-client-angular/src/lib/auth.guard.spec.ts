import { of } from 'rxjs';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  const routeMock: any = { snapshot: {} };
  const routeStateMock: any = { snapshot: {}, url: '/' };

  describe('canActivate', () => {
    it('should return true for a logged in user', () => {
      const authServiceMock: any = {
        isConnected$: of(true),
        connectWithRedirect: jasmine.createSpy('connectWithRedirect'),
      };
      guard = new AuthGuard(authServiceMock);
      const listener = jasmine.createSpy();
      guard.canActivate(routeMock, routeStateMock).subscribe(listener);
      expect(authServiceMock.connectWithRedirect).not.toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(true);
    });

    it('should redirect a logged out user', () => {
      const authServiceMock: any = {
        isConnected$: of(false),
        connectWithRedirect: jasmine.createSpy('connectWithRedirect'),
      };
      guard = new AuthGuard(authServiceMock);
      guard.canActivate(routeMock, routeStateMock).subscribe();
      expect(authServiceMock.connectWithRedirect).toHaveBeenCalledWith({
        appState: { target: '/' },
      });
    });
  });

  describe('canActivateChild', () => {
    it('should return true for a logged in user', () => {
      const authServiceMock: any = {
        isConnected$: of(true),
        connectWithRedirect: jasmine.createSpy('connectWithRedirect'),
      };
      guard = new AuthGuard(authServiceMock);
      const listener = jasmine.createSpy();
      guard.canActivateChild(routeMock, routeStateMock).subscribe(listener);
      expect(authServiceMock.connectWithRedirect).not.toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith(true);
    });

    it('should redirect a logged out user', () => {
      const authServiceMock: any = {
        isConnected$: of(false),
        connectWithRedirect: jasmine.createSpy('connectWithRedirect'),
      };
      guard = new AuthGuard(authServiceMock);
      guard.canActivateChild(routeMock, routeStateMock).subscribe();
      expect(authServiceMock.connectWithRedirect).toHaveBeenCalledWith({
        appState: { target: '/' },
      });
    });
  });

  describe('canLoad', () => {
    it('should return true for an authenticated user', () => {
      const authServiceMock: any = {
        isConnected$: of(true),
      };
      guard = new AuthGuard(authServiceMock);
      const listener = jasmine.createSpy();
      guard.canLoad(routeMock, []).subscribe(listener);
      expect(listener).toHaveBeenCalledWith(true);
    });

    it('should return false for an unauthenticated user', () => {
      const authServiceMock: any = {
        isConnected$: of(false),
      };
      guard = new AuthGuard(authServiceMock);
      const listener = jasmine.createSpy();
      guard.canLoad(routeMock, []).subscribe(listener);
      expect(listener).toHaveBeenCalledWith(false);
    });
  });
});
