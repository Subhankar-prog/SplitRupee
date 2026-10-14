interface Window {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: { access_token?: string; error?: string }) => void;
          prompt?: string;
        }) => {
          requestAccessToken: (options?: { prompt?: string }) => void;
        };
      };
      id?: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential?: string }) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
        }) => void;
        prompt: (notification?: (notification: any) => void) => void;
        renderButton: (parent: HTMLElement, options: any) => void;
      };
    };
  };
}
