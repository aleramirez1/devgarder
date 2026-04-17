const vscode = require('vscode');

class AuthViewProvider {
    constructor(context, authService, onAuthSuccess) {
        this.context = context;
        this.authService = authService;
        this.onAuthSuccess = onAuthSuccess; // callback cuando el usuario se autentica
        this._panel = null;
    }

    show() {
        if (this._panel) {
            this._panel.reveal();
            return;
        }

        this._panel = vscode.window.createWebviewPanel(
            'codeGardenAuth',
            '🌿 Code Garden — Acceso',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        this._panel.webview.html = this._getHtml();

        this._panel.webview.onDidReceiveMessage(
            async (message) => await this._handleMessage(message),
            undefined,
            this.context.subscriptions
        );

        this._panel.onDidDispose(() => {
            this._panel = null;
        });
    }

    async _handleMessage(message) {
        switch (message.command) {

            case 'register': {
                this._sendToWebview({ command: 'loading', text: 'Creando cuenta...' });
                const res = await this.authService.register(message.email, message.password);

                if (res.token) {
                    await this.authService.saveToken(res.token);
                    // Tiene cuenta pero aún no suscripción, mostrar pantalla de pago
                    this._sendToWebview({ command: 'showPayment' });
                } else {
                    this._sendToWebview({ command: 'error', text: res.error || 'Error al registrar' });
                }
                break;
            }

            case 'login': {
                this._sendToWebview({ command: 'loading', text: 'Iniciando sesión...' });
                const res = await this.authService.login(message.email, message.password);

                if (res.token) {
                    await this.authService.saveToken(res.token);

                    // Verificar si ya tiene suscripción activa
                    const verify = await this.authService.verifySubscription(res.token);
                    if (verify.valid) {
                        this._panel?.dispose();
                        this.onAuthSuccess();
                    } else {
                        this._sendToWebview({ command: 'showPayment' });
                    }
                } else {
                    this._sendToWebview({ command: 'error', text: res.error || 'Credenciales inválidas' });
                }
                break;
            }

            case 'subscribe': {
                this._sendToWebview({ command: 'loading', text: 'Redirigiendo a PayPal...' });
                const token = this.authService.getToken();
                const res = await this.authService.startSubscription(token);

                if (res.approvalUrl) {
                    // Abre PayPal en el browser externo
                    vscode.env.openExternal(vscode.Uri.parse(res.approvalUrl));
                    this._sendToWebview({ command: 'waitingPayment' });
                } else {
                    this._sendToWebview({ command: 'error', text: 'Error al iniciar pago' });
                }
                break;
            }

            case 'checkPayment': {
                // El usuario dice que ya pagó, verificamos
                this._sendToWebview({ command: 'loading', text: 'Verificando pago...' });
                const token = this.authService.getToken();
                const verify = await this.authService.verifySubscription(token);

                if (verify.valid) {
                    this._panel?.dispose();
                    this.onAuthSuccess();
                } else {
                    this._sendToWebview({
                        command: 'error',
                        text: 'Pago no confirmado aún. Espera unos segundos y vuelve a intentar.',
                    });
                    this._sendToWebview({ command: 'waitingPayment' });
                }
                break;
            }
        }
    }

    _sendToWebview(message) {
        this._panel?.webview.postMessage(message);
    }

    _getHtml() {
        return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Code Garden</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f1b0f;
      color: #c8e6c9;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
    }

    .card {
      background: #1a2e1a;
      border: 1px solid #2d5a2d;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      text-align: center;
    }

    .logo { font-size: 56px; margin-bottom: 8px; }

    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #81c784;
      margin-bottom: 4px;
    }

    .subtitle {
      font-size: 13px;
      color: #66bb6a;
      margin-bottom: 28px;
      opacity: 0.8;
    }

    .tabs {
      display: flex;
      background: #0f1b0f;
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 24px;
      gap: 4px;
    }

