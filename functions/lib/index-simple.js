"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappApi = exports.testApi = void 0;
const functions = __importStar(require("firebase-functions"));
const cors = __importStar(require("cors"));
// Configurar CORS
const corsHandler = cors({
    origin: true,
    credentials: true,
});
// Función de diagnóstico simple
exports.testApi = functions.https.onRequest((req, res) => {
    corsHandler(req, res, () => {
        console.log('🔍 Test API llamada recibida');
        const response = {
            status: 'ok',
            message: 'Firebase Function está funcionando',
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            query: req.query,
        };
        res.status(200).json(response);
    });
});
// Función principal WhatsApp (simplificada para diagnóstico)
exports.whatsappApi = functions.https.onRequest((req, res) => {
    corsHandler(req, res, () => {
        console.log(`📱 WhatsApp API: ${req.method} ${req.path}`);
        const path = req.path.replace('/whatsappApi', '') || req.path;
        switch (path) {
            case '/status':
                res.status(200).json({
                    status: 'disconnected',
                    message: 'Función funcionando - WhatsApp no conectado aún',
                    timestamp: new Date().toISOString()
                });
                break;
            case '/qr':
                res.status(200).json({
                    status: 'waiting_for_qr',
                    message: 'Generar QR - Función en modo diagnóstico',
                    timestamp: new Date().toISOString()
                });
                break;
            default:
                res.status(404).json({
                    error: 'Endpoint no encontrado',
                    path: path,
                    availableEndpoints: ['/status', '/qr']
                });
        }
    });
});
//# sourceMappingURL=index-simple.js.map