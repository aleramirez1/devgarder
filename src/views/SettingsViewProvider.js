const vscode = require('vscode');

class SettingsViewProvider {
    constructor(context, authService) {
        this.context = context;
        this.authService = authService;
        this._panel = null;
    }

    async show() {
        if (this._panel) {
            this._panel.reveal();
            return;
        }

        this._panel = vscode.window.createWebviewPanel(
            'codeGardenSettings',
            '🌿 Code Garden — Configuración',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        this._panel.onDidDispose(() => { this._panel = null; });

        const info = await this.authService.getSubscriptionInfo();
        this._panel.webview.html = this._getHtml(info);

        this._panel.webview.onDidReceiveMessage(
            async (message) => await this._handleMessage(message),
            undefined,
            this.context.subscriptions
        );
    }

    async _handleMessage(message) {
        switch (message.command) {

            case 'cancel': {
                this._sendToWebview({ command: 'loading' });
                const res = await this.authService.cancelSubscription();

                if (res.message) {
                    this._sendToWebview({ command: 'cancelled' });
                } else {
                    this._sendToWebview({
                        command: 'error',
                        text: res.error || 'Error al cancelar suscripción',
                    });
                }
                break;
            }

            case 'subscribe': {
                this._sendToWebview({ command: 'loadingPayment' });
                const token = this.authService.getToken();
                const res = await this.authService.startSubscription(token);

                if (res.approvalUrl) {
                    vscode.env.openExternal(vscode.Uri.parse(res.approvalUrl));
                    this._sendToWebview({ command: 'waitingPayment' });
                } else {
                    this._sendToWebview({
                        command: 'error',
                        text: res.error || 'Error al iniciar el pago',
                    });
                }
                break;
            }

            case 'checkPayment': {
                this._sendToWebview({ command: 'loadingPayment' });
                const info = await this.authService.getSubscriptionInfo();

                if (info?.valid) {
                    this._sendToWebview({ command: 'reactivated' });
                    vscode.window.showInformationMessage('🌿 ¡Suscripción reactivada! Reinicia VS Code para continuar.');
                } else {
                    this._sendToWebview({
                        command: 'error',
                        text: 'Pago no confirmado aún. Espera unos segundos e intenta de nuevo.',
                    });
                    this._sendToWebview({ command: 'waitingPayment' });
                }
                break;
            }

            case 'close': {
                this._panel?.dispose();
                break;
            }
        }
    }

    _sendToWebview(message) {
        this._panel?.webview.postMessage(message);
    }

    _formatDate(dateStr) {
        if (!dateStr) return 'No disponible';
        return new Date(dateStr).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    _getHtml(info) {
        const isActive = info?.valid === true;
        const status = info?.subscriptionStatus || 'inactive';
        const expiresAt = this._formatDate(info?.expiresAt);

        const badgeClass = isActive ? 'badge-active' : status === 'cancelled' ? 'badge-cancelled' : 'badge-inactive';
        const badgeText = isActive ? '✅ Activa' : status === 'cancelled' ? '🚫 Cancelada' : '❌ Inactiva';

        return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Configuración</title>
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
      max-width: 420px;
    }

    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 48px; margin-bottom: 8px; }
    h1 { font-size: 20px; font-weight: 700; color: #81c784; }
    .subtitle { font-size: 13px; color: #66bb6a; opacity: 0.8; margin-top: 4px; }

    .section {
      background: #0f1b0f;
      border: 1px solid #2d5a2d;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #4a7a4a;
      margin-bottom: 16px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #1a2e1a;
      font-size: 14px;
    }

    .info-row:last-child { border-bottom: none; }
    .info-label { color: #66bb6a; }
    .info-value { color: #c8e6c9; font-weight: 500; }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-active    { background: #1b5e20; color: #a5d6a7; }
    .badge-inactive  { background: #3e1a1a; color: #ef9a9a; }
    .badge-cancelled { background: #2e2700; color: #fff176; }

    .btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 8px;
    }

    .btn-primary   { background: #388e3c; color: white; }
    .btn-primary:hover { background: #43a047; }
    .btn-paypal    { background: #0070ba; color: white; }
    .btn-paypal:hover { background: #005ea6; }
    .btn-danger    { background: #3e1a1a; color: #ef9a9a; border: 1px solid #7f2020; }
    .btn-danger:hover { background: #7f2020; color: white; }
    .btn-secondary { background: transparent; color: #66bb6a; border: 1px solid #2d5a2d; }
    .btn-secondary:hover { background: #1a2e1a; }
    .btn:disabled  { opacity: 0.5; cursor: not-allowed; }

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

    .info-box {
      background: #1a2e3e;
      border: 1px solid #1565c0;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 13px;
      color: #90caf9;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .warning-box {
      background: #2e2700;
      border: 1px solid #f9a825;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 13px;
      color: #fff176;
      margin-bottom: 16px;
      line-height: 1.5;
      display: none;
    }

    .success-screen { display: none; text-align: center; }
    .success-icon  { font-size: 48px; margin-bottom: 16px; }
    .success-title { font-size: 18px; font-weight: 700; color: #81c784; margin-bottom: 8px; }
    .success-msg   { font-size: 13px; color: #66bb6a; line-height: 1.6; margin-bottom: 24px; }

    .spinner {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid #4a7a4a;
      border-top-color: #81c784;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .screen { display: none; }
    .screen.active { display: block; }
  </style>
</head>
<body>
<div class="card">

  <!-- Vista principal -->
  <div id="main-view">
    <div class="header">
      <div class="logo">🌿</div>
      <h1>Configuración</h1>
      <p class="subtitle">Code Garden</p>
    </div>

    <div class="section">
      <div class="section-title">Suscripción</div>
      <div class="info-row">
        <span class="info-label">Estado</span>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Precio</span>
        <span class="info-value">$15 MXN / mes</span>
      </div>
      <div class="info-row">
        <span class="info-label">${isActive ? 'Próximo cobro' : 'Acceso hasta'}</span>
        <span class="info-value">${expiresAt}</span>
      </div>
    </div>

    <div id="error-msg" class="error"></div>

    ${isActive ? `
      <div id="warning-box" class="warning-box">
        ⚠️ Tu suscripción se cancelará, pero seguirás teniendo acceso hasta el
        <strong>${expiresAt}</strong>.
      </div>
      <button class="btn btn-danger" id="btn-cancel" onclick="confirmCancel()">
        Cancelar suscripción
      </button>
    ` : `
      <button class="btn btn-paypal" onclick="reactivate()">
        🔄 Reactivar suscripción — $15 MXN/mes
      </button>
    `}

    <button class="btn btn-secondary" style="margin-top:8px" onclick="closePanel()">
      Cerrar
    </button>
  </div>

  <!-- Vista: esperando pago -->
  <div id="waiting-view" class="success-screen">
    <div class="success-icon">⏳</div>
    <div class="success-title">Completa el pago</div>
    <p class="success-msg">
      Se abrió PayPal en tu navegador.<br/>
      Completa el pago y regresa aquí.
    </p>
    <div id="error-wait" class="error"></div>
    <button class="btn btn-primary" onclick="checkPayment()">✅ Ya pagué, verificar</button>
    <button class="btn btn-secondary" style="margin-top:8px" onclick="showMain()">← Volver</button>
  </div>

  <!-- Vista: cancelación exitosa -->
  <div id="cancelled-view" class="success-screen">
    <div class="success-icon">✅</div>
    <div class="success-title">Suscripción cancelada</div>
    <p class="success-msg">
      Tu suscripción fue cancelada.<br/>
      Seguirás teniendo acceso hasta el<br/>
      <strong>${expiresAt}</strong>.
    </p>
    <button class="btn btn-paypal" style="margin-bottom:8px" onclick="reactivate()">
      🔄 Reactivar suscripción
    </button>
    <button class="btn btn-secondary" onclick="closePanel()">Cerrar</button>
  </div>

  <!-- Vista: reactivación exitosa -->
  <div id="reactivated-view" class="success-screen">
    <div class="success-icon">🌱</div>
    <div class="success-title">¡Suscripción reactivada!</div>
    <p class="success-msg">
      Tu suscripción está activa nuevamente.<br/>
      Reinicia VS Code para continuar disfrutando Code Garden.
    </p>
    <button class="btn btn-secondary" onclick="closePanel()">Cerrar</button>
  </div>

</div>
<script>
  const vscode = acquireVsCodeApi();
  let confirmStep = false;

  function showMain() {
    hideAllViews();
    document.getElementById('main-view').style.display = 'block';
  }

  function hideAllViews() {
    ['main-view','waiting-view','cancelled-view','reactivated-view'].forEach(id => {
      document.getElementById(id).style.display = 'none';
    });
  }

  function confirmCancel() {
    if (!confirmStep) {
      confirmStep = true;
      document.getElementById('warning-box').style.display = 'block';
      const btn = document.getElementById('btn-cancel');
      btn.textContent = '⚠️ Confirmar cancelación';
      btn.style.background = '#7f2020';
      btn.style.color = 'white';
      return;
    }
    vscode.postMessage({ command: 'cancel' });
  }

  function reactivate() {
    vscode.postMessage({ command: 'subscribe' });
  }

  function checkPayment() {
    vscode.postMessage({ command: 'checkPayment' });
  }

  function closePanel() {
    vscode.postMessage({ command: 'close' });
  }

  window.addEventListener('message', (event) => {
    const msg = event.data;
    switch (msg.command) {

      case 'loading': {
        const btn = document.getElementById('btn-cancel');
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>Cancelando...'; }
        break;
      }

      case 'loadingPayment': {
        const btn = document.querySelector('.btn-paypal');
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>Conectando...'; }
        const checkBtn = document.querySelector('.btn-primary');
        if (checkBtn) { checkBtn.disabled = true; checkBtn.innerHTML = '<span class="spinner"></span>Verificando...'; }
        break;
      }

      case 'cancelled': {
        hideAllViews();
        document.getElementById('cancelled-view').style.display = 'block';
        break;
      }

      case 'waitingPayment': {
        hideAllViews();
        document.getElementById('waiting-view').style.display = 'block';
        document.getElementById('error-wait').style.display = 'none';
        const checkBtn = document.querySelector('.btn-primary');
        if (checkBtn) { checkBtn.disabled = false; checkBtn.textContent = '✅ Ya pagué, verificar'; }
        break;
      }

      case 'reactivated': {
        hideAllViews();
        document.getElementById('reactivated-view').style.display = 'block';
        break;
      }

      case 'error': {
        const err = document.getElementById('error-msg');
        const errWait = document.getElementById('error-wait');
        if (err) { err.textContent = msg.text; err.style.display = 'block'; }
        if (errWait) { errWait.textContent = msg.text; errWait.style.display = 'block'; }
        const btn = document.getElementById('btn-cancel');
        if (btn) { btn.disabled = false; btn.textContent = '⚠️ Confirmar cancelación'; }
        const checkBtn = document.querySelector('.btn-primary');
        if (checkBtn) { checkBtn.disabled = false; checkBtn.textContent = '✅ Ya pagué, verificar'; }
        confirmStep = false;
        break;
      }
    }
  });
</script>
</body>
</html>`;
    }
}

module.exports = SettingsViewProvider;