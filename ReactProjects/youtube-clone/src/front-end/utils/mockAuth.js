// Mock authentication for demo purposes
class MockAuth {
  constructor() {
    this.currentUser = null;
    this.loadUser();
  }

  loadUser() {
    const savedUser = localStorage.getItem('mockUser');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  }

  saveUser(user) {
    this.currentUser = user;
    localStorage.setItem('mockUser', JSON.stringify(user));
  }

  clearUser() {
    this.currentUser = null;
    localStorage.removeItem('mockUser');
  }

  async signInWithPassword({ email, password }) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Accept any email/password for demo purposes
    const mockUser = {
      id: 'demo-user-' + Date.now(),
      email: email,
      user_metadata: {
        email: email,
        username: email.split('@')[0]
      },
      created_at: new Date().toISOString()
    };

    this.saveUser(mockUser);

    return {
      data: {
        user: mockUser,
        session: {
          access_token: 'mock-token-' + Date.now(),
          refresh_token: 'mock-refresh-token'
        }
      },
      error: null
    };
  }

  async signUp({ email, password, options }) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockUser = {
      id: 'demo-user-' + Date.now(),
      email: email,
      user_metadata: {
        email: email,
        username: options?.data?.username || email.split('@')[0],
        ...options?.data
      },
      created_at: new Date().toISOString()
    };

    this.saveUser(mockUser);

    return {
      data: {
        user: mockUser,
        session: {
          access_token: 'mock-token-' + Date.now(),
          refresh_token: 'mock-refresh-token'
        }
      },
      error: null
    };
  }

  async getUser() {
    return {
      data: {
        user: this.currentUser
      },
      error: this.currentUser ? null : { message: 'Not authenticated' }
    };
  }

  async signOut() {
    this.clearUser();
    return { error: null };
  }
}

export const mockAuth = new MockAuth();