    .tab {
      flex: 1;
      padding: 8px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #66bb6a;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }

    .tab.active {
      background: #2d5a2d;
      color: #c8e6c9;
      font-weight: 600;
    }

    input {
      width: 100%;
      padding: 12px 14px;
      background: #0f1b0f;
      border: 1px solid #2d5a2d;
      border-radius: 8px;
      color: #c8e6c9;
      font-size: 14px;
      margin-bottom: 12px;
      outline: none;
      transition: border-color 0.2s;
    }

    input:focus { border-color: #66bb6a; }

    input::placeholder { color: #4a7a4a; }

    .btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 4px;
    }

    .btn-primary {
      background: #388e3c;
      color: white;
    }

    .btn-primary:hover { background: #43a047; }

    .btn-paypal {
      background: #0070ba;
      color: white;
      margin-top: 12px;
    }

    .btn-paypal:hover { background: #005ea6; }

    .btn-secondary {
      background: transparent;
      color: #66bb6a;
      border: 1px solid #2d5a2d;
      margin-top: 8px;
    }

    .btn-secondary:hover { background: #1a2e1a; }

    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .error {
      background: #3e1a1a;
      border: 1px solid #7f2020;
      color: #ef9a9a;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 12px;
      display: none;
    }

    .info {
      background: #1a2e3e;
      border: 1px solid #1565c0;
      color: #90caf9;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
    }

    .price-badge {
      display: inline-block;
      background: #2d5a2d;
      color: #a5d6a7;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      margin-bottom: 20px;
    }

    .status { font-size: 13px; color: #66bb6a; margin-top: 12px; min-height: 20px; }

    .screen { display: none; }
    .screen.active { display: block; }
  </style>
</head>
<body>
<div class="card">
  <div class="logo">🌿</div>
  <h1>Code Garden</h1>
  <p class="subtitle">Tu jardín crece mientras programas</p>

  <!-- Pantalla: Login / Registro -->
  <div id="screen-auth" class="screen active">
    <div class="tabs">
      <button class="tab active" onclick="switchTab('login')">Iniciar sesión</button>
      <button class="tab" onclick="switchTab('register')">Crear cuenta</button>
    </div>

    <div id="error-msg" class="error"></div>

    <input id="email" type="email" placeholder="tu@email.com" autocomplete="off"/>
    <input id="password" type="password" placeholder="Contraseña"/>

    <button class="btn btn-primary" id="auth-btn" onclick="submitAuth()">
      Iniciar sesión
    </button>

    <p class="status" id="auth-status"></p>
  </div>

  <!-- Pantalla: Pago -->
  <div id="screen-payment" class="screen">
    <p style="margin-bottom:12px; font-size:14px;">
      Para usar Code Garden necesitas una suscripción activa.
    </p>
    <div class="price-badge">💰 Solo $15 MXN / mes</div>

    <div id="error-pay" class="error"></div>

    <button class="btn btn-paypal" onclick="subscribe()">
      🔒 Suscribirme con PayPal
    </button>
    <p class="status" id="pay-status"></p>
  </div>

  <!-- Pantalla: Esperando confirmación -->
  <div id="screen-waiting" class="screen">
    <div class="info">
      Se abrió PayPal en tu navegador.<br/>
      Completa el pago y regresa aquí.
    </div>
    <button class="btn btn-primary" onclick="checkPayment()">
      ✅ Ya pagué, verificar
    </button>
    <button class="btn btn-secondary" onclick="showScreen('screen-payment')">
      ← Volver
    </button>
    <p class="status" id="wait-status"></p>
  </div>
</div>

<script>
  const vscode = acquireVsCodeApi();
  let currentTab = 'login';

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach((t, i) => {
      t.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
    });
    document.getElementById('auth-btn').textContent =
      tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
    clearError();
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = 'block';
  }

  function clearError() {
    document.querySelectorAll('.error').forEach(e => e.style.display = 'none');
  }

  function setStatus(id, msg) {
    document.getElementById(id).textContent = msg;
  }

  function submitAuth() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    clearError();

    if (!email || !password) {
      showError('error-msg', 'Por favor completa todos los campos');
      return;
    }

    vscode.postMessage({ command: currentTab, email, password });
  }

  function subscribe() {
    vscode.postMessage({ command: 'subscribe' });
  }

  function checkPayment() {
    vscode.postMessage({ command: 'checkPayment' });
  }

  // Mensajes desde la extensión
  window.addEventListener('message', (event) => {
    const msg = event.data;

    switch (msg.command) {
      case 'loading':
        setStatus('auth-status', msg.text);
        setStatus('pay-status', msg.text);
        setStatus('wait-status', msg.text);
        break;

      case 'error':
        showError('error-msg', msg.text);
        showError('error-pay', msg.text);
        setStatus('auth-status', '');
        setStatus('pay-status', '');
        setStatus('wait-status', '');
        break;

      case 'showPayment':
        showScreen('screen-payment');
        break;

      case 'waitingPayment':
        showScreen('screen-waiting');
        setStatus('wait-status', '');
        break;
    }
  });
</script>
</body>
</html>`;
    }
}

module.exports = AuthViewProvider;