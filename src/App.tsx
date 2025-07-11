import React, { useState, useRef, useEffect } from 'react';
import { Shield, CreditCard, CheckCircle, XCircle, Clock, Zap, Terminal, Lock, Pause, Play, Settings, Filter } from 'lucide-react';

interface CheckResult {
  card: string;
  status: 'approved' | 'declined' | 'checking';
  response: string;
  timestamp: string;
  reason?: string;
  cardInfo?: {
    type: string;
    brand: string;
    bank: string;
    country: string;
    flag: string;
    currency: string;
  };
  processingTime?: string;
  gateway: string;
  chargeAmount?: string;
}

type Gateway = 'shopify1' | 'shopify2' | 'braintree';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [cards, setCards] = useState('');
  const [results, setResults] = useState<CheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentCard, setCurrentCard] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [filter, setFilter] = useState<'all' | 'approved' | 'declined'>('all');
  const [selectedGateway, setSelectedGateway] = useState<Gateway>('shopify1');
  const [checkingSpeed, setCheckingSpeed] = useState(200);
  const resultsRef = useRef<HTMLDivElement>(null);
  const checkingRef = useRef<boolean>(false);
  const pausedRef = useRef<boolean>(false);

  const gatewayConfig = {
    shopify1: {
      name: 'Shopify Basic',
      description: 'Basic Shopify Processing - $4',
      color: 'from-blue-500 to-cyan-500'
    },
    shopify2: {
      name: 'Shopify VBV/3D',
      description: 'VBV + 3D Secure Authentication - $4',
      color: 'from-purple-500 to-pink-500'
    },
    braintree: {
      name: 'Braintree Charge',
      description: 'Real Charge Processing - Auth',
      color: 'from-orange-500 to-red-500'
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'kamal') {
      setIsAuthenticated(true);
    } else {
      alert('❌ Access Denied - Invalid Credentials');
    }
  };

  const checkSingleCard = async (cardData: string): Promise<CheckResult> => {
    try {
      const response = await fetch('/api/check-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardData: cardData.trim(),
          gateway: selectedGateway
        })
      });

      if (!response.ok) {
        throw new Error('Network error');
      }

      return await response.json();
    } catch (error) {
      return {
        card: cardData,
        status: 'declined',
        response: '⤿ NETWORK_ERROR ⤾',
        timestamp: new Date().toLocaleString(),
        gateway: gatewayConfig[selectedGateway].name
      };
    }
  };

  const processCards = async () => {
    const cardList = cards.trim().split('\n').filter(card => card.trim());
    setTotalCards(cardList.length);
    setProcessedCount(0);
    checkingRef.current = true;

    for (let i = 0; i < cardList.length && checkingRef.current; i++) {
      while (pausedRef.current && checkingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!checkingRef.current) break;

      const card = cardList[i].trim();
      setCurrentCard(card);

      // Add checking status
      const checkingResult: CheckResult = {
        card,
        status: 'checking',
        response: 'Processing...',
        timestamp: new Date().toLocaleString(),
        gateway: gatewayConfig[selectedGateway].name
      };

      setResults(prev => {
        const newResults = [...prev];
        const existingIndex = newResults.findIndex(r => r.card === card);
        if (existingIndex >= 0) {
          newResults[existingIndex] = checkingResult;
        } else {
          newResults.push(checkingResult);
        }
        return newResults;
      });

      try {
        const result = await checkSingleCard(card);
        
        setResults(prev => {
          const newResults = [...prev];
          const existingIndex = newResults.findIndex(r => r.card === card);
          if (existingIndex >= 0) {
            newResults[existingIndex] = result;
          } else {
            newResults.push(result);
          }
          return newResults;
        });

        setProcessedCount(prev => prev + 1);
      } catch (error) {
        console.error('Card check error:', error);
      }

      // Speed control
      const delay = Math.max(5, 1000 / checkingSpeed);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Auto-scroll to bottom
      if (resultsRef.current) {
        resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
      }
    }

    setCurrentCard('');
    setIsChecking(false);
    checkingRef.current = false;
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cards.trim()) return;

    setIsChecking(true);
    setIsPaused(false);
    setResults([]);
    pausedRef.current = false;
    
    await processCards();
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    pausedRef.current = !pausedRef.current;
  };

  const handleStop = () => {
    setIsChecking(false);
    setIsPaused(false);
    checkingRef.current = false;
    pausedRef.current = false;
    setCurrentCard('');
  };

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true;
    return result.status === filter;
  });

  const approvedCount = results.filter(r => r.status === 'approved').length;
  const declinedCount = results.filter(r => r.status === 'declined').length;
  const checkingCount = results.filter(r => r.status === 'checking').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Terminal Header */}
          <div className="bg-gray-800/50 backdrop-blur-xl border border-cyan-500/30 rounded-t-xl p-4 flex items-center justify-between">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse delay-200"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse delay-400"></div>
            </div>
            <div className="text-cyan-400 text-sm font-mono tracking-wider">SECURE ACCESS TERMINAL</div>
          </div>

          {/* Login Form */}
          <div className="bg-gray-900/80 backdrop-blur-xl border-x border-b border-cyan-500/30 rounded-b-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mb-6 shadow-lg shadow-cyan-500/25">
                <Terminal className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 tracking-wider">
                CC VALIDATOR
              </h1>
              <p className="text-gray-400 text-sm tracking-widest">@config_masterr</p>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="relative">
                <label className="block text-cyan-400 text-sm font-medium mb-3 uppercase tracking-wider">
                  Access Code
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-4 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 font-mono tracking-wider"
                    placeholder="Enter password"
                    required
                  />
                  <Lock className="absolute right-3 top-4 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 uppercase tracking-wider"
              >
                AUTHENTICATE
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-gray-500">
              <Shield className="w-4 h-4" />
              <span className="tracking-wider">UNAUTHORIZED ACCESS PROHIBITED</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gray-900/80 backdrop-blur-xl border-b border-cyan-500/30 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Terminal className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent tracking-wider">
                  CC VALIDATOR
                </h1>
                <p className="text-gray-400 text-sm tracking-widest">@config_masterr</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className="text-sm text-gray-400 tracking-wider">STATUS</div>
              <div className="text-green-400 font-bold tracking-wider">ONLINE</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 tracking-wider">SPEED</div>
              <div className="text-cyan-400 font-bold tracking-wider">{checkingSpeed}/sec</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 tracking-wider">GATEWAY</div>
              <div className="text-purple-400 font-bold tracking-wider">{gatewayConfig[selectedGateway].name}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-6 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-cyan-400 tracking-wider">CARD INPUT TERMINAL</h2>
            </div>

            <form onSubmit={handleCheck} className="space-y-6">
              {/* Gateway Selection */}
              <div>
                <label className="block text-cyan-400 text-sm font-medium mb-3 uppercase tracking-wider">
                  Payment Gateway
                </label>
                <select
                  value={selectedGateway}
                  onChange={(e) => setSelectedGateway(e.target.value as Gateway)}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  disabled={isChecking}
                >
                  <option value="shopify1">Shopify Basic - $4 Processing</option>
                  <option value="shopify2">Shopify VBV/3D - $4 + Authentication</option>
                  <option value="braintree">Braintree Charge - Real Auth</option>
                </select>
                <p className="text-gray-400 text-xs mt-1 tracking-wider">{gatewayConfig[selectedGateway].description}</p>
              </div>

              {/* Speed Control */}
              <div>
                <label className="block text-cyan-400 text-sm font-medium mb-3 uppercase tracking-wider">
                  Processing Speed: {checkingSpeed} cards/sec
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={checkingSpeed}
                  onChange={(e) => setCheckingSpeed(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  disabled={isChecking}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1 tracking-wider">
                  <span>10/sec</span>
                  <span>200/sec</span>
                </div>
              </div>

              {/* Card Input */}
              <div>
                <label className="block text-cyan-400 text-sm font-medium mb-3 uppercase tracking-wider">
                  Credit Card Data
                </label>
                <textarea
                  value={cards}
                  onChange={(e) => setCards(e.target.value)}
                  rows={12}
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono text-sm"
                  placeholder="Enter CC details (format: number|month|year|cvv)&#10;Example: 4532123456789012|12|2025|123&#10;&#10;Unlimited cards supported..."
                  disabled={isChecking}
                />
                <div className="flex justify-between items-center mt-2 text-xs text-gray-400 tracking-wider">
                  <span>Format: CARD|MM|YYYY|CVV (one per line)</span>
                  <span className="text-cyan-400">
                    Cards: {cards.trim() ? cards.trim().split('\n').filter(c => c.trim()).length : 0}
                  </span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex space-x-4">
                {!isChecking ? (
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center space-x-2 uppercase tracking-wider"
                  >
                    <Zap className="w-5 h-5" />
                    <span>START VALIDATION</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handlePause}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 uppercase tracking-wider"
                    >
                      {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                      <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStop}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 uppercase tracking-wider"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>STOP</span>
                    </button>
                  </>
                )}
              </div>

              {/* Progress */}
              {isChecking && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm tracking-wider">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-cyan-400">{processedCount}/{totalCards} ({Math.round((processedCount/totalCards)*100)}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(processedCount/totalCards)*100}%` }}
                    ></div>
                  </div>
                  {currentCard && (
                    <div className="text-xs text-gray-400 tracking-wider">
                      Currently checking: <span className="text-cyan-400 font-mono">{currentCard}</span>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Results Section */}
          <div className="bg-gray-900/50 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Filter className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-bold text-cyan-400 tracking-wider">VALIDATION RESULTS</h2>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-green-500/30">
                <div className="text-2xl font-bold text-green-400">{approvedCount}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Approved</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-red-500/30">
                <div className="text-2xl font-bold text-red-400">{declinedCount}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Declined</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-yellow-500/30">
                <div className="text-2xl font-bold text-yellow-400">{checkingCount}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Checking</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-cyan-500/30">
                <div className="text-2xl font-bold text-cyan-400">{results.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Total</div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all uppercase tracking-wider ${
                  filter === 'all' 
                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all uppercase tracking-wider ${
                  filter === 'approved' 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Approved ({approvedCount})
              </button>
              <button
                onClick={() => setFilter('declined')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all uppercase tracking-wider ${
                  filter === 'declined' 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Declined ({declinedCount})
              </button>
            </div>

            {/* Results Display */}
            <div 
              ref={resultsRef}
              className="bg-gray-800/30 rounded-lg p-4 h-96 overflow-y-auto space-y-3 border border-gray-700/50"
            >
              {filteredResults.length === 0 ? (
                <div className="text-center py-12">
                  <Terminal className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 tracking-wider">No validation results yet</p>
                  <p className="text-gray-500 text-sm tracking-wider">Submit cards to see results here</p>
                </div>
              ) : (
                filteredResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 backdrop-blur-sm ${
                      result.status === 'approved' 
                        ? 'bg-green-900/20 border-green-400 shadow-lg shadow-green-500/10' 
                        : result.status === 'declined'
                        ? 'bg-red-900/20 border-red-400 shadow-lg shadow-red-500/10'
                        : 'bg-yellow-900/20 border-yellow-400 shadow-lg shadow-yellow-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {result.status === 'approved' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : result.status === 'declined' ? (
                          <XCircle className="w-5 h-5 text-red-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-400 animate-spin" />
                        )}
                        <span className={`text-sm font-bold uppercase tracking-wider ${
                          result.status === 'approved' ? 'text-green-400' : 
                          result.status === 'declined' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {result.status === 'approved' ? '𝐀𝐩𝐩𝐫𝐨𝐯𝐞𝐝 ✅' : 
                           result.status === 'declined' ? '𝗗𝗲𝗰𝗹𝗶𝗻𝗲𝗱 ❌' : 'Checking...'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 tracking-wider">{result.timestamp}</span>
                    </div>
                    
                    <div className="space-y-1 text-sm font-mono">
                      <div><span className="text-cyan-400 font-bold">𝗖𝗮𝗿𝗱-</span> {result.card}</div>
                      <div><span className="text-cyan-400 font-bold">𝐆𝐚𝐭𝐞𝐰𝐚𝐲-</span> {result.gateway}</div>
                      <div><span className="text-cyan-400 font-bold">𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞-</span> {result.response}</div>
                      
                      {result.cardInfo && (
                        <>
                          <div><span className="text-cyan-400 font-bold">𝗜𝗻𝗳𝗼-</span> {result.cardInfo.type} - {result.cardInfo.brand}</div>
                          <div><span className="text-cyan-400 font-bold">𝐁𝐚𝐧𝐤-</span> {result.cardInfo.bank}</div>
                          <div><span className="text-cyan-400 font-bold">𝐂𝐨𝐮𝐧𝐭𝐫𝐲-</span> {result.cardInfo.country} - {result.cardInfo.flag} - {result.cardInfo.currency}</div>
                        </>
                      )}
                      
                      {result.processingTime && (
                        <div><span className="text-cyan-400 font-bold">𝗧𝗶𝗺𝗲-</span> {result.processingTime}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #06b6d4, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #06b6d4, #8b5cf6);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  );
}

export default App;