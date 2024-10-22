interface UserActivity {
  type: string;
  data: {
    accessId: string;
    accountId: string;
    role: string;
    access: {
      id: string;
    };
    terms: {
      identity: string[];
      payment: Record<string, unknown>;
    };
    entityId: string;
    startTime: number;
    entity: {
      id: string;
      title: string;
      holderId: string;
    };
    account: {
      uid: string;
      photoURL: string;
      providerSource?: string;
      displayName: string;
      email: string;
    };
    status: string;
  };
}
