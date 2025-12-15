'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../lib/hooks/useWallet';
import { PurchaseTokenForm } from '../components/PurchaseTokenForm';
import { AdminPanel } from '../components/AdminPanel';
import { UserTokens } from '../components/UserTokens'; 

export default function Home() {
  const { account, isConnected, connect, disconnect, isConnecting, error: walletError } = useWallet();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering wallet state after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2 text-black dark:text-zinc-50">
            Gimnasio - Acceso con Token SBT
          </h1>
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            Compra tu token de acceso al gimnasio
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8 text-center">
          {!mounted ? (
            // Show a placeholder during SSR to prevent hydration mismatch
            <div className="h-16 flex items-center justify-center">
              <div className="text-sm text-zinc-500 dark:text-zinc-500">Cargando...</div>
            </div>
          ) : !isConnected ? (
            <div>
              <button
                onClick={connect}
                disabled={isConnecting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white font-semibold rounded-lg transition-colors"
              >
                {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
              </button>
              {walletError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{walletError}</p>
              )}
              {!isConnecting && !walletError && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  Asegúrate de tener Rabbit Wallet instalado
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Conectado: <span className="font-mono text-black dark:text-zinc-50">{account?.slice(0, 6)}...{account?.slice(-4)}</span>
              </p>
              <button
                onClick={disconnect}
                className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Desconectar
              </button>
            </div>
          )}
        </div>

        {/* Admin Panel */}
        {mounted && isConnected && <AdminPanel />}

        {/* User Tokens */}
        {mounted && isConnected && <UserTokens />}

        {/* Purchase Form */}
        <PurchaseTokenForm />

        {/* Info Section */}
        <div className="mt-8 p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
            Información
          </h2>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>• Los tokens SBT son no transferibles (Soulbound Tokens)</li>
            <li>• Cada token tiene una fecha de caducidad basada en los meses comprados</li>
            <li>• El precio se calcula multiplicando el precio por mes por el número de meses</li>
            <li>• Los tokens expirados pueden ser quemados automáticamente</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
