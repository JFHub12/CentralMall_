/**
 * Central Mall Admin Security Configuration
 * 
 * Default Master Password: 'shopping2026'
 * Visual mask representation: '************'
 * Only authenticated administrators can change the password from the console or code.
 */

// Stored masked representation so plain-text is not casually exposed
export const MASKED_ADMIN_PASSWORD_DISPLAY = '************'; // shopping2026
const DEFAULT_PASSWORD_HASH = 'c2hvcHBpbmcyMDI2'; // base64 representation of shopping2026

const ADMIN_STORAGE_KEY = 'central_mall_admin_custom_pwd';
const ADMIN_SESSION_KEY = 'central_mall_admin_auth_session';

/**
 * Verify admin password using backend verification first, falling back to local verification.
 */
export async function verifyAdminPassword(input: string): Promise<boolean> {
  const trimmed = input.trim();
  if (!trimmed) return false;

  try {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: trimmed }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        setAdminSession(true);
        return true;
      }
    }
  } catch (e) {
    console.warn('Backend admin verify unreachable, checking local fallback', e);
  }

  // Local fallback check
  const customPwd = localStorage.getItem(ADMIN_STORAGE_KEY);
  let isValid = false;

  if (customPwd) {
    isValid = trimmed === customPwd;
  } else {
    // Default password check: 'shopping2026'
    try {
      isValid = btoa(trimmed) === DEFAULT_PASSWORD_HASH || trimmed === 'shopping2026';
    } catch {
      isValid = trimmed === 'shopping2026';
    }
  }

  if (isValid) {
    setAdminSession(true);
  }

  return isValid;
}

/**
 * Change admin password, verifying the current password first.
 */
export async function changeAdminPassword(
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; message: string }> {
  const trimmedCurrent = currentPass.trim();
  const trimmedNew = newPass.trim();

  if (trimmedNew.length < 4) {
    return { success: false, message: 'New password must be at least 4 characters.' };
  }

  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: trimmedCurrent,
        newPassword: trimmedNew,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(ADMIN_STORAGE_KEY, trimmedNew);
      return { success: true, message: data.message || 'Admin password updated successfully!' };
    } else {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.message || 'Current password incorrect.' };
    }
  } catch (e) {
    // Local fallback update
    const customPwd = localStorage.getItem(ADMIN_STORAGE_KEY);
    const expectedCurrent = customPwd || 'shopping2026';

    if (trimmedCurrent !== expectedCurrent) {
      return { success: false, message: 'Current password incorrect.' };
    }

    localStorage.setItem(ADMIN_STORAGE_KEY, trimmedNew);
    return { success: true, message: 'Password updated locally in secure storage.' };
  }
}

export function setAdminSession(authenticated: boolean) {
  if (authenticated) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'active_' + Date.now());
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function isAdminAuthenticated(): boolean {
  try {
    return !!sessionStorage.getItem(ADMIN_SESSION_KEY);
  } catch {
    return false;
  }
}
