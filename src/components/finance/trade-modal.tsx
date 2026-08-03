"use client";

import { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSuccess: () => void;
}

const symbols = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'SPY', 'QQQ'];

export const TradeModal = ({ isOpen, onClose, userId = 'mock-user', onSuccess }: TradeModalProps) => {
  const [symbol, setSymbol] = useState(symbols[0]);
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [shares, setShares] = useState<number>(10);
  const [price, setPrice] = useState<number>(0);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch real-time price of selected symbol whenever it changes
  const fetchPrice = async (targetSymbol: string) => {
    setFetchingPrice(true);
    try {
      const res = await fetch(`/api/finance?q=${targetSymbol}`);
      if (res.ok) {
        const data = await res.json();
        setPrice(data.price || 245.50);
      }
    } catch (_err) {
      setPrice(245.50); // Fallback standard pricing
    } finally {
      setFetchingPrice(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPrice(symbol);
      setMessage(null);
    }
  }, [symbol, isOpen]);

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shares <= 0) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/portfolio/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          symbol,
          type,
          shares,
          price
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: 'success',
          text: `ส่งคำสั่งสำเร็จ! ${type} ${shares} Shares of ${symbol} @ $${price.toFixed(2)}`
        });
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'การส่งคำสั่งซื้อขายล้มเหลว'
        });
      }
    } catch (_err) {
      setMessage({
        type: 'error',
        text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์หลักทรัพย์ได้'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = shares * price;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Simulation Order Ticket">
      <form onSubmit={handleTrade} className="space-y-4">
        {/* Symbol Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Select Asset</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white text-sm outline-none focus:border-blue-500 font-semibold"
          >
            {symbols.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Transaction Type Choice */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Order Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('BUY')}
              className={`py-2 text-center rounded-md font-bold text-xs transition-colors border ${
                type === 'BUY'
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={() => setType('SELL')}
              className={`py-2 text-center rounded-md font-bold text-xs transition-colors border ${
                type === 'SELL'
                  ? 'bg-red-500 border-red-600 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              SELL
            </button>
          </div>
        </div>

        {/* Shares Quantity Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase">Quantity (Shares)</label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(Math.max(1, parseInt(e.target.value) || 0))}
            min={1}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 font-semibold"
          />
        </div>

        {/* Estimated Pricing Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Market Price:</span>
            {fetchingPrice ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <span className="font-bold text-slate-800">${price.toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold">
            <span className="text-slate-600">Estimated Total:</span>
            <span className={type === 'BUY' ? 'text-slate-900' : 'text-slate-900'}>
              ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-md flex items-start space-x-2 text-xs ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="pt-2 flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || fetchingPrice}
            className={`px-6 font-bold ${
              type === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Place {type} Order</span>}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
