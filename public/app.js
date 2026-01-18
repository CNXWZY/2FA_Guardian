class TOTPGenerator {
  constructor() {
    this.PERIOD = 30;
    this.DIGITS = 6;
    this.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  }

  base32Decode(encoded) {
    encoded = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
    
    let bits = '';
    for (let i = 0; i < encoded.length; i++) {
      const val = this.alphabet.indexOf(encoded[i]);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }

    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }

    return new Uint8Array(bytes);
  }

  generate(secret, time = Date.now()) {
    const counter = Math.floor(time / 1000 / this.PERIOD);
    const key = this.base32Decode(secret);
    
    const counterBytes = new ArrayBuffer(8);
    const counterView = new DataView(counterBytes);
    counterView.setUint32(4, counter, false);
    counterView.setUint32(0, 0, false);

    const keyWordArray = CryptoJS.lib.WordArray.create(key);
    const counterWordArray = CryptoJS.lib.WordArray.create(new Uint8Array(counterBytes));

    const hmac = CryptoJS.HmacSHA1(counterWordArray, keyWordArray);
    const hmacHex = hmac.toString();
    const hmacBytes = [];

    for (let i = 0; i < hmacHex.length; i += 2) {
      hmacBytes.push(parseInt(hmacHex.substr(i, 2), 16));
    }

    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
    const binary = ((hmacBytes[offset] & 0x7f) << 24) |
                   ((hmacBytes[offset + 1] & 0xff) << 16) |
                   ((hmacBytes[offset + 2] & 0xff) << 8) |
                   (hmacBytes[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, this.DIGITS);
    return otp.toString().padStart(this.DIGITS, '0');
  }

  getRemainingTime() {
    return this.PERIOD - Math.floor((Date.now() / 1000) % this.PERIOD);
  }
}

class AccountManager {
  constructor() {
    this.accounts = this.loadAccounts();
  }

  loadAccounts() {
    try {
      const stored = localStorage.getItem('totp_accounts');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveAccounts() {
    localStorage.setItem('totp_accounts', JSON.stringify(this.accounts));
  }

  addAccount(name, secret) {
    if (!name.trim()) {
      throw new Error('请输入账号名称');
    }
    if (!secret.trim()) {
      throw new Error('请输入2FA密钥');
    }

    const account = {
      id: Date.now().toString(),
      name: name.trim(),
      secret: secret.trim(),
      createdAt: Date.now()
    };

    this.accounts.push(account);
    this.saveAccounts();
    return account;
  }

  deleteAccount(id) {
    this.accounts = this.accounts.filter(acc => acc.id !== id);
    this.saveAccounts();
  }

  clearAll() {
    this.accounts = [];
    this.saveAccounts();
  }

  getAccounts() {
    return this.accounts;
  }
}

class App {
  constructor() {
    this.totp = new TOTPGenerator();
    this.accountManager = new AccountManager();
    this.timers = new Map();
    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
    this.startTimer();
  }

  bindEvents() {
    document.getElementById('addBtn').addEventListener('click', () => this.handleAddAccount());
    document.getElementById('clearAll').addEventListener('click', () => this.handleClearAll());

    document.getElementById('accountName').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') document.getElementById('secretKey').focus();
    });

    document.getElementById('secretKey').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleAddAccount();
    });
  }

  handleAddAccount() {
    const nameInput = document.getElementById('accountName');
    const secretInput = document.getElementById('secretKey');

    try {
      this.accountManager.addAccount(nameInput.value, secretInput.value);
      nameInput.value = '';
      secretInput.value = '';
      this.render();
      this.showToast('账号添加成功');
    } catch (error) {
      this.showToast(error.message);
    }
  }

  handleDeleteAccount(id) {
    this.accountManager.deleteAccount(id);
    this.render();
    this.showToast('账号已删除');
  }

  handleClearAll() {
    if (confirm('确定要清空所有账号吗？此操作不可恢复。')) {
      this.accountManager.clearAll();
      this.render();
      this.showToast('所有账号已清空');
    }
  }

  handleCopy(code) {
    navigator.clipboard.writeText(code).then(() => {
      this.showToast('验证码已复制');
    }).catch(() => {
      this.showToast('复制失败');
    });
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  render() {
    const accounts = this.accountManager.getAccounts();
    const listEl = document.getElementById('accountsList');
    const emptyState = document.getElementById('emptyState');

    if (accounts.length === 0) {
      listEl.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    listEl.innerHTML = accounts.map(account => this.createAccountHTML(account)).join('');
    this.updateTOTP();
  }

  createAccountHTML(account) {
    return `
      <div class="account-item" data-id="${account.id}">
        <div class="account-header">
          <span class="account-name">${this.escapeHTML(account.name)}</span>
          <button class="delete-btn" onclick="app.handleDeleteAccount('${account.id}')">&times;</button>
        </div>
        <div class="totp-display">
          <span class="code" data-secret="${this.escapeHTML(account.secret)}">Loading...</span>
          <div class="code-actions">
            <button class="copy-btn" onclick="app.handleCopy(this.previousElementSibling.textContent)">
              复制
            </button>
            <div class="timer">
              <svg width="50" height="50">
                <circle class="timer-bg" cx="25" cy="25" r="23"></circle>
                <circle class="timer-progress" cx="25" cy="25" r="23" 
                        stroke-dasharray="144.5" stroke-dashoffset="0"></circle>
              </svg>
              <span class="timer-text">30</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  updateTOTP() {
    const remainingTime = this.totp.getRemainingTime();
    const codes = document.querySelectorAll('.code');
    const timerProgresses = document.querySelectorAll('.timer-progress');
    const timerTexts = document.querySelectorAll('.timer-text');

    codes.forEach(codeEl => {
      const secret = codeEl.dataset.secret;
      if (secret) {
        const newCode = this.totp.generate(secret);
        if (codeEl.textContent !== newCode) {
          codeEl.textContent = newCode;
        }
      }
    });

    const circumference = 2 * Math.PI * 23;
    const offset = circumference * (1 - remainingTime / 30);

    timerProgresses.forEach(progress => {
      progress.style.strokeDashoffset = offset;
      if (remainingTime <= 5) {
        progress.style.stroke = '#e74c3c';
      } else {
        progress.style.stroke = '#667eea';
      }
    });

    timerTexts.forEach(text => {
      text.textContent = remainingTime;
      if (remainingTime <= 5) {
        text.style.color = '#e74c3c';
      } else {
        text.style.color = '#667eea';
      }
    });

    codes.forEach(codeEl => {
      if (remainingTime <= 5) {
        codeEl.classList.add('expires-soon');
      } else {
        codeEl.classList.remove('expires-soon');
      }
    });
  }

  startTimer() {
    setInterval(() => this.updateTOTP(), 1000);
  }
}

const app = new App();
