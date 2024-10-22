interface VirtualIdentity {
    id: string;
    birthdate: string;
    address: {
      country: string;
      city: string;
      street: string;
      state: string;
      postalCode: string;
    };
    gender: string;
    social: {
      twitter: string;
      website: string;
      facebook: string;
      linkedin: string;
    };
    lastName: string;
    bio: string;
    uid: string;
    educationHistory: Array<{
      graduationDate: string;
      institution: string;
      degree: string;
    }>;
    password: string;
    avatarUrl: string;
    phone: string;
    employmentHistory: Array<{
      jobStartDate: string;
      jobEndDate: string;
      company: string;
      jobTitle: string;
    }>;
    firstName: string;
    email: string;
    username: string;
  }
  
  