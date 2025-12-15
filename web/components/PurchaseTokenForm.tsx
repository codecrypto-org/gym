'use client';

import { useState } from 'react';
import { formatEther } from 'viem';
import { useGymSBT } from '../lib/hooks/useGymSBT';
import { useWallet } from '../lib/hooks/useWallet';

export function PurchaseTokenForm() {
  const { account, isConnected } = useWallet();
  const { pricePerMonth, purchaseToken, calculatePrice, loading, error } = useGymSBT(account);
  const [months, setMonths] = useState<string>('1');
  const [success, setSuccess] = useState(false);

  const handlePurchase = async () => {
    if (!isConnected) {
      alert('Por favor, conecta tu wallet primero');
      return;
    }

    const monthsNum = parseInt(months);
    if (isNaN(monthsNum) || monthsNum <= 0) {
      alert('Por favor, ingresa un número válido de meses');
      return;
    }

    try {
      setSuccess(false);
      await purchaseToken(monthsNum);
      setSuccess(true);
      setMonths('1');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error purchasing token:', err);
      alert(err.message || 'Error al comprar el token');
    }
  };

  const totalPrice = months ? calculatePrice(parseInt(months) || 0) : '0';

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50">
        Comprar Token de Acceso
      </h2>

      {pricePerMonth && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Precio por mes: <span className="font-semibold">{formatEther(pricePerMonth)} ETH</span>
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="months" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
            Número de meses
          </label>
          <input
            id="months"
            type="number"
            min="1"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: 1, 3, 6, 12"
            disabled={loading || !isConnected}
          />
        </div>

        {months && !isNaN(parseInt(months)) && parseInt(months) > 0 && (
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Precio total:
            </p>
            <p className="text-xl font-bold text-black dark:text-zinc-50">
              {totalPrice} ETH
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">
              ¡Token comprado exitosamente!
            </p>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={loading || !isConnected || !months || isNaN(parseInt(months)) || parseInt(months) <= 0}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Procesando...' : isConnected ? 'Comprar Token' : 'Conecta tu wallet'}
        </button>
      </div>
    </div>
  );
}

