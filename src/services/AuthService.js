const vscode = require('vscode');

const BACKEND_URL = "https://devgarden.inode.cloud";
const TOKEN_KEY = "code-garden-auth-token";

class AuthService {
    constructor(context){
        this.context = context;
    }

    getToken(){
        return this.context.globalState.get(TOKEN_KEY);
    }

    async saveToken(token) {
        await this.context.globalState.update(TOKEN_KEY, token);
    }

    async clearToken() {
        await this.context.globalState.update(TOKEN_KEY, undefined);
    }

    async register(email, password) {
        const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        return res.json();
    }

    async login(email, password) {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        return res.json();
    }

    async verifySubscription(token) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/payments/verify`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        // Verificar que la respuesta sea JSON válido
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Backend no disponible o respuesta inválida');
            return { valid: false };
        }

        return res.json();
    } catch (error) {
        console.error('Error al verificar suscripción:', error.message);
        return { valid: false };
    }
}

    async startSubscription(token) {
        const res = await fetch(`${BACKEND_URL}/api/payments/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        return res.json();
    }

    async isAuthenticated() {
    try {
        const token = this.getToken();
        if (!token) return false;

        const result = await this.verifySubscription(token);
        return result.valid === true;
    } catch (error) {
        console.error('Error en isAuthenticated:', error.message);
        return false;
    }
}

    async cancelSubscription() {
        try {
            const token = this.getToken();
            const res = await fetch(`${BACKEND_URL}/api/payments/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return { error: 'Error al conectar con el servidor' };
            }

            return res.json();
        } catch (error) {
            console.error('Error al cancelar suscripción:', error.message);
            return { error: 'Error de conexión' };
        }
    }

    async getSubscriptionInfo() {
        try {
            const token = this.getToken();
            const res = await fetch(`${BACKEND_URL}/api/payments/verify`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return null;
            }

            return res.json();
        } catch (error) {
            console.error('Error al obtener info de suscripción:', error.message);
            return null;
        }
    }

}

module.exports = AuthService;
