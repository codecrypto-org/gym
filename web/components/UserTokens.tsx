'use client';

import { useWallet } from '../lib/hooks/useWallet';
import { useUserTokens } from '../lib/hooks/useUserTokens';

export function UserTokens() {
  const { account, isConnected } = useWallet();
  const { tokens, balance, loading } = useUserTokens(account);

  if (!isConnected || !account) {
    return null;
  }

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50">
          Mis Tokens de Acceso
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Cargando tokens...</p>
      </div>
    );
  }

  if (balance === 0) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50">
          Mis Tokens de Acceso
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center py-4">
          No tienes tokens de acceso. Compra uno para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg mb-6">
      <h2 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50">
        Mis Tokens de Acceso
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        Total: {balance} {balance === 1 ? 'token' : 'tokens'}
      </p>

      <div className="space-y-3">
        {tokens.map((token) => (
          <div
            key={token.tokenId.toString()}
            className={`p-4 rounded-lg border-2 ${
              token.isValid
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-black dark:text-zinc-50">
                  Token #{token.tokenId.toString()}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {token.expirationDate.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  token.isValid
                    ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                    : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                }`}
              >
                {token.isValid ? 'Válido' : 'Expirado'}
              </div>
            </div>
            {token.isValid && token.daysRemaining > 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {token.daysRemaining === 1
                  ? 'Expira mañana'
                  : token.daysRemaining <= 7
                  ? `Expira en ${token.daysRemaining} días`
                  : `Válido por ${token.daysRemaining} días más`}
              </p>
            )}
            {!token.isValid && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Este token ha expirado
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
