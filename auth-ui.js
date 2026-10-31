/**
 * ResuMatch Authentication UI Component
 * Anti-slop, clean typography, SVG-based affordances with zero emojis.
 * Follows design-taste-frontend house rules.
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

const SVG_ICONS = {
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  chevron: `<svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  document: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
  save: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0 2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`,
  error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"></circle><polyline points="9 12 11 14 15 10"></polyline></svg>`
};

export const AuthUI = {
  init(callbacks = {}) {
    appCallbacks = { ...appCallbacks, ...callbacks };
    this.ensureModalsInDom();
    this.bindGlobalEvents();

    AuthService.onAuthStateChanged(() => {
      this.renderTopbarWidget();
    });

    this.renderTopbarWidget();
  },

  renderTopbarWidget() {
    const container = document.querySelector('#auth-topbar-widget');
    if (!container) return;

    const user = AuthService.getCurrentUser();

    if (!user) {
      container.innerHTML = `
        <button class="auth-login-btn" id="auth-open-login" type="button">
          ${SVG_ICONS.user}
          <span>Log in</span>
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
      <div class="auth-user-pill" id="auth-user-menu-trigger" role="button" aria-haspopup="true" aria-expanded="false" title="${escapeHtml(user.name)} (${escapeHtml(user.email)})">
        <div class="auth-user-avatar">
          ${user.avatar ? `<img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.name)}" />` : initials}
        </div>
        <span class="auth-user-name">${escapeHtml(user.name.split(' ')[0])}</span>
        <span class="auth-status-dot" aria-hidden="true"></span>
        ${SVG_ICONS.chevron}
      </div>

      <div class="auth-dropdown-menu" id="auth-user-dropdown" role="menu">
        <div class="auth-dropdown-header">
          <div class="auth-dropdown-fullname">${escapeHtml(user.name)}</div>
          <div class="auth-dropdown-email">${escapeHtml(user.email)}</div>
        </div>

        <button class="auth-dropdown-item" id="auth-menu-saved" type="button" role="menuitem">
          ${SVG_ICONS.document}
          <span>Saved resumes</span>
          <span class="badge" id="auth-saved-count">${savedResumes.length}</span>
        </button>

        <button class="auth-dropdown-item" id="auth-menu-snapshot" type="button" role="menuitem">
          ${SVG_ICONS.save}
          <span>Save current version</span>
        </button>

        <button class="auth-dropdown-item" id="auth-menu-settings" type="button" role="menuitem">
          ${SVG_ICONS.settings}
          <span>Account settings</span>
        </button>

        <div class="auth-dropdown-divider" role="separator"></div>

        <button class="auth-dropdown-item logout" id="auth-menu-logout" type="button" role="menuitem">
          ${SVG_ICONS.logout}
          <span>Log out</span>
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
      pill.setAttribute('aria-expanded', String(!isOpen));
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
      appCallbacks.showToast('Logged out.');
      appCallbacks.onLogout();
    });
  },

  ensureModalsInDom() {
    if (document.querySelector('#auth-modals-root')) return;

    const root = document.createElement('div');
    root.id = 'auth-modals-root';
    root.innerHTML = `
      <!-- Main Auth Modal (Login / Sign Up / Forgot Password) -->
      <div class="auth-modal-backdrop" id="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-heading">
        <div class="auth-modal-card">
          <button class="auth-modal-close" data-close-modal="auth-modal" type="button" aria-label="Close dialog">
            ${SVG_ICONS.close}
          </button>
          
          <div class="auth-modal-header">
            <h2 class="auth-modal-title" id="auth-modal-heading">Log in</h2>
            <p class="auth-modal-subtitle" id="auth-modal-subheading">Access your saved resumes and settings.</p>
          </div>

          <!-- Tabs -->
          <div class="auth-tabs" id="auth-tab-buttons" role="tablist">
            <button class="auth-tab-btn active" data-auth-tab="login" role="tab" type="button">Log in</button>
            <button class="auth-tab-btn" data-auth-tab="signup" role="tab" type="button">Create account</button>
          </div>

          <!-- Demo Account Helper -->
          <div class="auth-demo-row" id="auth-demo-banner">
            <button class="auth-demo-btn" id="auth-quick-demo-btn" type="button">
              Fill demo account (Alex Morgan)
            </button>
          </div>

          <div id="auth-alert-box"></div>

          <!-- LOGIN FORM -->
          <form id="auth-login-form">
            <div class="auth-form-group">
              <label class="auth-form-label" for="login-email">Email address</label>
              <input class="auth-input" id="login-email" type="email" placeholder="name@example.com" required autocomplete="email" />
            </div>

            <div class="auth-form-group">
              <div class="auth-form-label">
                <label for="login-password">Password</label>
                <button type="button" class="auth-text-link" id="auth-forgot-link">Forgot password?</button>
              </div>
              <div class="auth-input-wrapper">
                <input class="auth-input" id="login-password" type="password" placeholder="••••••••" required autocomplete="current-password" />
                <button type="button" class="auth-password-toggle" data-toggle-pass="login-password" aria-label="Show password">
                  ${SVG_ICONS.eye}
                </button>
              </div>
            </div>

            <label class="auth-checkbox-row">
              <input type="checkbox" id="login-remember" checked />
              <span>Keep me logged in on this browser</span>
            </label>

            <button type="submit" class="auth-submit-btn" id="login-submit-btn">
              <span>Log in</span>
            </button>
          </form>

          <!-- SIGNUP FORM -->
          <form id="auth-signup-form" style="display:none;">
            <div class="auth-form-group">
              <label class="auth-form-label" for="signup-name">Full name</label>
              <input class="auth-input" id="signup-name" type="text" placeholder="Alex Morgan" required autocomplete="name" />
            </div>

            <div class="auth-form-group">
              <label class="auth-form-label" for="signup-email">Email address</label>
              <input class="auth-input" id="signup-email" type="email" placeholder="name@example.com" required autocomplete="email" />
            </div>

            <div class="auth-form-group">
              <label class="auth-form-label" for="signup-password">Password (minimum 6 characters)</label>
              <div class="auth-input-wrapper">
                <input class="auth-input" id="signup-password" type="password" placeholder="••••••••" required minlength="6" autocomplete="new-password" />
                <button type="button" class="auth-password-toggle" data-toggle-pass="signup-password" aria-label="Show password">
                  ${SVG_ICONS.eye}
                </button>
              </div>
            </div>

            <label class="auth-checkbox-row">
              <input type="checkbox" id="signup-import-current" checked />
              <span>Save current resume into new account</span>
            </label>

            <button type="submit" class="auth-submit-btn" id="signup-submit-btn">
              <span>Create account</span>
            </button>
          </form>

          <!-- FORGOT PASSWORD FORM -->
          <form id="auth-forgot-form" style="display:none;">
            <p style="font-size:12.5px; color:#64748b; margin:0 0 14px; line-height:1.45;">
              Enter your account email and choose a new password.
            </p>

            <div class="auth-form-group">
              <label class="auth-form-label" for="forgot-email">Account email</label>
              <input class="auth-input" id="forgot-email" type="email" placeholder="name@example.com" required />
            </div>

            <div class="auth-form-group">
              <label class="auth-form-label" for="forgot-new-password">New password</label>
              <input class="auth-input" id="forgot-new-password" type="password" placeholder="Minimum 6 characters" required minlength="6" />
            </div>

            <button type="submit" class="auth-submit-btn" style="margin-top:10px;">
              <span>Update password</span>
            </button>

            <div style="text-align:center; margin-top:14px;">
              <button type="button" class="auth-text-link" id="forgot-back-to-login">
                Return to log in
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Saved Resumes Modal -->
      <div class="auth-modal-backdrop" id="saved-resumes-modal" role="dialog" aria-modal="true" aria-labelledby="saved-resumes-heading">
        <div class="auth-modal-card" style="max-width:520px;">
          <button class="auth-modal-close" data-close-modal="saved-resumes-modal" type="button" aria-label="Close dialog">
            ${SVG_ICONS.close}
          </button>
          
          <div class="saved-resumes-header">
            <div>
              <h2 class="auth-modal-title" id="saved-resumes-heading" style="font-size:18px;">Saved resumes</h2>
              <p class="auth-modal-subtitle">Switch between versions or save a snapshot of the current CV.</p>
            </div>
          </div>

          <div class="saved-resumes-list" id="saved-resumes-container"></div>

          <div class="snapshot-save-box">
            <label class="snapshot-save-label" for="new-snapshot-name">Save current CV as version</label>
            <div class="snapshot-input-row">
              <input id="new-snapshot-name" type="text" placeholder="e.g. Lead Product Manager" />
              <button id="save-current-snapshot-btn" type="button">Save version</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Settings Modal -->
      <div class="auth-modal-backdrop" id="account-settings-modal" role="dialog" aria-modal="true" aria-labelledby="account-settings-heading">
        <div class="auth-modal-card" style="max-width:440px;">
          <button class="auth-modal-close" data-close-modal="account-settings-modal" type="button" aria-label="Close dialog">
            ${SVG_ICONS.close}
          </button>
          
          <div class="auth-modal-header" style="text-align:left; margin-bottom:18px;">
            <h2 class="auth-modal-title" id="account-settings-heading" style="font-size:18px;">Account settings</h2>
            <p class="auth-modal-subtitle">Update your profile name or change your password.</p>
          </div>

          <div id="settings-alert-box"></div>

          <!-- Edit Profile -->
          <form id="settings-profile-form" style="margin-bottom:20px; padding-bottom:16px;">
            <div class="auth-form-group">
              <label class="auth-form-label" for="settings-name">Full name</label>
              <input class="auth-input" id="settings-name" type="text" required />
            </div>
            <div class="auth-form-group">
              <label class="auth-form-label" for="settings-email">Email address</label>
              <input class="auth-input" id="settings-email" type="email" disabled style="background:#f8fafc; color:#64748b; cursor:not-allowed;" />
            </div>
            <button type="submit" class="auth-submit-btn secondary">Save name</button>
          </form>

          <!-- Change Password -->
          <form id="settings-password-form">
            <h3 style="font-size:13px; font-weight:700; color:#18304c; margin:0 0 10px;">Change password</h3>
            <div class="auth-form-group">
              <label class="auth-form-label" for="settings-cur-pass">Current password</label>
              <input class="auth-input" id="settings-cur-pass" type="password" required />
            </div>
            <div class="auth-form-group">
              <label class="auth-form-label" for="settings-new-pass">New password (minimum 6 characters)</label>
              <input class="auth-input" id="settings-new-pass" type="password" required minlength="6" />
            </div>
            <button type="submit" class="auth-submit-btn">Update password</button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(root);
  },

  bindGlobalEvents() {
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#auth-topbar-widget')) {
        const dropdown = document.querySelector('#auth-user-dropdown');
        const pill = document.querySelector('#auth-user-menu-trigger');
        if (dropdown) dropdown.classList.remove('show');
        if (pill) {
          pill.classList.remove('active');
          pill.setAttribute('aria-expanded', 'false');
        }
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
        if (pill) {
          pill.classList.remove('active');
          pill.setAttribute('aria-expanded', 'false');
        }
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
        btn.innerHTML = isPass ? SVG_ICONS.eyeOff : SVG_ICONS.eye;
        btn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
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
        appCallbacks.showToast(`Account created for ${user.name.split(' ')[0]}.`);
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
        this.showAlert('auth-alert-box', 'Password updated. You can now log in.', 'success');
        setTimeout(() => {
          this.switchAuthTab('login');
          const emailInput = document.querySelector('#login-email');
          if (emailInput) emailInput.value = email;
        }, 1000);
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
        appCallbacks.showToast(`Saved version "${name}".`);
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
        this.showAlert('settings-alert-box', 'Name updated.', 'success');
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
        this.showAlert('settings-alert-box', 'Password updated.', 'success');
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
      appCallbacks.showToast(`Logged in as ${user.name.split(' ')[0]}.`);
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
    }, 120);
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
      if (demoBanner) demoBanner.style.display = 'block';
      if (heading) heading.textContent = 'Log in';
      if (subheading) subheading.textContent = 'Access your saved resumes and settings.';
    } else if (tab === 'signup') {
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'block';
      if (forgotForm) forgotForm.style.display = 'none';
      if (demoBanner) demoBanner.style.display = 'none';
      if (heading) heading.textContent = 'Create account';
      if (subheading) subheading.textContent = 'Save your tailored resumes and application history.';
    } else if (tab === 'forgot') {
      if (loginForm) loginForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'none';
      if (forgotForm) forgotForm.style.display = 'block';
      if (demoBanner) demoBanner.style.display = 'none';
      if (heading) heading.textContent = 'Reset password';
      if (subheading) subheading.textContent = 'Choose a new password for your account.';
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
      }, 120);
    }
  },

  renderSavedResumesList() {
    const container = document.querySelector('#saved-resumes-container');
    if (!container) return;

    const resumes = AuthService.getUserResumes();
    if (!resumes || resumes.length === 0) {
      container.innerHTML = `
        <div class="saved-resume-empty">
          <div style="font-weight:600; color:#18304c; margin-bottom:4px;">No saved resumes yet</div>
          <p style="font-size:12px; margin:0; color:#64748b;">Save your active resume below to keep a version snapshot.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = resumes.map(res => {
      const dateFormatted = res.updatedAt ? new Date(res.updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      }) : 'Recently';

      return `
        <div class="saved-resume-card" data-resume-id="${res.id}">
          <div class="saved-resume-info">
            <div class="saved-resume-title">${escapeHtml(res.name)}</div>
            <div class="saved-resume-meta">
              <span>${escapeHtml(res.role || res.jobTitle || 'Resume')}</span>
              <span>·</span>
              <span>${dateFormatted}</span>
              ${res.atsScore ? `<span class="saved-resume-score">${res.atsScore}% ATS</span>` : ''}
            </div>
          </div>
          <div class="saved-resume-actions">
            <button class="saved-action-btn load" data-load-id="${res.id}" type="button">Load</button>
            <button class="saved-action-btn delete" data-delete-id="${res.id}" type="button" aria-label="Delete version">
              ${SVG_ICONS.close}
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-load-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.loadId;
        const target = resumes.find(r => r.id === id);
        if (target && target.cvData) {
          appCallbacks.onLoadResume(target.cvData, target.settings || {});
          this.closeAllModals();
          appCallbacks.showToast(`Loaded "${target.name}".`);
        }
      });
    });

    container.querySelectorAll('[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.deleteId;
        if (confirm('Delete this saved version?')) {
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
        <span class="auth-alert-icon">${type === 'error' ? SVG_ICONS.error : SVG_ICONS.check}</span>
        <span>${escapeHtml(message)}</span>
      </div>
    `;
  },

  clearAlert(containerId) {
    const box = document.getElementById(containerId);
    if (box) box.innerHTML = '';
  }
};
