// auth.js — nada babo 공유 인증 시스템 (localStorage 기반)

const Auth = {
  getUsers() {
    try { return JSON.parse(localStorage.getItem('mf_users') || '{}'); }
    catch { return {}; }
  },
  saveUsers(u) { localStorage.setItem('mf_users', JSON.stringify(u)); },
  getCurrentUser() { return localStorage.getItem('mf_current_user') || null; },

  login(id, pw) {
    if (!id || !pw) return { ok: false, error: '아이디와 비밀번호를 입력하세요.' };
    const users = this.getUsers();
    if (users[id] && users[id].password === pw) {
      localStorage.setItem('mf_current_user', id);
      return { ok: true };
    }
    return { ok: false, error: '아이디 또는 비밀번호가 틀렸습니다.' };
  },

  register(id, pw) {
    if (!id || !pw) return { ok: false, error: '아이디와 비밀번호를 입력하세요.' };
    if (id.length < 2) return { ok: false, error: '아이디는 2자 이상이어야 합니다.' };
    if (pw.length < 4) return { ok: false, error: '비밀번호는 4자 이상이어야 합니다.' };
    const users = this.getUsers();
    if (users[id]) return { ok: false, error: '이미 사용 중인 아이디입니다.' };
    users[id] = { password: pw, created: Date.now() };
    this.saveUsers(users);
    localStorage.setItem('mf_current_user', id);
    return { ok: true };
  },

  logout() { localStorage.removeItem('mf_current_user'); },

  saveData(key, data) {
    const user = this.getCurrentUser();
    if (!user) return false;
    try { localStorage.setItem(`mf_${user}_${key}`, JSON.stringify(data)); return true; }
    catch { return false; }
  },

  loadData(key) {
    const user = this.getCurrentUser();
    if (!user) return null;
    try { const raw = localStorage.getItem(`mf_${user}_${key}`); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  },

  // 내부 상태
  _tab: 'login',
  _onLogin: null,

  _showTab(tab) {
    this._tab = tab;
    const lo = document.getElementById('authTabLogin');
    const re = document.getElementById('authTabRegister');
    const btn = document.getElementById('authActionBtn');
    if (!lo) return;
    lo.style.background = tab === 'login' ? '#0b2552' : 'transparent';
    lo.style.color = tab === 'login' ? '#fff' : '#64748b';
    re.style.background = tab === 'register' ? '#0b2552' : 'transparent';
    re.style.color = tab === 'register' ? '#fff' : '#64748b';
    btn.textContent = tab === 'login' ? '로그인' : '가입하기';
    document.getElementById('authMsg').textContent = '';
  },

  _submit() {
    const id = document.getElementById('authInputId').value.trim();
    const pw = document.getElementById('authInputPw').value;
    const result = Auth._tab === 'login' ? Auth.login(id, pw) : Auth.register(id, pw);
    if (result.ok) {
      Auth._closeModal();
      Auth._updateNav();
      if (Auth._onLogin) Auth._onLogin();
    } else {
      document.getElementById('authMsg').textContent = result.error;
    }
  },

  _openModal() {
    const el = document.getElementById('authOverlay');
    if (el) {
      el.style.display = 'flex';
      document.getElementById('authInputId').value = '';
      document.getElementById('authInputPw').value = '';
      document.getElementById('authMsg').textContent = '';
      setTimeout(() => document.getElementById('authInputId').focus(), 50);
    }
  },

  _closeModal() {
    const el = document.getElementById('authOverlay');
    if (el) el.style.display = 'none';
  },

  _updateNav() {
    const user = this.getCurrentUser();
    const loginBtn = document.getElementById('navLoginBtn');
    const userArea = document.getElementById('navUserArea');
    const userLabel = document.getElementById('navUserLabel');
    if (user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userArea) userArea.style.display = 'flex';
      if (userLabel) userLabel.textContent = user + '님';
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (userArea) userArea.style.display = 'none';
    }
  },

  _logoutAndReload() {
    Auth.logout();
    Auth._updateNav();
    location.reload();
  }
};

function initAuth(onLogin) {
  Auth._onLogin = onLogin;

  // 모달 HTML 생성
  const overlay = document.createElement('div');
  overlay.id = 'authOverlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(11,37,82,0.55);z-index:9999;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:28px;padding:36px 32px;width:380px;max-width:92vw;box-shadow:0 30px 80px rgba(0,0,0,0.25);animation:fadeUp 0.2s ease;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#38bdf8,#6366f1);flex-shrink:0;"></div>
        <span style="font-size:1.1rem;font-weight:800;color:#0b2552;letter-spacing:0.5px;">nada babo</span>
      </div>
      <p style="color:#64748b;font-size:0.85rem;margin:0 0 22px;line-height:1.5;">로그인하면 촬영 계획표와 예산서를<br>저장하고 이어서 작업할 수 있습니다.</p>

      <div style="display:flex;background:#f1f5f9;border-radius:14px;padding:4px;margin-bottom:20px;">
        <button id="authTabLogin" onclick="Auth._showTab('login')" style="flex:1;padding:9px;border-radius:10px;border:none;cursor:pointer;font-weight:700;font-size:0.88rem;background:#0b2552;color:#fff;transition:all 0.15s;">로그인</button>
        <button id="authTabRegister" onclick="Auth._showTab('register')" style="flex:1;padding:9px;border-radius:10px;border:none;cursor:pointer;font-weight:700;font-size:0.88rem;background:transparent;color:#64748b;transition:all 0.15s;">회원가입</button>
      </div>

      <input id="authInputId" type="text" placeholder="아이디" autocomplete="username"
        style="width:100%;box-sizing:border-box;padding:13px 14px;border:1.5px solid #e2e8f0;border-radius:12px;margin-bottom:10px;font-size:0.95rem;outline:none;">
      <input id="authInputPw" type="password" placeholder="비밀번호 (4자 이상)" autocomplete="current-password"
        style="width:100%;box-sizing:border-box;padding:13px 14px;border:1.5px solid #e2e8f0;border-radius:12px;margin-bottom:6px;font-size:0.95rem;outline:none;">
      <p id="authMsg" style="color:#dc2626;font-size:0.83rem;min-height:20px;margin:0 0 14px;"></p>

      <button id="authActionBtn" onclick="Auth._submit()" style="width:100%;padding:13px;background:linear-gradient(135deg,#0e3b72,#062850);color:#fff;border:none;border-radius:14px;font-size:1rem;font-weight:700;cursor:pointer;margin-bottom:10px;">로그인</button>
      <button onclick="Auth._closeModal()" style="width:100%;padding:11px;background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;border-radius:14px;font-size:0.9rem;cursor:pointer;font-weight:600;">취소</button>
    </div>
    <style>@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}</style>
  `;
  document.body.appendChild(overlay);

  // 키보드 지원
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') Auth._closeModal();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) Auth._closeModal(); });

  document.getElementById('authInputId').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('authInputPw').focus();
  });
  document.getElementById('authInputPw').addEventListener('keydown', e => {
    if (e.key === 'Enter') Auth._submit();
  });

  Auth._updateNav();
}
