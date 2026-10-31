/**
 * ResuMatch Authentication & Session Manager
 * Client-side secure authentication engine with local persistence,
 * SHA-256 password hashing, user session handling, and CV data isolation.
 */

const USERS_STORAGE_KEY = 'resumatch_users_v1';
const SESSION_STORAGE_KEY = 'resumatch_session_v1';
const USER_RESUMES_PREFIX = 'resumatch_user_resumes_';
const USER_ACTIVE_CV_PREFIX = 'resumatch_user_cv_';
const USER_SETTINGS_PREFIX = 'resumatch_user_settings_';

// Pure JS SHA-256 implementation fallback to guarantee compatibility anywhere
function pureJsSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let composite = ascii + '\x80';
  while (composite[lengthProperty] % 64 - 56) composite += '\x00';
  for (i = 0; i < composite[lengthProperty]; i++) {
    j = composite.charCodeAt(i);
    if (j >> 8) return ''; // non-ascii
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const s = (w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0);

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + s) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export async function hashString(str) {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const buffer = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (e) {
    // Fall back to pure JS
  }
  return pureJsSha256(str);
}

function generateSalt() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateToken() {
  return 'rmt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 12);
}

// Internal Storage Helpers
function getAllUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error reading users from storage:', e);
    return {};
  }
}

function saveAllUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to storage:', e);
  }
}

const authListeners = new Set();

function emitAuthStateChanged(user) {
  authListeners.forEach(listener => {
    try {
      listener(user);
    } catch (e) {
      console.error('Auth state listener error:', e);
    }
  });
}

