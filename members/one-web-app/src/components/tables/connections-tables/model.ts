interface Connection {
    id: string;
    accessId: string;
    accountId: string;
    role: string;
    access: { id: string };
    terms: { identity: string[]; payment: Record<string, unknown> };
    entityId: string;
    startTime: number;
    entity: { id: string; title: string; holderId: string };
    account: {
      uid: string;
      photoURL: string;
      displayName: string;
      email: string;
      providerSource?: string;
    };
    status: string;
  }