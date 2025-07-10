import React, { useState, useEffect } from 'react';
import { CreditCard, Shield, CheckCircle, XCircle, Eye, EyeOff, Zap, Lock } from 'lucide-react';

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

  // Card type detection
  const detectCardType = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumber)) return 'Visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'American Express';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'Discover';
    if (/^(?:2131|1800|35\d{3})\d{11}$/.test(cleanNumber)) return 'JCB';
    if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) return 'Diners Club';
    
    return 'Unknown';
  };

  // Luhn algorithm validation
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

  // Validate expiry date
  const validateExpiry = (expiry: string): boolean => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    
    const [month, year] = expiry.split('/').map(num => parseInt(num));
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    if (month < 1 || month > 12) return false;
    if (year < currentYear || (year === currentYear && month < currentMonth)) return false;
    
    return true;
  };

  // Validate CVV
  const validateCvv = (cvv: string, cardType: string): boolean => {
    if (cardType === 'American Express') {
      return /^\d{4}$/.test(cvv);
    }
    return /^\d{3}$/.test(cvv);
  };

  // Format card number with spaces
  const formatCardNumber = (value: string): string => {
    const cleanValue = value.replace(/\s/g, '');
    const groups = cleanValue.match(/.{1,4}/g) || [];
    return groups.join(' ').substr(0, 19);
  };

  // Format expiry date
  const formatExpiry = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 2) {
      return cleanValue.substr(0, 2) + '/' + cleanValue.substr(2, 2);
    }
    return cleanValue;
  };

  // Comprehensive validation
  const validateCard = (): CardValidation => {
    const errors: string[] = [];
    const cardType = detectCardType(cardInfo.number);
    const cleanNumber = cardInfo.number.replace(/\s/g, '');

    // Card number validation
    if (!cleanNumber) {
      errors.push('Card number is required');
    } else if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      errors.push('Card number must be 13-19 digits');
    } else if (!validateLuhn(cleanNumber)) {
      errors.push('Invalid card number (failed Luhn check)');
    }

    // Expiry validation
    if (!cardInfo.expiry) {
      errors.push('Expiry date is required');
    } else if (!validateExpiry(cardInfo.expiry)) {
      errors.push('Invalid or expired date');
    }

    // CVV validation
    if (!cardInfo.cvv) {
      errors.push('CVV is required');
    } else if (!validateCvv(cardInfo.cvv, cardType)) {
      errors.push(`CVV must be ${cardType === 'American Express' ? '4' : '3'} digits`);
    }

    // Name validation
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

  // Handle input changes
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

  // Simulate checking process
  const performCheck = async () => {
    setIsChecking(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = validateCard();
    setValidation(result);
    setLastChecked(new Date());
    setIsChecking(false);
  };

  // Real-time validation
  useEffect(() => {
    const result = validateCard();
    setValidation(result);
  }, [cardInfo]);

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

  return (
    <div className="min-h-screen matrix-bg p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-cyan-400 mr-3" />
            <h1 className="text-4xl font-bold gradient-text">Card Validator</h1>
          </div>
          <p className="text-gray-300 text-lg">Advanced Credit Card Checking System</p>
          <p className="text-cyan-400 terminal-text text-sm mt-2">@config_masterr</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Card Input Form */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/20 card-hover">
            <div className="flex items-center mb-6">
              <CreditCard className="w-6 h-6 text-cyan-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Card Information</h2>
            </div>

            <div className="space-y-6">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardInfo.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-all duration-300"
                    maxLength={19}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getCardIcon(validation.type)}
                  </div>
                </div>
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={cardInfo.expiry}
                    onChange={(e) => handleInputChange('expiry', e.target.value)}
                    placeholder="MM/YY"
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-all duration-300"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CVV
                  </label>
                  <div className="relative">
                    <input
                      type={showCvv ? 'text' : 'password'}
                      value={cardInfo.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      placeholder="123"
                      className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-all duration-300"
                      maxLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCvv(!showCvv)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                      {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-all duration-300"
                />
              </div>

              {/* Check Button */}
              <button
                onClick={performCheck}
                disabled={isChecking || !cardInfo.number}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {isChecking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Validate Card</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation Results */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/20 card-hover">
            <div className="flex items-center mb-6">
              <Lock className="w-6 h-6 text-cyan-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Validation Results</h2>
            </div>

            {/* Card Type and Status */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <span className="text-gray-300">Card Type:</span>
                <div className="flex items-center space-x-2">
                  {getCardIcon(validation.type)}
                  <span className="text-white font-medium">{validation.type}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <span className="text-gray-300">Status:</span>
                <div className="flex items-center space-x-2">
                  {validation.isValid ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Valid</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-medium">Invalid</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Errors */}
            {validation.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Issues Found:</h3>
                <div className="space-y-2">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-red-300 text-sm">{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Checked */}
            {lastChecked && (
              <div className="text-center text-gray-400 text-sm terminal-text">
                Last checked: {lastChecked.toLocaleTimeString()}
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="text-cyan-300 text-sm">
                  <strong>Security Notice:</strong> This tool validates card format only. 
                  No actual card data is stored or transmitted.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>Advanced Card Validation System • Built with security in mind</p>
        </div>
      </div>
    </div>
  );
}

export default App;