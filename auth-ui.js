/**
 * ResuMatch Authentication UI Component
 * Provides topbar login pill, modals for sign in/up, password reset,
 * user profile dropdown, saved resumes drawer, and settings.
 */

import { AuthService } from './auth.js';

let appCallbacks = {
  onLogin: () => {},
  onLogout: () => {},
  onLoadResume: (cvData, settings) => {},
  getCurrentCvData: () => null,
  getCurrentSettings: () => ({}),
  getCurrentScore: () => 0,
  showToast: (msg) => {}
};

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

export const AuthUI = {
  init(callbacks = {}) {
    appCallbacks = { ...appCallbacks, ...callbacks };
    this.ensureModalsInDom();
    this.bindGlobalEvents();

    AuthService.onAuthStateChanged(user => {
      this.renderTopbarWidget();
    });

    this.renderTopbarWidget();
  },

  /**
   * Render or update the Topbar user widget.
   */
  renderTopbarWidget() {
    const container = document.querySelector('#auth-topbar-widget');
    if (!container) return;

    const user = AuthService.getCurrentUser();

    if (!user) {
      container.innerHTML = `
        <button class="auth-login-btn" id="auth-open-login" title="Sign in or create account to save your CVs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Log In</span>
        </button>
      `;
      container.querySelector('#auth-open-login')?.addEventListener('click', () => {
        this.openAuthModal('login');
      });
      return;
    }

    const savedResumes = AuthService.getUserResumes();
    const initials = getInitials(user.name);

    container.innerHTML = `
      <div class="auth-user-pill" id="auth-user-menu-trigger" title="${escapeHtml(user.name)} (${escapeHtml(user.email)})">
        <div class="auth-user-avatar">
          ${user.avatar ? `<img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.name)}" />` : initials}
        </div>
        <span class="auth-user-name">${escapeHtml(user.name.split(' ')[0])}</span>
        <span class="auth-status-dot" title="Connected"></span>
        <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <div class="auth-dropdown-menu" id="auth-user-dropdown">
        <div class="auth-dropdown-header">
          <div class="auth-dropdown-fullname">${escapeHtml(user.name)}</div>
          <div class="auth-dropdown-email">${escapeHtml(user.email)}</div>
        </div>

        <button class="auth-dropdown-item" id="auth-menu-saved">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <span>My Saved CVs</span>
          <span class="badge" id="auth-saved-count">${savedResumes.length}</span>
        </button>

        <button class="auth-dropdown-item" id="auth-menu-snapshot">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>Save Current CV</span>
        </button>

        <button class="auth-dropdown-item" id="auth-menu-settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>Account Settings</span>
        </button>

        <div class="auth-dropdown-divider"></div>

        <button class="auth-dropdown-item logout" id="auth-menu-logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    `;

    const pill = container.querySelector('#auth-user-menu-trigger');
    const dropdown = container.querySelector('#auth-user-dropdown');

    pill?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('show');
      dropdown.classList.toggle('show', !isOpen);
      pill.classList.toggle('active', !isOpen);
    });

    container.querySelector('#auth-menu-saved')?.addEventListener('click', () => {
      dropdown.classList.remove('show');
      pill.classList.remove('active');
      this.openSavedResumesModal();
    });

    container.querySelector('#auth-menu-snapshot')?.addEventListener('click', () => {
      dropdown.classList.remove('show');
      pill.classList.remove('active');
      this.openSavedResumesModal(true);
    });

    container.querySelector('#auth-menu-settings')?.addEventListener('click', () => {
      dropdown.classList.remove('show');
      pill.classList.remove('active');
      this.openAccountSettingsModal();
    });

    container.querySelector('#auth-menu-logout')?.addEventListener('click', () => {
      dropdown.classList.remove('show');
      pill.classList.remove('active');
      AuthService.logout();
      appCallbacks.showToast('Logged out successfully.');
      appCallbacks.onLogout();
    });
  },

  /**
   * Inject Modals into DOM if not already present.
   */
  ensureModalsInDom() {
    if (document.querySelector('#auth-modals-root')) return;

    const root = document.createElement('div');
    root.id = 'auth-modals-root';
    root.innerHTML = `
      <!-- Main Auth Modal (Login / Sign Up / Forgot Password) -->
      <div class="auth-modal-backdrop" id="auth-modal">
        <div class="auth-modal-card">
          <button class="auth-modal-close" data-close-modal="auth-modal">&times;</button>
          
          <div class="auth-modal-header">
            <div class="auth-modal-icon">RM</div>
            <h2 class="auth-modal-title" id="auth-modal-heading">Welcome to ResuMatch</h2>
            <p class="auth-modal-subtitle" id="auth-modal-subheading">Log in to save your tailored resumes and manage profiles</p>
          </div>

          <!-- Quick 1-Click Demo Login Banner -->
          <div class="auth-demo-banner" id="auth-demo-banner">
            <div class="auth-demo-text">
              <strong>Need a quick test?</strong>
              Log in with our pre-loaded Demo Account
            </div>
            <button class="auth-demo-btn" id="auth-quick-demo-btn">⚡ 1-Click Demo</button>
          </div>

          <!-- Tabs -->
          <div class="auth-tabs" id="auth-tab-buttons">
            <button class="auth-tab-btn active" data-auth-tab="login">Log In</button>
            <button class="auth-tab-btn" data-auth-tab="signup">Create Account</button>
          </div>

          <div id="auth-alert-box"></div>

          <!-- LOGIN FORM -->
          <form id="auth-login-form">
            <div class="auth-form-group">
              <label class="auth-form-label" for="login-email">Email Address</label>
              <input class="auth-input" id="login-email" type="email" placeholder="name@example.com" required autocomplete="email" />
            </div>

            <div class="auth-form-group">
              <div class="auth-form-label">
                <label for="login-password">Password</label>
                <a id="auth-forgot-link">Forgot password?</a>
              </div>
              <div class="auth-input-wrapper">
                <input class="auth-input" id="login-password" type="password" placeholder="••••••••" required autocomplete="current-password" />
                <button type="button" class="auth-password-toggle" data-toggle-pass="login-password" title="Toggle password visibility">
                  👁
                </button>
              </div>
            </div>

            <label class="auth-checkbox-row">
              <input type="checkbox" id="login-remember" checked />
              <span>Remember me on this browser</span>
            </label>

            <button type="submit" class="auth-submit-btn" id="login-submit-btn">
              <span>Log In</span>
            </button>
          </form>

          <!-- SIGNUP FORM -->
          <form id="auth-signup-form" style="display:none;">
            <div class="auth-form-group">
              <label class="auth-form-label" for="signup-name">Full Name</label>
              <input class="auth-input" id="signup-name" type="text" placeholder="e.g. Alex Morgan" required autocomplete="name" />
            </div>

            <div class="auth-form-group">
              <label class="auth-form-label" for="signup-email">Email Address</label>
              <input class="auth-input" id="signup-email" type="email" placeholder="name@example.com" required autocomplete="email" />
            </div>

            <div class="auth-form-group">
              <label class="auth-form-label" for="signup-password">Password (min 6 characters)</label>
              <div class="auth-input-wrapper">
                <input class="auth-input" id="signup-password" type="password" placeholder="••••••••" required minlength="6" autocomplete="new-password" />
                <button type="button" class="auth-password-toggle" data-toggle-pass="signup-password" title="Toggle password visibility">
                  👁
                </button>
              </div>
            </div>

            <label class="auth-checkbox-row">
              <input type="checkbox" id="signup-import-current" checked />
              <span>Keep my current resume changes in my new account</span>
            </label>

            <button type="submit" class="auth-submit-btn" id="signup-submit-btn">
              <span>Create Account</span>
            </button>
          </form>

          <!-- FORGOT PASSWORD FORM -->
          <form id="auth-forgot-form" style="display:none;">
            <p style="font-size:12px; color:#5f6b7c; margin:0 0 14px; line-height:1.4;">
              Enter your account email and choose a new password to instantly reset your login.
            </p>

            <div class="auth-form-group">
              <label class="auth-form-label" for="forgot-email">Account Email</label>
              <input class="auth-input" id="forgot-email" type="email" placeholder="name@example.com" required />
            </div>

            <div class="auth-form-group">
              <label class="auth-form-label" for="forgot-new-password">New Password</label>
              <input class="auth-input" id="forgot-new-password" type="password" placeholder="Min 6 characters" required minlength="6" />
            </div>

            <button type="submit" class="auth-submit-btn" style="margin-top:10px;">
              <span>Update Password</span>
            </button>

            <div style="text-align:center; margin-top:14px;">
              <a id="forgot-back-to-login" style="font-size:11.5px; color:#6655d9; font-weight:700; cursor:pointer;">
                ← Back to Log In
              </a>
            </div>
          </form>
        </div>
      </div>

      <!-- Saved Resumes Modal -->
      <div class="auth-modal-backdrop" id="saved-resumes-modal">
        <div class="auth-modal-card" style="max-width:540px;">
          <button class="auth-modal-close" data-close-modal="saved-resumes-modal">&times;</button>
          
          <div class="saved-resumes-header">
            <div>
              <h2 class="auth-modal-title" style="font-size:19px;">My Saved Resumes</h2>
              <p class="auth-modal-subtitle">Switch between your tailored CV versions or save new snapshots</p>
            </div>
          </div>

          <div class="saved-resumes-list" id="saved-resumes-container"></div>

          <div class="snapshot-save-box">
            <label class="snapshot-save-label" for="new-snapshot-name">Save Current CV as New Version</label>
            <div class="snapshot-input-row">
              <input id="new-snapshot-name" type="text" placeholder="e.g. Senior Growth Lead - Stripe" />
              <button id="save-current-snapshot-btn">Save Version</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Settings Modal -->
      <div class="auth-modal-backdrop" id="account-settings-modal">
        <div class="auth-modal-card" style="max-width:460px;">
          <button class="auth-modal-close" data-close-modal="account-settings-modal">&times;</button>
          
          <div class="auth-modal-header" style="text-align:left; margin-bottom:18px;">
            <h2 class="auth-modal-title" style="font-size:19px;">Account Settings</h2>
            <p class="auth-modal-subtitle">Manage your personal profile and security</p>
          </div>

          <div id="settings-alert-box"></div>

          <!-- Edit Profile -->
          <form id="settings-profile-form" style="margin-bottom:22px; padding-bottom:18px; border-bottom:1px solid #edf2f6;">
            <div class="auth-form-group">
              <label class="auth-form-label" for="settings-name">Full Name</label>
              <input class="auth-input" id="settings-name" type="text" required />
            </div>
            <div class="auth-form-group">
              <label class="auth-form-label" for="settings-email">Email Address</label>
              <input class="auth-input" id="settings-email" type="email" disabled style="background:#f4f6fa; cursor:not-allowed;" />
            </div>
            <button type="submit" class="auth-submit-btn" style="background:#17687a;">Save Profile Changes</button>
          </form>

          <!-- Change Password -->
          <form id="settings-password-form">
            <h3 style="font-size:13px; font-weight:800; color:#18304c; margin:0 0 12px;">Change Password</h3>
            <div class="auth-form-group">
              <label class="auth-form-label" for="settings-cur-pass">Current Password</label>
              <input class="auth-input" id="settings-cur-pass" type="password" required />
            </div>
            <div class="auth-form-group">
              <label class="auth-form-label" for="settings-new-pass">New Password (min 6 characters)</label>
              <input class="auth-input" id="settings-new-pass" type="password" required minlength="6" />
            </div>
            <button type="submit" class="auth-submit-btn" style="background:#6655d9;">Update Password</button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(root);
  },

  /**
   * Bind event listeners for modals, forms, and tabs.
   */
  bindGlobalEvents() {
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#auth-topbar-widget')) {
        const dropdown = document.querySelector('#auth-user-dropdown');
        const pill = document.querySelector('#auth-user-menu-trigger');
        if (dropdown) dropdown.classList.remove('show');
        if (pill) pill.classList.remove('active');
      }
    });

    // Close modals via close button or backdrop click
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) {
        const modalId = closeBtn.dataset.closeModal;
        document.getElementById(modalId)?.classList.remove('open');
      }

      if (e.target.classList.contains('auth-modal-backdrop')) {
        e.target.classList.remove('open');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.auth-modal-backdrop.open').forEach(modal => {
          modal.classList.remove('open');
        });
        const dropdown = document.querySelector('#auth-user-dropdown');
        const pill = document.querySelector('#auth-user-menu-trigger');
        if (dropdown) dropdown.classList.remove('show');
        if (pill) pill.classList.remove('active');
      }
    });

    // Toggle password fields
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-toggle-pass]');
      if (!btn) return;
      const targetInput = document.getElementById(btn.dataset.togglePass);
      if (targetInput) {
        const isPass = targetInput.type === 'password';
        targetInput.type = isPass ? 'text' : 'password';
        btn.textContent = isPass ? '🔒' : '👁';
      }
    });

    // Auth Modal Tab switching
    document.querySelectorAll('[data-auth-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchAuthTab(btn.dataset.authTab);
      });
    });

    // Forgot password flow
    document.querySelector('#auth-forgot-link')?.addEventListener('click', () => {
      this.switchAuthTab('forgot');
    });

    document.querySelector('#forgot-back-to-login')?.addEventListener('click', () => {
      this.switchAuthTab('login');
    });

    // Fast 1-Click Demo Login
    document.querySelector('#auth-quick-demo-btn')?.addEventListener('click', async () => {
      const emailInput = document.querySelector('#login-email');
      const passInput = document.querySelector('#login-password');
      if (emailInput && passInput) {
        emailInput.value = 'demo@resumatch.io';
        passInput.value = 'Password123!';
      }
      await this.handleLogin('demo@resumatch.io', 'Password123!', true);
    });

    // Login Form Submit
    document.querySelector('#auth-login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.querySelector('#login-email')?.value;
      const password = document.querySelector('#login-password')?.value;
      const remember = document.querySelector('#login-remember')?.checked;
      await this.handleLogin(email, password, remember);
    });

    // Signup Form Submit
    document.querySelector('#auth-signup-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.querySelector('#signup-name')?.value;
      const email = document.querySelector('#signup-email')?.value;
      const password = document.querySelector('#signup-password')?.value;
      const keepCurrent = document.querySelector('#signup-import-current')?.checked;

      const submitBtn = document.querySelector('#signup-submit-btn');
      this.clearAlert('auth-alert-box');

      try {
        if (submitBtn) submitBtn.disabled = true;
        const initialData = {};
        if (keepCurrent) {
          initialData.cv = appCallbacks.getCurrentCvData();
          initialData.settings = appCallbacks.getCurrentSettings();
        }

        const user = await AuthService.signup(name, email, password, initialData);
        this.closeAllModals();
        appCallbacks.showToast(`Welcome to ResuMatch, ${user.name.split(' ')[0]}!`);
        appCallbacks.onLogin(user);
      } catch (err) {
        this.showAlert('auth-alert-box', err.message, 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    // Forgot Password Form Submit
    document.querySelector('#auth-forgot-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.querySelector('#forgot-email')?.value;
      const newPass = document.querySelector('#forgot-new-password')?.value;
      this.clearAlert('auth-alert-box');

      try {
        await AuthService.resetPassword(email, newPass);
        this.showAlert('auth-alert-box', 'Password updated successfully! You can now log in.', 'success');
        setTimeout(() => {
          this.switchAuthTab('login');
          const emailInput = document.querySelector('#login-email');
          if (emailInput) emailInput.value = email;
        }, 1200);
      } catch (err) {
        this.showAlert('auth-alert-box', err.message, 'error');
      }
    });

    // Save current snapshot button inside saved resumes modal
    document.querySelector('#save-current-snapshot-btn')?.addEventListener('click', () => {
      const input = document.querySelector('#new-snapshot-name');
      const name = input?.value?.trim() || 'Tailored Resume';
      const cv = appCallbacks.getCurrentCvData();
      const settings = appCallbacks.getCurrentSettings();
      const score = appCallbacks.getCurrentScore();

      try {
        AuthService.saveResumeSnapshot(name, cv, '', score, settings);
        if (input) input.value = '';
        this.renderSavedResumesList();
        this.renderTopbarWidget();
        appCallbacks.showToast(`Saved snapshot "${name}" to your profile.`);
      } catch (e) {
        appCallbacks.showToast(e.message || 'Error saving resume');
      }
    });

    // Profile Settings Form
    document.querySelector('#settings-profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.querySelector('#settings-name')?.value;
      try {
        AuthService.updateProfile({ name });
        this.showAlert('settings-alert-box', 'Profile name updated successfully.', 'success');
        appCallbacks.showToast('Profile updated.');
      } catch (err) {
        this.showAlert('settings-alert-box', err.message, 'error');
      }
    });

    // Password Settings Form
    document.querySelector('#settings-password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const curPass = document.querySelector('#settings-cur-pass')?.value;
      const newPass = document.querySelector('#settings-new-pass')?.value;
      try {
        await AuthService.changePassword(curPass, newPass);
        this.showAlert('settings-alert-box', 'Password changed successfully.', 'success');
        document.querySelector('#settings-cur-pass').value = '';
        document.querySelector('#settings-new-pass').value = '';
        appCallbacks.showToast('Password updated.');
      } catch (err) {
        this.showAlert('settings-alert-box', err.message, 'error');
      }
    });
  },

  async handleLogin(email, password, remember) {
    const submitBtn = document.querySelector('#login-submit-btn');
    this.clearAlert('auth-alert-box');

    try {
      if (submitBtn) submitBtn.disabled = true;
      const user = await AuthService.login(email, password, remember);
      this.closeAllModals();
      appCallbacks.showToast(`Welcome back, ${user.name.split(' ')[0]}!`);
      appCallbacks.onLogin(user);
    } catch (err) {
      this.showAlert('auth-alert-box', err.message, 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  },

  openAuthModal(initialTab = 'login') {
    this.ensureModalsInDom();
    this.clearAlert('auth-alert-box');
    this.switchAuthTab(initialTab);
    const modal = document.querySelector('#auth-modal');
    modal?.classList.add('open');

    setTimeout(() => {
      if (initialTab === 'login') {
        document.querySelector('#login-email')?.focus();
      } else if (initialTab === 'signup') {
        document.querySelector('#signup-name')?.focus();
      }
    }, 150);
  },

  switchAuthTab(tab) {
    const loginForm = document.querySelector('#auth-login-form');
    const signupForm = document.querySelector('#auth-signup-form');
    const forgotForm = document.querySelector('#auth-forgot-form');
    const tabButtons = document.querySelectorAll('[data-auth-tab]');
    const demoBanner = document.querySelector('#auth-demo-banner');
    const heading = document.querySelector('#auth-modal-heading');
    const subheading = document.querySelector('#auth-modal-subheading');

    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.authTab === tab);
    });

    this.clearAlert('auth-alert-box');

    if (tab === 'login') {
      if (loginForm) loginForm.style.display = 'block';
      if (signupForm) signupForm.style.display = 'none';
      if (forgotForm) forgotForm.style.display = 'none';
      if (demoBanner) demoBanner.style.display = 'flex';
      if (heading) heading.textContent = 'Welcome Back';
      if (subheading) subheading.textContent = 'Log in to access your tailored CVs and application history';
    } else if (tab === 'signup') {
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'block';
      if (forgotForm) forgotForm.style.display = 'none';
      if (demoBanner) demoBanner.style.display = 'none';
      if (heading) heading.textContent = 'Create Free Account';
      if (subheading) subheading.textContent = 'Save unlimited resume variations and sync your profiles';
    } else if (tab === 'forgot') {
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'none';
      if (forgotForm) forgotForm.style.display = 'block';
      if (demoBanner) demoBanner.style.display = 'none';
      if (heading) heading.textContent = 'Reset Password';
      if (subheading) subheading.textContent = 'Choose a new password for your account';
    }
  },

  openSavedResumesModal(focusInput = false) {
    this.ensureModalsInDom();
    this.renderSavedResumesList();
    const modal = document.querySelector('#saved-resumes-modal');
    modal?.classList.add('open');

    if (focusInput) {
      setTimeout(() => {
        document.querySelector('#new-snapshot-name')?.focus();
      }, 150);
    }
  },

  renderSavedResumesList() {
    const container = document.querySelector('#saved-resumes-container');
    if (!container) return;

    const resumes = AuthService.getUserResumes();
    if (!resumes || resumes.length === 0) {
      container.innerHTML = `
        <div class="saved-resume-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <div style="font-weight:700; color:#30465e; margin-bottom:4px;">No saved resumes yet</div>
          <p style="font-size:11.5px; margin:0;">Save your current CV using the form below to create your first version snapshot.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = resumes.map(res => {
      const dateFormatted = res.updatedAt ? new Date(res.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Recently';

      return `
        <div class="saved-resume-card" data-resume-id="${res.id}">
          <div class="saved-resume-info">
            <h4 class="saved-resume-title">${escapeHtml(res.name)}</h4>
            <div class="saved-resume-meta">
              <span>${escapeHtml(res.role || res.jobTitle || 'Resume')}</span>
              <span>•</span>
              <span>${dateFormatted}</span>
              ${res.atsScore ? `<span class="saved-resume-score">${res.atsScore}% ATS</span>` : ''}
            </div>
          </div>
          <div class="saved-resume-actions">
            <button class="saved-action-btn load" data-load-id="${res.id}" title="Load this version into editor">Load</button>
            <button class="saved-action-btn delete" data-delete-id="${res.id}" title="Delete version">&times;</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach actions
    container.querySelectorAll('[data-load-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.loadId;
        const target = resumes.find(r => r.id === id);
        if (target && target.cvData) {
          appCallbacks.onLoadResume(target.cvData, target.settings || {});
          this.closeAllModals();
          appCallbacks.showToast(`Loaded version "${target.name}".`);
        }
      });
    });

    container.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deleteId;
        if (confirm('Are you sure you want to delete this saved version?')) {
          AuthService.deleteResumeSnapshot(id);
          this.renderSavedResumesList();
          this.renderTopbarWidget();
          appCallbacks.showToast('Version deleted.');
        }
      });
    });
  },

  openAccountSettingsModal() {
    this.ensureModalsInDom();
    this.clearAlert('settings-alert-box');

    const user = AuthService.getCurrentUser();
    if (!user) return;

    const nameInput = document.querySelector('#settings-name');
    const emailInput = document.querySelector('#settings-email');

    if (nameInput) nameInput.value = user.name;
    if (emailInput) emailInput.value = user.email;

    const modal = document.querySelector('#account-settings-modal');
    modal?.classList.add('open');
  },

  closeAllModals() {
    document.querySelectorAll('.auth-modal-backdrop.open').forEach(m => m.classList.remove('open'));
  },

  showAlert(containerId, message, type = 'error') {
    const box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = `
      <div class="auth-alert ${type}">
        <span>${type === 'error' ? '⚠️' : '✓'}</span>
        <span>${escapeHtml(message)}</span>
      </div>
    `;
  },

  clearAlert(containerId) {
    const box = document.getElementById(containerId);
    if (box) box.innerHTML = '';
  }
};
