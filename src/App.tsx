import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Zap
} from 'lucide-react';

interface CardValidation {
  isValid: boolean;
  type: string;
  errors: string[];
}

interface CardInfo {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

function App() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [cardInfo, setCardInfo] = useState<CardInfo>({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const [validation, setValidation] = useState<CardValidation>({
    isValid: false,
    type: 'Unknown',
    errors: []
  });

  const [showCvv, setShowCvv] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const detectCardType = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');

    if (/^4/.test(cleanNumber)) return 'Visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'American Express';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'Discover';
    return 'Unknown';
  };

  const validateLuhn = (number: string): boolean => {
    const cleanNumber = number.replace(/\s/g, '');
    if (!/^\d+$/.test(cleanNumber)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  const validateExpiry = (expiry: string): boolean => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;

    const [month, year] = expiry.split('/').map(num => parseInt(num));
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (month < 1 || month > 12) return false;
    if (year < currentYear || (year === currentYear && month < currentMonth))
      return false;

    return true;
  };

  const validateCvv = (cvv: string, cardType: string): boolean => {
    if (cardType === 'American Express') {
      return /^\d{4}$/.test(cvv);
    }
    return /^\d{3}$/.test(cvv);
  };

  const formatCardNumber = (value: string): string => {
    const cleanValue = value.replace(/\s/g, '');
    const groups = cleanValue.match(/.{1,4}/g) || [];
    return groups.join(' ').substr(0, 19);
  };

  const formatExpiry = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 2) {
      return cleanValue.substr(0, 2) + '/' + cleanValue.substr(2, 2);
    }
    return cleanValue;
  };

  const validateCard = (): CardValidation => {
    const errors: string[] = [];
    const cardType = detectCardType(cardInfo.number);
    const cleanNumber = cardInfo.number.replace(/\s/g, '');

    if (!cleanNumber) {
      errors.push('Card number is required');
    } else if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      errors.push('Card number must be 13-19 digits');
    } else if (!validateLuhn(cleanNumber)) {
      errors.push('Invalid card number (failed Luhn check)');
    }

    if (!cardInfo.expiry) {
      errors.push('Expiry date is required');
    } else if (!validateExpiry(cardInfo.expiry)) {
      errors.push('Invalid or expired date');
    }

    if (!cardInfo.cvv) {
      errors.push('CVV is required');
    } else if (!validateCvv(cardInfo.cvv, cardType)) {
      errors.push(`CVV must be ${cardType === 'American Express' ? '4' : '3'} digits`);
    }

    if (!cardInfo.name.trim()) {
      errors.push('Cardholder name is required');
    } else if (cardInfo.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    return {
      isValid: errors.length === 0,
      type: cardType,
      errors
    };
  };

  const handleInputChange = (field: keyof CardInfo, value: string) => {
    let formattedValue = value;

    if (field === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substr(0, 4);
    } else if (field === 'name') {
      formattedValue = value.replace(/[^a-zA-Z\s]/g, '');
    }

    setCardInfo(prev => ({ ...prev, [field]: formattedValue }));
  };

  const performCheck = async () => {
    setIsChecking(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const result = validateCard();
    setValidation(result);
    setLastChecked(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    const result = validateCard();
    setValidation(result);
  }, [cardInfo]);

  const handleLogin = async () => {
    setLoginError('');
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setLoginError('❌ Connection failed');
      }
    } catch (err) {
      setLoginError('❌ Server error');
    }
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'Visa':
        return <div className="text-blue-400 font-bold text-sm">VISA</div>;
      case 'Mastercard':
        return <div className="text-red-400 font-bold text-sm">MC</div>;
      case 'American Express':
        return <div className="text-green-400 font-bold text-sm">AMEX</div>;
      case 'Discover':
        return <div className="text-orange-400 font-bold text-sm">DISC</div>;
      default:
        return <CreditCard className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-black">
        <h1 className="text-3xl mb-2">SECURE ACCESS TERMINAL</h1>
        <h2 className="mb-4">@config_masterr</h2>
        <p>Enter access credentials:</p>
        <input
          type="password"
          placeholder="ACCESS CODE"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="p-2 mt-2 text-black"
        />
        <button
          onClick={handleLogin}
          className="mt-4 p-2 bg-cyan-500"
        >
          AUTHENTICATE
        </button>
        {loginError && <p className="text-red-500 mt-2">{loginError}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen matrix-bg p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl text-white">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">Card Validator</h1>
          <p className="text-gray-300">Advanced CC Checking • @config_masterr</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-gray-900 p-6 rounded-xl">
            <h2 className="text-xl mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" /> Card Info
            </h2>
            <input
              type="text"
              placeholder="Card Number"
              value={cardInfo.number}
              onChange={e => handleInputChange('number', e.target.value)}
              className="w-full p-2 mb-4 text-black"
            />
            <input
              type="text"
              placeholder="MM/YY"
              value={cardInfo.expiry}
              onChange={e => handleInputChange('expiry', e.target.value)}
              className="w-full p-2 mb-4 text-black"
            />
            <div className="flex mb-4">
              <input
                type={showCvv ? 'text' : 'password'}
                placeholder="CVV"
                value={cardInfo.cvv}
                onChange={e => handleInputChange('cvv', e.target.value)}
                className="flex-1 p-2 text-black"
              />
              <button
                onClick={() => setShowCvv(!showCvv)}
                className="ml-2 p-2 bg-gray-800"
              >
                {showCvv ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <input
              type="text"
              placeholder="Cardholder Name"
              value={cardInfo.name}
              onChange={e => handleInputChange('name', e.target.value)}
              className="w-full p-2 mb-4 text-black"
            />
            <button
              onClick={performCheck}
              disabled={isChecking}
              className="w-full p-3 bg-cyan-600 text-white"
            >
              {isChecking ? 'Checking...' : 'Validate Card'}
            </button>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl">
            <h2 className="text-xl mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2" /> Validation Results
            </h2>
            <div className="mb-4 flex justify-between">
              <span>Type:</span>
              <span>{getCardIcon(validation.type)}</span>
            </div>
            <div className="mb-4 flex justify-between">
              <span>Status:</span>
              {validation.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            {validation.errors.length > 0 && (
              <div>
                <h3 className="text-lg mb-2">Issues:</h3>
                {validation.errors.map((err, idx) => (
                  <p key={idx} className="text-red-400">{err}</p>
                ))}
              </div>
            )}
            {lastChecked && (
              <p className="mt-4 text-gray-500">
                Last Checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
