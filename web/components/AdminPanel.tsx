'use client';

import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { useGymSBT } from '../lib/hooks/useGymSBT';
import { useWallet } from '../lib/hooks/useWallet';

export function AdminPanel() {
  const { account, isConnected } = useWallet();
  const { pricePerMonth, isOwner, setPrice, loading, error, contractAddress, isConfirmed, refetchPrice } = useGymSBT(account);
  const [newPrice, setNewPrice] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [previousConfirmed, setPreviousConfirmed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Watch for transaction confirmation - MUST be called before any conditional returns
  useEffect(() => {
    if (isConfirmed && !previousConfirmed && !loading) {
      setSuccess(true);
      setNewPrice('');
      setTimeout(() => {
        setSuccess(false);
        setPreviousConfirmed(false);
      }, 5000);
    }
    if (isConfirmed) {
      setPreviousConfirmed(true);
    }
    if (!isConfirmed && previousConfirmed && !loading) {
      setPreviousConfirmed(false);
    }
  }, [isConfirmed, loading, previousConfirmed]);

  // Don't render if not connected
  if (!isConnected || !account) {
    return null;
  }

  // Only show admin panel to the contract owner
  // Owner address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Anvil account 0)
  if (!isOwner) {
    return null;
  }

  const handleSetPrice = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) <= 0) {
      alert('Por favor, ingresa un precio válido');
      return;
    }

    try {
      setSuccess(false);
      setPreviousConfirmed(false);
      await setPrice(newPrice);
      // Success will be set when transaction is confirmed via useEffect
    } catch (err: unknown) {
      console.error('Error setting price:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al establecer el precio';
      alert(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-300 dark:border-yellow-700 shadow-lg mb-6">
      <h2 className="text-2xl font-semibold mb-4 text-black dark:text-zinc-50">
        Panel de Administración
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              Precio actual por mes:
            </p>
            <p className="text-xl font-bold text-black dark:text-zinc-50">
              {pricePerMonth ? formatEther(pricePerMonth) : 'No establecido'} ETH
            </p>
          </div>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await refetchPrice();
              } finally {
                setTimeout(() => setIsRefreshing(false), 500);
              }
            }}
            disabled={isRefreshing}
            className="px-3 py-2 text-sm bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 text-black dark:text-zinc-50 rounded-lg transition-colors"
            title="Actualizar precio"
          >
            {isRefreshing ? '...' : '↻'}
          </button>
        </div>

        <div>
          <label htmlFor="newPrice" className="block text-sm font-medium text-black dark:text-zinc-50 mb-2">
            Nuevo precio por mes (ETH)
          </label>
          <input
            id="newPrice"
            type="number"
            step="0.001"
            min="0"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Ej: 0.1"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">
              ¡Precio actualizado exitosamente!
            </p>
          </div>
        )}

        <button
          onClick={handleSetPrice}
          disabled={loading || !newPrice || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) <= 0}
          className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Procesando...' : 'Establecer Precio'}
        </button>
      </div>
    </div>
  );
}