// Public Auth Service
export const AuthService = {
  /**
   * Initialize default demo user and verify session validity.
   */
  async init() {
    const users = getAllUsers();
    // Pre-create demo user if not present
    const demoEmail = 'demo@resumatch.io';
    if (!users[demoEmail]) {
      const salt = 'demo_salt_resumatch_9921';
      const passwordHash = await hashString('Password123!' + salt);
      users[demoEmail] = {
        id: 'usr_demo_001',
        name: 'Alex Morgan',
        email: demoEmail,
        salt,
        passwordHash,
        avatar: '',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      };
      saveAllUsers(users);

      // Pre-seed a sample resume for Demo User
      const demoResumesKey = USER_RESUMES_PREFIX + 'usr_demo_001';
      if (!localStorage.getItem(demoResumesKey)) {
        const sampleSnapshots = [
          {
            id: 'res_demo_01',
            name: 'Senior Growth & SEO Lead - Tech',
            jobTitle: 'Digital Marketing & SEO Lead',
            atsScore: 94,
            updatedAt: '2026-10-25T14:30:00.000Z',
            tags: ['SEO', 'Growth', 'Management']
          },
          {
            id: 'res_demo_02',
            name: 'Content & Acquisition Strategist',
            jobTitle: 'Content Marketing Manager',
            atsScore: 88,
            updatedAt: '2026-10-18T10:15:00.000Z',
            tags: ['Content', 'Organic', 'Funnel']
          }
        ];
        try {
          localStorage.setItem(demoResumesKey, JSON.stringify(sampleSnapshots));
        } catch(e) {}
      }
    }

    return this.getCurrentUser();
  },

  /**
   * Get currently authenticated user or null.
   */
  getCurrentUser() {
    let session = null;
    try {
      const rawSession = localStorage.getItem(SESSION_STORAGE_KEY) || sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (rawSession) {
        session = JSON.parse(rawSession);
      }
    } catch (e) {
      session = null;
    }

    if (!session || !session.userId) return null;

    // Verify user still exists in accounts store
    const users = getAllUsers();
    const user = Object.values(users).find(u => u.id === session.userId);
    if (!user) {
      this.logout();
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      createdAt: user.createdAt
    };
  },

  /**
   * Check if a user is currently logged in.
   */
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  /**
   * Log in with email and password.
   */
  async login(email, password, remember = true) {
    if (!email || !password) {
      throw new Error('Please enter both your email and password.');
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const users = getAllUsers();
    const user = users[cleanEmail];

    if (!user) {
      throw new Error('No account found with this email address.');
    }

    const testHash = await hashString(password + user.salt);
    if (testHash !== user.passwordHash) {
      throw new Error('Incorrect password. Please try again.');
    }

    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      token: generateToken(),
      loginTime: new Date().toISOString()
    };

    if (remember) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    const currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      createdAt: user.createdAt
    };

    emitAuthStateChanged(currentUser);
    return currentUser;
  },

  /**
   * Register a new account.
   */
  async signup(name, email, password, initialData = {}) {
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Please enter your full name (at least 2 characters).');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const users = getAllUsers();
    if (users[cleanEmail]) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const salt = generateSalt();
    const passwordHash = await hashString(password + salt);
    const userId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    const newUser = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      salt,
      passwordHash,
      avatar: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users[cleanEmail] = newUser;
    saveAllUsers(users);

    // Save initial CV data if passed (keeps current work on signup)
    if (initialData.cv) {
      try {
        localStorage.setItem(USER_ACTIVE_CV_PREFIX + userId, JSON.stringify(initialData.cv));
      } catch (e) {}
    }
    if (initialData.settings) {
      try {
        localStorage.setItem(USER_SETTINGS_PREFIX + userId, JSON.stringify(initialData.settings));
      } catch (e) {}
    }

    // Auto login
    const session = {
      userId,
      email: cleanEmail,
      name: cleanName,
      token: generateToken(),
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    const currentUser = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      avatar: '',
      createdAt: newUser.createdAt
    };

    emitAuthStateChanged(currentUser);
    return currentUser;
  },

  /**
   * Log out current user.
   */
  logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    emitAuthStateChanged(null);
    return true;
  },

  /**
   * Reset password for an email.
   */
  async resetPassword(email, newPassword) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const users = getAllUsers();
    const user = users[cleanEmail];
    if (!user) {
      throw new Error('No account found with this email address.');
    }

    const salt = generateSalt();
    user.salt = salt;
    user.passwordHash = await hashString(newPassword + salt);
    user.updatedAt = new Date().toISOString();

    saveAllUsers(users);
    return true;
  },

  /**
   * Update profile information (name, avatar).
   */
  updateProfile({ name, avatar }) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated.');

    const users = getAllUsers();
    const account = users[user.email.toLowerCase()];
    if (!account) throw new Error('User record not found.');

    if (name && name.trim().length >= 2) {
      account.name = name.trim();
    }
    if (avatar !== undefined) {
      account.avatar = avatar;
    }
    account.updatedAt = new Date().toISOString();
    saveAllUsers(users);

    // Update active session
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY) || sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (rawSession) {
      const s = JSON.parse(rawSession);
      s.name = account.name;
      if (localStorage.getItem(SESSION_STORAGE_KEY)) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s));
      } else {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(s));
      }
    }

    const updated = {
      id: account.id,
      name: account.name,
      email: account.email,
      avatar: account.avatar || '',
      createdAt: account.createdAt
    };

    emitAuthStateChanged(updated);
    return updated;
  },

  /**
   * Change password for logged-in user.
   */
  async changePassword(currentPassword, newPassword) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated.');

    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    const users = getAllUsers();
    const account = users[user.email.toLowerCase()];
    if (!account) throw new Error('Account not found.');

    const currentHash = await hashString(currentPassword + account.salt);
    if (currentHash !== account.passwordHash) {
      throw new Error('Current password is incorrect.');
    }

    const newSalt = generateSalt();
    account.salt = newSalt;
    account.passwordHash = await hashString(newPassword + newSalt);
    account.updatedAt = new Date().toISOString();
    saveAllUsers(users);
    return true;
  },

  /**
   * Delete account.
   */
  async deleteAccount(password) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated.');

    const users = getAllUsers();
    const account = users[user.email.toLowerCase()];
    if (!account) throw new Error('Account not found.');

    const testHash = await hashString(password + account.salt);
    if (testHash !== account.passwordHash) {
      throw new Error('Incorrect password. Account cannot be deleted.');
    }

    // Clear user data
    localStorage.removeItem(USER_ACTIVE_CV_PREFIX + account.id);
    localStorage.removeItem(USER_SETTINGS_PREFIX + account.id);
    localStorage.removeItem(USER_RESUMES_PREFIX + account.id);

    delete users[user.email.toLowerCase()];
    saveAllUsers(users);

    this.logout();
    return true;
  },

  /**
   * User Resumes & Snapshot management.
   */
  getUserResumes() {
    const user = this.getCurrentUser();
    if (!user) return [];
    try {
      const raw = localStorage.getItem(USER_RESUMES_PREFIX + user.id);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading saved resumes:', e);
      return [];
    }
  },

  saveResumeSnapshot(name, cv, job = '', score = 0, settings = {}) {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Please log in to save resumes to your profile.');

    const list = this.getUserResumes();
    const snapshot = {
      id: 'res_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      name: String(name || 'Tailored Resume').trim(),
      role: cv?.personal?.role || 'Resume',
      jobTitle: cv?.personal?.role || 'Adapted Role',
      atsScore: score,
      jobText: job,
      cvData: JSON.parse(JSON.stringify(cv)),
      settings: JSON.parse(JSON.stringify(settings || {})),
      updatedAt: new Date().toISOString()
    };

    list.unshift(snapshot);
    try {
      localStorage.setItem(USER_RESUMES_PREFIX + user.id, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save snapshot:', e);
      throw new Error('Storage limit reached or failed to save.');
    }

    return snapshot;
  },

  deleteResumeSnapshot(resumeId) {
    const user = this.getCurrentUser();
    if (!user) return false;

    let list = this.getUserResumes();
    list = list.filter(item => item.id !== resumeId);
    try {
      localStorage.setItem(USER_RESUMES_PREFIX + user.id, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  },

  saveUserActiveCv(cv) {
    const user = this.getCurrentUser();
    if (!user || !cv) return;
    try {
      localStorage.setItem(USER_ACTIVE_CV_PREFIX + user.id, JSON.stringify(cv));
    } catch (e) {}
  },

  getUserActiveCv() {
    const user = this.getCurrentUser();
    if (!user) return null;
    try {
      const raw = localStorage.getItem(USER_ACTIVE_CV_PREFIX + user.id);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  saveUserSettings(settings) {
    const user = this.getCurrentUser();
    if (!user || !settings) return;
    try {
      localStorage.setItem(USER_SETTINGS_PREFIX + user.id, JSON.stringify(settings));
    } catch (e) {}
  },

  getUserSettings() {
    const user = this.getCurrentUser();
    if (!user) return null;
    try {
      const raw = localStorage.getItem(USER_SETTINGS_PREFIX + user.id);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Subscribe to auth state changes.
   */
  onAuthStateChanged(callback) {
    authListeners.add(callback);
    return () => authListeners.delete(callback);
  }
};
