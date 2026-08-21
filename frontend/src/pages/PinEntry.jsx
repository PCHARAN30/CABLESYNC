import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function PinEntry() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    // Store optimistically, then verify with a real request.
    sessionStorage.setItem('cablesync_pin', pin);
    try {
      await api.get('/customers');
      navigate('/');
    } catch (err) {
      sessionStorage.removeItem('cablesync_pin');

      if (err.response?.status === 401) {
        setError('Incorrect PIN');
      } else if (err.response) {
        // Backend reached, but something else went wrong server-side
        // (e.g. OPERATOR_PIN not set, or a 500 from a Mongo issue).
        setError(
          `Server error (${err.response.status}): ${err.response.data?.error || 'please check the backend logs'}`
        );
      } else {
        // No response at all - backend isn't running, wrong VITE_API_URL,
        // or a CORS block. This is the case most often mistaken for a
        // wrong PIN, so it gets its own message.
        setError(
          "Couldn't reach the server. Check that the backend is running and VITE_API_URL / FRONTEND_ORIGIN are set correctly."
        );
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card p-8 rounded-2xl shadow-ledger border border-hairline w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="font-display text-xl text-ink">CableSync</h1>
        <p className="text-sm text-ink-soft">Enter operator PIN to continue</p>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="border border-hairline bg-paper rounded-lg px-3 py-2 text-lg tracking-widest text-center text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          placeholder="••••"
          autoFocus
        />
        {error && <p className="text-due text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-brass text-white rounded-lg py-2 font-medium hover:bg-brass-dark transition-colors"
        >
          Continue
        </button>
      </form>
    </div>
  );
}

