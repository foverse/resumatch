/**
 * Comprehensive Automated Test Suite for ResuMatch Authentication
 */

// Mock browser localStorage and sessionStorage for node test environment
class StorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, val) {
    this.store[key] = String(val);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new StorageMock();
globalThis.sessionStorage = new StorageMock();

import { AuthService } from './auth.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

async function runTests() {
  console.log('\n--- STARTING AUTH SERVICE TEST SUITE ---\n');

  // Test 1: Init & Demo User creation
  await AuthService.init();
  const demoUsersRaw = JSON.parse(localStorage.getItem('resumatch_users_v1'));
  assert(demoUsersRaw['demo@resumatch.io'] !== undefined, 'Demo user initialized in storage');
  assert(AuthService.isLoggedIn() === false, 'Initially logged out');

  // Test 2: Login validation - wrong password
  let errPass = null;
  try {
    await AuthService.login('demo@resumatch.io', 'WrongPassword!');
  } catch (e) {
    errPass = e;
  }
  assert(errPass !== null && errPass.message.includes('Incorrect password'), 'Rejects incorrect password');

  // Test 3: Login validation - nonexistent email
  let errEmail = null;
  try {
    await AuthService.login('nonexistent@resumatch.io', 'Password123!');
  } catch (e) {
    errEmail = e;
  }
  assert(errEmail !== null && errEmail.message.includes('No account found'), 'Rejects non-existent email');

  // Test 4: Successful login with Demo user
  const loggedInDemo = await AuthService.login('demo@resumatch.io', 'Password123!', true);
  assert(loggedInDemo.email === 'demo@resumatch.io', 'Logs in with demo user');
  assert(loggedInDemo.name === 'Alex Morgan', 'User name is Alex Morgan');
  assert(AuthService.isLoggedIn() === true, 'AuthService reports logged in');
  assert(AuthService.getCurrentUser().email === 'demo@resumatch.io', 'Current user session persisted');

  // Test 5: User snapshots / saved resumes for Demo user
  const demoResumes = AuthService.getUserResumes();
  assert(demoResumes.length >= 2, 'Pre-loaded demo resume versions exist');

  // Test 6: Save a new snapshot for demo user
  const newSnapshot = AuthService.saveResumeSnapshot('Senior SEO Strategist', {
    personal: { name: 'Alex Morgan', role: 'Head of Growth' }
  }, 'SEO Lead position', 92);
  assert(newSnapshot.name === 'Senior SEO Strategist', 'Snapshot saved with correct name');
  const updatedDemoResumes = AuthService.getUserResumes();
  assert(updatedDemoResumes.length === demoResumes.length + 1, 'Snapshot count increased');

  // Test 7: Delete a snapshot
  const deleted = AuthService.deleteResumeSnapshot(newSnapshot.id);
  assert(deleted === true, 'Snapshot deleted successfully');
  assert(AuthService.getUserResumes().length === demoResumes.length, 'Snapshot count restored');

  // Test 8: Logout
  AuthService.logout();
  assert(AuthService.isLoggedIn() === false, 'Successfully logged out');
  assert(AuthService.getCurrentUser() === null, 'Current user is null after logout');

  // Test 9: Sign up validation
  let errSignupName = null;
  try {
    await AuthService.signup('A', 'test@example.com', 'Pass1234');
  } catch (e) {
    errSignupName = e;
  }
  assert(errSignupName !== null && errSignupName.message.includes('at least 2 characters'), 'Validates name length');

  let errSignupEmail = null;
  try {
    await AuthService.signup('Valid Name', 'invalid-email', 'Pass1234');
  } catch (e) {
    errSignupEmail = e;
  }
  assert(errSignupEmail !== null && errSignupEmail.message.includes('valid email'), 'Validates email format');

  let errSignupPass = null;
  try {
    await AuthService.signup('Valid Name', 'valid@example.com', '123');
  } catch (e) {
    errSignupPass = e;
  }
  assert(errSignupPass !== null && errSignupPass.message.includes('at least 6 characters'), 'Validates password length');

  // Test 10: Successful signup & auto-login
  const newUser = await AuthService.signup('Sarah Connor', 'sarah@skynet.com', 'Cyberdyne2026!', {
    cv: { personal: { name: 'Sarah Connor', role: 'Resistance Leader' } },
    settings: { font: 15, template: 'slate' }
  });
  assert(newUser.email === 'sarah@skynet.com', 'New user registered');
  assert(AuthService.isLoggedIn() === true, 'New user automatically logged in');
  assert(AuthService.getUserActiveCv().personal.name === 'Sarah Connor', 'Initial CV stored for user');
  assert(AuthService.getUserSettings().template === 'slate', 'Initial settings stored for user');

  // Test 11: Duplicate email signup rejection
  let errDup = null;
  try {
    await AuthService.signup('Sarah C.', 'sarah@skynet.com', 'AnotherPassword');
  } catch (e) {
    errDup = e;
  }
  assert(errDup !== null && errDup.message.includes('already exists'), 'Rejects duplicate registration');

  // Test 12: Profile update
  const updatedProfile = AuthService.updateProfile({ name: 'Sarah J. Connor' });
  assert(updatedProfile.name === 'Sarah J. Connor', 'Profile name updated');
  assert(AuthService.getCurrentUser().name === 'Sarah J. Connor', 'Session name updated');

  // Test 13: Password change
  let wrongPassChange = null;
  try {
    await AuthService.changePassword('WrongOldPass', 'NewPass123456');
  } catch (e) {
    wrongPassChange = e;
  }
  assert(wrongPassChange !== null && wrongPassChange.message.includes('incorrect'), 'Rejects change with wrong old password');

  const changed = await AuthService.changePassword('Cyberdyne2026!', 'BrandNewSecret999!');
  assert(changed === true, 'Password changed successfully');

  // Logout and login with new password
  AuthService.logout();
  const reLogged = await AuthService.login('sarah@skynet.com', 'BrandNewSecret999!');
  assert(reLogged.email === 'sarah@skynet.com', 'Logged in with updated password');

  // Test 14: Password reset
  await AuthService.resetPassword('sarah@skynet.com', 'ResetPass777!');
  AuthService.logout();
  const loginAfterReset = await AuthService.login('sarah@skynet.com', 'ResetPass777!');
  assert(loginAfterReset.email === 'sarah@skynet.com', 'Logged in with reset password');

  // Test 15: Data isolation between users
  // Demo user has 2 resumes, Sarah has 0 resumes
  const sarahResumes = AuthService.getUserResumes();
  assert(sarahResumes.length === 0, 'New user has clean isolated resume list');

  // Add resume for Sarah
  AuthService.saveResumeSnapshot('Resistance Resume', { personal: { name: 'Sarah' } });
  assert(AuthService.getUserResumes().length === 1, 'Sarah has 1 resume');

  // Switch to Demo user and verify demo resumes are intact and isolated
  await AuthService.login('demo@resumatch.io', 'Password123!');
  assert(AuthService.getUserResumes().length === 2, 'Demo resumes isolated from Sarah');

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
