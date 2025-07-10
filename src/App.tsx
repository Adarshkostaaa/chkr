import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, CheckCircle, XCircle, Eye, EyeOff, Zap, Lock } from 'lucide-react';

function App() {
  // ✅ Secure login states
  const [accessCode, setAccessCode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ✅ Card checker states
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [validation, setValidation] = useState({
    isValid: false,
    type: 'Unknown',
    errors: [] as string[]
  });
  const [showCvv, setShowCvv] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // ✅ Handle secure login
  const handleLogin = async () => {
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: accessCode }),
      });

      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError('Invalid access code. Try again.');
      }
    } catch (err) {
      setLoginError('Server error.');
    }
  };

  // ✅ Card checker helpers
  const detectCardType = (number: string) => {
    const n = number.replace(/\s/g, '');
    if (/^4/.test(n)) return 'Visa';
    if (/^5[1-5]/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'American Express';
    if (/^6(?:011|5)/.test(n)) return 'Discover';
    return 'Unknown';
  };

  const validateLuhn = (number: string) => {
    const n = number.replace(/\s/g, '');
    let sum = 0;
    let isEven = false;
    for (let i = n.length - 1; i >= 0; i--) {
      let d = parseInt(n[i]);
      if (isEven) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const validateExpiry = (expiry: string) => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [m, y] = expiry.split('/').map(Number);
    const now = new Date();
    const cy = now.getFullYear() % 100;
    const cm = now.getMonth() + 1;
    return m >= 1 && m <= 12 && (y > cy || (y === cy && m >= cm));
  };

  const validateCvv = (cvv: string, type: string) => {
    return type === 'American Express' ? /^\d{4}$/.test(cvv) : /^\d{3}$/.test(cvv);
  };

  const validateCard = () => {
    const errors: string[] = [];
    const type = detectCardType(cardInfo.number);
    const cleanNumber = cardInfo.number.replace(/\s/g, '');

    if (!cleanNumber) errors.push('Card number is required');
    else if (cleanNumber.length < 13 || cleanNumber.length > 19) errors.push('Card number must be 13-19 digits');
    else if (!validateLuhn(cleanNumber)) errors.push('Invalid card number');

    if (!cardInfo.expiry) errors.push('Expiry date is required');
    else if (!validateExpiry(cardInfo.expiry)) errors.push('Invalid or expired date');

    if (!cardInfo.cvv) errors.push('CVV is required');
    else if (!validateCvv(cardInfo.cvv, type)) errors.push('CVV incorrect');

    if (!cardInfo.name.trim()) errors.push('Name required');
    else if (cardInfo.name.trim().length < 2) errors.push('Name too short');

    return { isValid: errors.length === 0, type, errors };
  };

  const handleInputChange = (field: string, value: string) => {
    let v = value;
    if (field === 'number') v = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().substr(0, 19);
    if (field === 'expiry') v = value.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2').substr(0, 5);
    if (field === 'cvv') v = value.replace(/\D/g, '').substr(0, 4);
    if (field === 'name') v = value.replace(/[^a-zA-Z\s]/g, '');
    setCardInfo(prev => ({ ...prev, [field]: v }));
  };

  const performCheck = async () => {
    setIsChecking(true);
    await new Promise(r => setTimeout(r, 2000));
    setValidation(validateCard());
    setLastChecked(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    setValidation(validateCard());
  }, [cardInfo]);

  // ✅ Render
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white">
      {!authenticated ? (
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow">
          <h2 className="text-2xl mb-4 flex items-center gap-2"><Lock className="w-5 h-5" /> Secure Access</h2>
          <input
            type="password"
            placeholder="Enter Access Code"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-700 rounded"
          />
          <button
            onClick={handleLogin}
            className="w-full p-3 bg-cyan-600 rounded hover:bg-cyan-700"
          >
            Authenticate
          </button>
          {loginError && <p className="text-red-400 mt-2">{loginError}</p>}
        </div>
      ) : (
        <div className="max-w-2xl w-full bg-gray-800 p-8 rounded-lg shadow">
          <h2 className="text-2xl mb-6 flex items-center gap-2"><Shield className="w-5 h-5" /> Card Validator</h2>
          <div className="grid gap-4 mb-6">
            <input
              placeholder="Card Number"
              value={cardInfo.number}
              onChange={e => handleInputChange('number', e.target.value)}
              className="w-full p-3 bg-gray-700 rounded"
            />
            <input
              placeholder="MM/YY"
              value={cardInfo.expiry}
              onChange={e => handleInputChange('expiry', e.target.value)}
              className="w-full p-3 bg-gray-700 rounded"
            />
            <div className="flex gap-4">
              <input
                placeholder="CVV"
                type={showCvv ? 'text' : 'password'}
                value={cardInfo.cvv}
                onChange={e => handleInputChange('cvv', e.target.value)}
                className="flex-1 p-3 bg-gray-700 rounded"
              />
              <button onClick={() => setShowCvv(!showCvv)}>
                {showCvv ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <input
              placeholder="Name"
              value={cardInfo.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className="w-full p-3 bg-gray-700 rounded"
            />
          </div>
          <button
            onClick={performCheck}
            disabled={isChecking}
            className="w-full p-3 bg-cyan-600 rounded hover:bg-cyan-700 flex items-center justify-center gap-2"
          >
            {isChecking ? 'Checking...' : <> <Zap className="w-4 h-4" /> Validate Card </>}
          </button>
          <div className="mt-6">
            <p>Card Type: {validation.type}</p>
            <p>Status: {validation.isValid ? '✅ Valid' : '❌ Invalid'}</p>
            {validation.errors.map((err, i) => <p key={i} className="text-red-400">{err}</p>)}
            {lastChecked && <p className="text-sm text-gray-400 mt-2">Last Checked: {lastChecked.toLocaleTimeString()}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
