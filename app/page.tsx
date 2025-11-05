"use client";
import React, { useState, useEffect, useRef, FC, ChangeEvent, FormEvent } from 'react';
import { 
  ArrowLeft, Menu, Bell, Grid, User, Clock, Wallet, 
  MessageCircle, LogOut, X, Plus, LucideIcon 
} from 'lucide-react';

// ============ TYPE DEFINITIONS ============

interface FormDataType {
  firstName: string;
  lastName: string;
  state: string;
  city: string;
  discom: string;
  locality: string;
  pinCode: string;
  meterNumber: string;
  connectionNumber: string;
  meteringCategory: string;
  solarCapacity: string;
}

interface BidFormDataType {
  partnerId: string;
  startDate: string;
  endDate: string;
  fromDate: string;
  toDate: string;
  period: string;
  units: string;
  bidRate: string;
}

interface BidFormErrorsType {
  units?: string;
  bidRate?: string;
}

interface NotificationType {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
}

interface VPADataType {
  vpa: string;
  username: string;
}

interface MenuItemType {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface AccountDetailType {
  label: string;
  value: string;
}


type UserType = 'prosumer' | 'consumer' | 'install' | '';
type ToastType = 'success' | 'error' | '';
type CurrentScreenType = 
  | 'welcome' 
  | 'login' 
  | 'otp' 
  | 'userType' 
  | 'prosumerReg' 
  | 'regConfirmation' 
  | 'dashboard' 
  | 'p2pBidding' 
  | 'account' 
  | 'bidHistory' 
  | 'myWallet' 
  | 'editAccountDetails' 
  | 'updateVPA';

// ============ MAIN COMPONENT ============

const P2PEnergyApp: FC = () => {
  // ============ MAIN STATE ============
  const [currentScreen, setCurrentScreen] = useState<CurrentScreenType>('welcome');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [timer, setTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<ToastType>('');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [activeMenuId, setActiveMenuId] = useState<string>('dashboard');
  const [logoutConfirmation, setLogoutConfirmation] = useState<boolean>(false);

  // Buy/Redeem Tokens Modals
  const [buyTokensModal, setBuyTokensModal] = useState<boolean>(false);
  const [redeemTokensModal, setRedeemTokensModal] = useState<boolean>(false);
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [cbdcConnecting, setCbdcConnecting] = useState<boolean>(false);
  const [cbdcError, setCbdcError] = useState<string>('');
  const [vpaExists, setVpaExists] = useState<boolean>(false);

  // P2P Bidding State
  const [bidCategory, setBidCategory] = useState<string>('');
  const [bidFormData, setBidFormData] = useState<BidFormDataType>({
    partnerId: '',
    startDate: '',
    endDate: '',
    fromDate: '',
    toDate: '',
    period: '',
    units: '',
    bidRate: ''
  });
  const [bidFormErrors, setBidFormErrors] = useState<BidFormErrorsType>({});

  // Registration Form State
  const [formData, setFormData] = useState<FormDataType>({
    firstName: '',
    lastName: '',
    state: '',
    city: '',
    discom: '',
    locality: '',
    pinCode: '',
    meterNumber: '',
    connectionNumber: '',
    meteringCategory: '',
    solarCapacity: ''
  });

  const otpInputRef = useRef<HTMLInputElement>(null);
  const logoUrl: string = "https://i.postimg.cc/cgT3Vmrk/image.png";

  // ============ DATA ============
  const statesCities: Record<string, string[]> = {
    "Andhra Pradesh": ["Hyderabad", "Vijayawada", "Visakhapatnam"],
    "Karnataka": ["Bangalore", "Mysore", "Mangalore"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
    "Delhi": ["New Delhi", "East Delhi", "South Delhi"]
  };

  const discomOptions: string[] = ["BESCOM", "CESC", "HESCOM", "GESCOM", "MESCOM"];
  const meteringOptions: string[] = ["Net Metering", "Gross Metering"];
  const bidCategoryOptions: string[] = ["Preferential Exchange of Energy", "Monthly", "Day ahead"];
  const monthOptions: string[] = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const sampleNotifications: NotificationType[] = [
    { 
      id: 1, 
      title: "Energy Supply Recorded", 
      message: "Your solar panel has successfully supplied 25 kWh of energy to the grid today. This is a detailed notification with more information.", 
      isRead: false 
    },
    { 
      id: 2, 
      title: "Payment Received", 
      message: "Payment of ₹ 1,250 received for energy supplied this week.", 
      isRead: true 
    },
    { 
      id: 3, 
      title: "System Update", 
      message: "Platform maintenance scheduled for tomorrow at 2 AM IST.", 
      isRead: true 
    }
  ];

  // ============ UTILITY FUNCTIONS ============
  const getNextDate = (): string => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    return tomorrow.toLocaleDateString('en-GB');
  };

  const getNextMonth = (): string => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const nextMonth = (currentMonth + 1) % 12;
    return monthOptions[nextMonth];
  };

  const validateBidForm = (): boolean => {
    const errors: BidFormErrorsType = {};
    
    if (bidFormData.units && parseFloat(bidFormData.units) > 500) {
      errors.units = "Number of units must be less than or equal to 500.";
    }
    
    if (bidFormData.bidRate) {
      const rate = parseFloat(bidFormData.bidRate);
      if (rate < 3 || rate > 5.9) {
        errors.bidRate = "Bid rate must be between ₹ 3 and ₹ 5.9";
      }
    }
    
    setBidFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhoneChange = (value: string): void => {
    const cleaned = value.replace(/\D/g, '');
    if (value && !/^\d*$/.test(value)) {
      setPhoneError('Only numbers allowed');
    } else if (cleaned.length > 10) {
      return;
    } else if (cleaned.length > 0 && cleaned.length < 10) {
      setPhoneError('Mobile number should be 10 digits long');
    } else {
      setPhoneError('');
    }
    setPhoneNumber(cleaned);
  };

  const handleOtpChange = (value: string): void => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 6) {
      setOtp(cleaned);
    }
  };

  const handleGetOtp = (): void => {
    if (phoneNumber.length === 10 && agreedToTerms && !phoneError) {
      setCurrentScreen('otp');
      setTimer(30);
      setCanResend(false);
    }
  };

  const handleResendOtp = (): void => {
    if (canResend) {
      setTimer(30);
      setCanResend(false);
      setOtp('');
      showToast('OTP sent successfully', 'success');
    }
  };

  const showToast = (message: string, type: ToastType): void => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
      setToastType('');
    }, 3000);
  };

  const handleContinue = (): void => {
    if (otp.length === 6) {
      setCurrentScreen('userType');
    }
  };

  const handleUserTypeSelection = (type: UserType): void => {
    setSelectedUserType(type);
  };

  const handleUserTypeContinue = (): void => {
    if (selectedUserType === 'prosumer') {
      setCurrentScreen('prosumerReg');
    }
  };

  const handleFormChange = (field: keyof FormDataType, value: string): void => {
    setFormData((prevData) => {
      const updatedData = { ...prevData, [field]: value };
      
      // Reset city when state changes
      if (field === 'state') {
        updatedData.city = '';
      }
      
      return updatedData;
    });
  };

  const handlePinCodeChange = (value: string): void => {
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    handleFormChange('pinCode', cleaned);
  };
const [errors, setErrors] = useState<{ solarCapacity?: string }>({});

const handleSolarCapacityChange = (value: string): void => {
  if (/^\d*\.?\d{0,2}$/.test(value) || value === '') handleFormChange('solarCapacity', value);
  setErrors(prev => ({ ...prev, solarCapacity: value && (+value < 3 || +value > 5.9) ? 'Must be between ₹3 and ₹5.9' : '' }));
};


  const handleRegister = async (): Promise<void> => {
  const requiredFields: (keyof FormDataType)[] = [
    'firstName', 'lastName', 'state', 'city', 'discom', 'locality',
    'pinCode', 'meterNumber', 'connectionNumber', 'meteringCategory', 'solarCapacity'
  ];

  const allFilled = requiredFields.every(
    (field) => String(formData[field]).trim() !== ''
  );
  const pinCodeValid = formData.pinCode.length === 6;

  if (!allFilled) {
    alert('Please fill all required fields');
    return;
  }

  if (!pinCodeValid) {
    alert('Please enter a valid 6-digit PIN code');
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/api/prosumers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error('Failed to register prosumer');
    }

    const data = await response.json();
    console.log('Registration success:', data);

    // Move to next screen (confirmation)
    setCurrentScreen('regConfirmation');
  } catch (error) {
    console.error('Error during registration:', error);
    alert('Something went wrong. Please try again.');
  }
};


  const handleMenuItemClick = (itemId: string): void => {
    setActiveMenuId(itemId);
    if (itemId === 'support') {
      window.open("https://wa.me/918861289233", '_blank');
    } else if (itemId === 'logout') {
      setLogoutConfirmation(true);
    } else {
      setCurrentScreen(itemId as CurrentScreenType);
      setMenuOpen(false);
    }
  };

  const handleLogout = (): void => {
    setCurrentScreen('welcome');
    setMenuOpen(false);
    setLogoutConfirmation(false);
    setFormData({
      firstName: '',
      lastName: '',
      state: '',
      city: '',
      discom: '',
      locality: '',
      pinCode: '',
      meterNumber: '',
      connectionNumber: '',
      meteringCategory: '',
      solarCapacity: ''
    });
  };

  const handleBuyTokens = (): void => {
    setCbdcConnecting(true);
    setCbdcError('');
    
    setTimeout(() => {
      const success = Math.random() > 0.3;
      if (success) {
        setCbdcConnecting(false);
        setBuyTokensModal(false);
        showToast('Tokens purchased successfully', 'success');
      } else {
        setCbdcError("Couldn't open the CBDC app. Please try again later.");
        setCbdcConnecting(false);
      }
    }, 2000);
  };

  const handleRedeemTokens = (): void => {
    if (parseFloat(tokenAmount) > 0.00) {
      if (!vpaExists) {
        setCbdcError('A VPA must be created before you can redeem tokens.');
        return;
      }
      
      setCbdcConnecting(true);
      setCbdcError('');
      
      setTimeout(() => {
        const success = Math.random() > 0.3;
        if (success) {
          setCbdcConnecting(false);
          setRedeemTokensModal(false);
          showToast('Tokens redeemed successfully', 'success');
        } else {
          setCbdcError("Couldn't open the CBDC app. Please try again later.");
          setCbdcConnecting(false);
        }
      }, 2000);
    }
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  // ============ OTP TIMER EFFECT ============
  useEffect(() => {
    if (currentScreen === 'otp' && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentScreen, timer]);

  useEffect(() => {
    if (currentScreen === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [currentScreen]);


  // ============ RENDER SCREENS ============

  // Welcome Screen
  if (currentScreen === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: '#582e8d' }}>
                Peer-To-Peer Energy<br />Trading Platform
              </h1>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-48 h-auto">
                <img src={logoUrl} alt="Hunnarvi Logo" className="w-full h-auto" />
              </div>
            </div>
            <div className="text-center pt-4">
              <p className="text-gray-600 text-base">
                Please Login if you have<br />an account or register
              </p>
            </div>
            <div className="space-y-4 pt-2">
              <button 
                onClick={() => setCurrentScreen('login')}
                className="w-full text-white font-semibold py-4 rounded-xl transition-colors duration-200 shadow-md hover:opacity-90"
                style={{ backgroundColor: '#582e8d' }}
              >
                Login
              </button>
              <button className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded-xl border-2 border-gray-300 transition-colors duration-200">
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Screen
  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col">
        <div className="flex items-center justify-between p-4 shadow-sm" style={{ backgroundColor: '#582e8d' }}>
          <button onClick={() => setCurrentScreen('welcome')} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">P2P Energy Trading Platform</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <div className="flex-1 p-6 pt-12">
          <h2 className="text-3xl font-bold mb-8" style={{ color: '#582e8d' }}>Log In</h2>
          <div className="space-y-6">
            <div>
              <p className="text-gray-700 text-sm mb-2">Enter your mobile number</p>
              <p className="text-gray-500 text-sm mb-6">We will send you a 6-digit verification code.</p>
              <div className="flex items-center border-b-2 pb-2" style={{ borderColor: '#582e8d' }}>
                <span className="text-gray-700 text-lg mr-2">+91-</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handlePhoneChange(e.target.value)}
                  maxLength={10}
                  className="flex-1 bg-transparent text-gray-700 text-lg outline-none placeholder-gray-400"
                />
              </div>
              {phoneError && <p className="text-red-600 text-sm mt-2">{phoneError}</p>}
            </div>
            <div className="flex items-start justify-start space-x-3 pt-4">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAgreedToTerms(e.target.checked)}
                className="w-5 h-5 rounded border-2 cursor-pointer mt-1"
                style={{ accentColor: '#582e8d' }}
              />
              <label htmlFor="terms" className="text-gray-700 text-sm">
                I agree to the{' '}
                <a href="https://www.hunnarvi.com/" onClick={(e) => e.preventDefault()} className="font-medium hover:underline" style={{ color: '#582e8d' }}>
                  Terms & Conditions
                </a>
                {' '}and{' '}
                <a href="https://www.hunnarvi.com/" onClick={(e) => e.preventDefault()} className="font-medium hover:underline" style={{ color: '#582e8d' }}>
                  Privacy Policy
                </a>
              </label>
            </div>
            <button
              onClick={handleGetOtp}
              disabled={phoneNumber.length !== 10 || !agreedToTerms || !!phoneError}
              className="w-full py-4 rounded-xl font-semibold text-lg mt-8 transition-all text-white"
              style={{ 
                backgroundColor: '#582e8d',
                opacity: (phoneNumber.length !== 10 || !agreedToTerms || phoneError) ? 0.5 : 1,
                cursor: (phoneNumber.length !== 10 || !agreedToTerms || phoneError) ? 'not-allowed' : 'pointer'
              }}
            >
              GET OTP
            </button>
          </div>
        </div>
      </div>
    );
  }

  // OTP Screen
  if (currentScreen === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col">
        <div className="flex items-center justify-between p-4 shadow-sm relative" style={{ backgroundColor: '#582e8d', zIndex: 10 }}>
          <button onClick={() => setCurrentScreen('login')} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">P2P Energy Trading Platform</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
        {toastMessage && (
          <div 
            className="fixed top-20 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg transition-all"
            style={{
              backgroundColor: toastType === 'success' ? '#10b981' : '#ef4444',
              minWidth: '300px',
              maxWidth: '90%',
              zIndex: 1000
            }}
          >
            <p className="text-white font-medium flex-1">{toastMessage}</p>
            <button onClick={() => setToastMessage('')} className="text-white hover:opacity-80 transition-opacity">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="flex-1 p-6 pt-12">
          <h2 className="text-3xl font-bold mb-8" style={{ color: '#582e8d' }}>OTP Verification</h2>
          <div className="space-y-6">
            <div>
              <p className="text-gray-700 text-sm mb-2">Enter the OTP sent to</p>
              <p className="text-lg mb-8" style={{ color: '#582e8d' }}>+91-{phoneNumber}</p>
              <div className="mb-6">
                <input
                  ref={otpInputRef}
                  type="tel"
                  maxLength={6}
                  value={otp}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleOtpChange(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full h-16 text-center text-3xl tracking-widest bg-white border-2 rounded-lg outline-none transition-colors"
                  style={{ 
                    borderColor: otp.length === 6 ? '#582e8d' : '#d1d5db',
                    color: '#582e8d',
                    letterSpacing: '0.5em'
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-start space-x-2 pt-2">
              <p className="text-gray-600 text-sm">Didn't Receive OTP?</p>
              <button 
                onClick={handleResendOtp}
                disabled={!canResend}
                className="text-sm font-medium transition-opacity"
                style={{ 
                  color: canResend ? '#582e8d' : '#9ca3af',
                  cursor: canResend ? 'pointer' : 'not-allowed'
                }}
              >
                {canResend ? 'Resend OTP' : `Resend OTP (${timer}s)`}
              </button>
            </div>
            <button
              onClick={handleContinue}
              disabled={otp.length !== 6}
              className="w-full py-4 rounded-xl font-semibold text-lg mt-8 text-white transition-opacity"
              style={{ 
                backgroundColor: '#582e8d',
                opacity: otp.length !== 6 ? 0.5 : 1,
                cursor: otp.length !== 6 ? 'not-allowed' : 'pointer'
              }}
            >
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User Type Selection Screen
  if (currentScreen === 'userType') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col">
        <div className="flex items-center justify-between p-4 shadow-sm" style={{ backgroundColor: '#582e8d' }}>
          <button onClick={() => setCurrentScreen('otp')} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">P2P Energy Trading Platform</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <div className="flex-1 p-6 pt-12 flex flex-col">
          <h2 className="text-3xl font-bold mb-8" style={{ color: '#582e8d' }}>Select User Type</h2>
          <p className="text-gray-700 text-sm mb-6">Please select one of the following</p>
          <div className="space-y-4 flex-1 flex flex-col">
            {(['prosumer', 'consumer', 'install'] as UserType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleUserTypeSelection(type)}
                className="w-full p-6 rounded-xl border-2 transition-all"
                style={{ 
                  backgroundColor: 'white',
                  borderColor: selectedUserType === type ? '#582e8d' : '#e5e7eb',
                  boxShadow: selectedUserType === type ? '0 10px 15px -3px rgba(88, 46, 141, 0.1)' : 'none'
                }}
              >
                <h3 className="text-2xl font-semibold mb-3" style={{ color: '#582e8d' }}>
                  {type === 'prosumer' ? 'Prosumer' : type === 'consumer' ? 'Consumer' : 'Install Solar'}
                </h3>
                <p className="text-gray-600 text-base">
                  {type === 'prosumer' ? 'If you have solar installed and wish to sell' : type === 'consumer' ? 'If you wish to buy solar energy from a prosumer' : "If you don't have solar installed yet and wish to sell"}
                </p>
              </button>
            ))}
          </div>
          <button
            onClick={handleUserTypeContinue}
            disabled={!selectedUserType}
            className="w-full py-4 rounded-xl font-semibold text-lg mt-8 transition-all text-white"
            style={{ 
              backgroundColor: '#582e8d',
              opacity: !selectedUserType ? 0.5 : 1,
              cursor: !selectedUserType ? 'not-allowed' : 'pointer'
            }}
          >
            CONTINUE
          </button>
        </div>
      </div>
    );
  }

if (currentScreen === 'prosumerReg') {
    type RegistrationFieldType = {
      field: keyof FormDataType;
      label: string;
      type: string;
      options?: string[];
    };

    const registrationFields: RegistrationFieldType[] = [
      { field: 'firstName', label: 'First Name', type: 'text' },
      { field: 'lastName', label: 'Last Name', type: 'text' },
      { field: 'state', label: 'Select State', type: 'select', options: Object.keys(statesCities) },
      { field: 'city', label: 'Select City', type: 'select', options: formData.state ? statesCities[formData.state] : [] },
      { field: 'discom', label: 'Select DISCOM', type: 'select', options: discomOptions },
      { field: 'locality', label: 'Enter Locality / Area Name', type: 'text' },
      { field: 'pinCode', label: 'Enter PIN code', type: 'text' },
      { field: 'meterNumber', label: 'Meter Number', type: 'text' },
      { field: 'connectionNumber', label: 'Connection Number', type: 'text' },
      { field: 'meteringCategory', label: 'Select Metering Category', type: 'select', options: meteringOptions },
      { field: 'solarCapacity', label: 'Solar Capacity (kW)', type: 'text' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col">
        <div className="flex items-center justify-between p-4 shadow-sm sticky top-0 z-50" style={{ backgroundColor: '#582e8d' }}>
          <button onClick={() => setCurrentScreen('userType')} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">P2P Energy Trading Platform</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <div className="flex-1 p-6 pt-8 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#582e8d' }}>Enter registration details for prosumer</h2>
          <div className="space-y-6 pb-8">
            {registrationFields.map((item) => (
              <div key={item.field}>
                <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>{item.label}</p>
                {item.type === 'select' ? (
                  <>
                    <select
                      value={formData[item.field]}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                        handleFormChange(item.field, e.target.value);
                      }}
                      className="w-full bg-white border-b-2 pb-2 text-gray-700 outline-none rounded-md px-2 py-2"
                      style={{ borderColor: '#0ea5a0' }}
                      disabled={item.field === 'city' && !formData.state}
                    >
                      <option value="">-- {item.label} --</option>
                      {(item.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {item.field === 'city' && !formData.state && (
                      <p className="text-xs text-yellow-600 mt-1">Please select a state first</p>
                    )}
                  </>
                ) : (
                  <input
                    type={item.type}
                    value={formData[item.field]}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (item.field === 'pinCode') {
                        handlePinCodeChange(e.target.value);
                      } else if (item.field === 'solarCapacity') {
                        handleSolarCapacityChange(e.target.value);
                      } else {
                        handleFormChange(item.field, e.target.value);
                      }
                    }}
                    className="w-full bg-white border-b-2 pb-2 text-gray-700 outline-none rounded-md px-2 py-2"
                    style={{ borderColor: '#0ea5a0' }}
                    placeholder={item.label}
                  />
                  
                )}
                {item.field === 'solarCapacity' && errors.solarCapacity && (
    <p className="text-red-500 text-sm mt-1">{errors.solarCapacity}</p>
  )}
              </div>
            ))}
            <button
  onClick={handleRegister}
  disabled={formData.pinCode.length !== 6 || !!errors.solarCapacity}
  className="w-full py-4 rounded-xl font-semibold text-lg mt-8 text-white transition-all"
  style={{
    backgroundColor: '#582e8d',
    opacity: formData.pinCode.length !== 6 || !!errors.solarCapacity ? 0.5 : 1,
    cursor: formData.pinCode.length !== 6 || !!errors.solarCapacity ? 'not-allowed' : 'pointer'
  }}
>
  REGISTER
</button>
          </div>
        </div>
      </div>
    );
  }



  // Registration Confirmation Screen
  if (currentScreen === 'regConfirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col">
        <div className="flex items-center justify-between p-4 shadow-sm" style={{ backgroundColor: '#582e8d' }}>
          <button onClick={() => setCurrentScreen('prosumerReg')} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">Registration Status</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-md">
            <h2 className="text-3xl font-bold" style={{ color: '#1e293b' }}>Your registration for the P2P platform is almost complete</h2>
            <p className="text-gray-600 text-base leading-relaxed">To ensure only authorized users manage their meters, we will send a confirmation email to you. Once confirmed, you will be able to log in.</p>
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className="w-full py-4 rounded-xl font-semibold text-lg mt-8 text-white transition-all"
              style={{ backgroundColor: '#582e8d' }}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Screen
  if (currentScreen === 'dashboard') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f3f4f6' }}>
        <div className="flex items-center justify-between p-4 shadow-sm sticky top-0 z-50" style={{ backgroundColor: '#582e8d' }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-white">
              <Menu size={24} />
            </button>
            <button onClick={() => setNotificationsOpen(true)} className="text-white">
              <Bell size={24} />
            </button>
          </div>
          <h1 className="text-white text-lg font-medium flex-1 text-center">Hunnarvi P2P Dashboard</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>

        {menuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={() => setMenuOpen(false)} />
        )}

        {menuOpen && (
          <div className="fixed left-0 top-0 h-screen w-[70%] bg-white z-50 flex flex-col shadow-lg transform transition-transform" style={{ backgroundColor: '#582e8d' }}>
            <div className="flex items-center justify-between p-4" style={{ backgroundColor: '#582e8d' }}>
              <h2 className="text-white text-lg font-medium">Menu</h2>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
              </div>
            </div>
            <div className="flex-1 bg-white p-6">
              <div className="space-y-3">
                {(
                  [
                    { id: 'dashboard', label: 'Dashboard', icon: Grid },
                    { id: 'account', label: 'Account', icon: User },
                    { id: 'bidHistory', label: 'Bid History', icon: Clock },
                    { id: 'myWallet', label: 'My Wallet', icon: Wallet },
                    { id: 'support', label: 'Support', icon: MessageCircle },
                    { id: 'logout', label: 'Logout', icon: LogOut }
                  ] as MenuItemType[]
                ).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.id)}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-left transition-all"
                      style={{
                        background: activeMenuId === item.id ? 'linear-gradient(90deg, #de8427, #e6c13f)' : 'transparent',
                        color: activeMenuId === item.id ? '#ffffff' : '#1f2937'
                      }}
                    >
                      <Icon size={20} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: '#582e8d' }}>Your Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="p-6 rounded-lg shadow-md" style={{ background: 'linear-gradient(90deg, #de8427, #e6c13f)' }}>
              <p className="text-yellow-100 text-sm mb-2">Supplied this Week</p>
              <p className="text-white text-3xl font-bold mb-4">0.00 kWh</p>
              <p className="text-yellow-100 text-sm mb-1">with an Avg Price of</p>
              <p className="text-white text-2xl font-semibold">₹ 0.00</p>
            </div>
            <div className="p-6 rounded-lg shadow-md" style={{ background: 'linear-gradient(90deg, #de8427, #e6c13f)' }}>
              <p className="text-yellow-100 text-sm mb-2">Total Supplied</p>
              <p className="text-white text-3xl font-bold mb-4">0.00 kWh</p>
              <p className="text-yellow-100 text-sm mb-1">with an Avg Price of</p>
              <p className="text-white text-2xl font-semibold">₹ 0.00</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-8" style={{ color: '#582e8d' }}>Hunnarvi Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="p-6 rounded-lg shadow-md" style={{ background: 'linear-gradient(90deg, #de8427, #e6c13f)' }}>
              <p className="text-yellow-100 text-sm mb-2">Supplied this Week</p>
              <p className="text-white text-3xl font-bold mb-4">90.00 kWh</p>
              <p className="text-yellow-100 text-sm mb-1">with an Avg Price of</p>
              <p className="text-white text-2xl font-semibold">₹ 4.36</p>
            </div>
            <div className="p-6 rounded-lg shadow-md" style={{ background: 'linear-gradient(90deg, #de8427, #e6c13f)' }}>
              <p className="text-yellow-100 text-sm mb-2">Total Supplied</p>
              <p className="text-white text-3xl font-bold mb-4">892.00 kWh</p>
              <p className="text-yellow-100 text-sm mb-1">with an Avg Price of</p>
              <p className="text-white text-2xl font-semibold">₹ 4.41</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentScreen('p2pBidding')}
            className="w-full py-4 rounded-xl font-semibold text-lg text-white transition-all mb-8"
            style={{ backgroundColor: '#582e8d' }}
          >
            SELL
          </button>
        </div>
      </div>
    );
  }

  // P2P Bidding Screen
  if (currentScreen === 'p2pBidding') {
    const showFields = bidCategory !== '';
    
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center justify-between p-4 shadow-sm sticky top-0 z-50" style={{ backgroundColor: '#582e8d' }}>
          <button onClick={() => setCurrentScreen('dashboard')} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">P2P Bidding</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="p-4 rounded-lg mb-6" style={{ background: 'linear-gradient(90deg, #de8427, #e6c13f)' }}>
            <p className="text-center text-gray-800 font-semibold text-lg">Bid Type - Sell</p>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Select Bid Category</p>
              <select
                value={bidCategory}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  setBidCategory(e.target.value);
                  setBidFormData({ partnerId: '', startDate: '', endDate: '', fromDate: '', toDate: '', period: '', units: '', bidRate: '' });
                  setBidFormErrors({});
                }}
                className="w-full bg-transparent border-b-2 pb-2  text-lg outline-none"
                style={{ borderColor: '#0ea5a0' }}
              >
                <option value="">-- Choose category --</option>
                {bidCategoryOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {showFields && bidCategory === 'Preferential Exchange of Energy' && (
              <>
                <div>
                  <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Enter Partner's Customer ID</p>
                  <input
                    type="text"
                    value={bidFormData.partnerId}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setBidFormData({ ...bidFormData, partnerId: e.target.value })}
                    className="w-full bg-transparent border-b-2 pb-2  outline-none"
                    style={{ borderColor: '#0ea5a0' }}
                  />
                </div>
                <div>
                  <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Select your Start Date</p>
                  <input
                    type="date"
                    value={bidFormData.startDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setBidFormData({ ...bidFormData, startDate: e.target.value })}
                    className="w-full bg-transparent border-b-2 pb-2  outline-none"
                    style={{ borderColor: '#0ea5a0' }}
                  />
                </div>
                <div>
                  <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Select your End Date</p>
                  <input
                    type="date"
                    value={bidFormData.endDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setBidFormData({ ...bidFormData, endDate: e.target.value })}
                    className="w-full bg-transparent border-b-2 pb-2  outline-none"
                    style={{ borderColor: '#0ea5a0' }}
                  />
                </div>
              </>
            )}

            {showFields && bidCategory === 'Monthly' && (
              <div>
                <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Select from Date</p>
                <select
                  value={bidFormData.fromDate}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setBidFormData({ ...bidFormData, fromDate: e.target.value })}
                  className="w-full bg-transparent border-b-2 pb-2  outline-none"
                  style={{ borderColor: '#0ea5a0' }}
                >
                  <option value="">Select Month</option>
                  <option value={getNextMonth()}>{getNextMonth()}</option>
                </select>
              </div>
            )}

            {showFields && bidCategory === 'Day ahead' && (
              <div>
                <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Select from Date</p>
                <input
                  type="text"
                  value={getNextDate()}
                  readOnly
                  className="w-full bg-transparent border-b-2 pb-2  outline-none"
                  style={{ borderColor: '#0ea5a0' }}
                />
              </div>
            )}

            {showFields && (
              <>
                <div>
                  <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Enter Number of Units (Kwh)</p>
                  <input
                    type="number"
                    value={bidFormData.units}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setBidFormData({ ...bidFormData, units: e.target.value });
                      validateBidForm();
                    }}
                    className="w-full bg-transparent border-b-2 pb-2  outline-none"
                    style={{ borderColor: '#0ea5a0' }}
                  />
                  {bidFormErrors.units && <p className="text-red-500 text-sm mt-2">{bidFormErrors.units}</p>}
                </div>
                <div>
                  <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Enter Sell - Bid rate (₹)</p>
                  <input
                    type="number"
                    step="0.01"
                    value={bidFormData.bidRate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setBidFormData({ ...bidFormData, bidRate: e.target.value });
                      validateBidForm();
                    }}
                    className="w-full bg-transparent border-b-2 pb-2  outline-none"
                    style={{ borderColor: '#0ea5a0' }}
                  />
                  {bidFormErrors.bidRate && <p className="text-red-500 text-sm mt-2">{bidFormErrors.bidRate}</p>}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-4 p-6 bg-white border-t">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="flex-1 py-4 rounded-xl font-semibold text-lg"
            style={{ backgroundColor: '#582e8d', color: 'white' }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (validateBidForm()) {
                showToast('Bid submitted successfully', 'success');
                setCurrentScreen('dashboard');
              }
            }}
            disabled={!showFields || Object.keys(bidFormErrors).length > 0}
            className="flex-1 py-4 rounded-xl font-semibold text-lg"
            style={{
              backgroundColor: '#582e8d',
              color: 'white',
              opacity: (!showFields || Object.keys(bidFormErrors).length > 0) ? 0.5 : 1,
              cursor: (!showFields || Object.keys(bidFormErrors).length > 0) ? 'not-allowed' : 'pointer'
            }}
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  // Account Screen
  if (currentScreen === 'account') {
    const accountDetails: AccountDetailType[] = [
      { label: 'First Name', value: 'John' },
      { label: 'Last Name', value: 'Doe' },
      { label: 'Phone Number', value: '+91-9876543210' },
      { label: 'State', value: 'Karnataka' },
      { label: 'City', value: 'Bangalore' },
      { label: 'DISCOM', value: 'BESCOM' },
      { label: 'Locality', value: 'Whitefield' },
      { label: 'PIN Code', value: '560066' },
      { label: 'Meter Number', value: '1234678' },
      { label: 'Connection Number', value: '5679054332q' },
      { label: 'Metering Category', value: 'Net Metering' },
      { label: 'Solar Capacity', value: '40.00 kW' },
      { label: 'Customer ID', value: 'CUST-12345' }
    ];

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center justify-between p-4 shadow-sm sticky top-0 z-50" style={{ backgroundColor: '#582e8d' }}>
          <button onClick={() => setCurrentScreen('dashboard')} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">Account</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {accountDetails.map((item) => (
              <div key={item.label}>
                <p className="text-sm mb-1 text-gray-600">{item.label}</p>
                <p className="text-gray-800 font-medium">{item.value}</p>
                <div className="border-b border-gray-300 mt-2"></div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setCurrentScreen('editAccountDetails')}
              className="flex-1 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: '#582e8d' }}
            >
              Edit Account Details
            </button>
            <button
              onClick={() => setCurrentScreen('updateVPA')}
              className="flex-1 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: '#582e8d' }}
            >
              Update VPA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Update VPA Screen
  if (currentScreen === 'updateVPA') {
    const [vpaData, setVpaData] = React.useState<VPADataType>({ vpa: '', username: '' });

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center justify-between p-4 shadow-sm sticky top-0 z-50" style={{ backgroundColor: '#582e8d' }}>
          <button onClick={() => setCurrentScreen('account')} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">Update VPA</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Please enter your VPA details</h2>
            <div>
              <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Enter Virtual Payment Address (VPA)</p>
              <input
                type="text"
                value={vpaData.vpa}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setVpaData({ ...vpaData, vpa: e.target.value })}
                className="w-full bg-transparent border-b-2 pb-2 text-gray-800 outline-none"
                style={{ borderColor: '#0ea5a0' }}
              />
              {!vpaData.vpa && <p className="text-yellow-500 text-sm mt-2">VPA is required.</p>}
            </div>
            <div>
              <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Enter Username</p>
              <input
                type="text"
                value={vpaData.username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setVpaData({ ...vpaData, username: e.target.value })}
                className="w-full bg-transparent border-b-2 pb-2 text-gray-800 outline-none"
                style={{ borderColor: '#0ea5a0' }}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentScreen('account')}
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setVpaExists(true);
                setCurrentScreen('account');
                showToast('VPA updated successfully', 'success');
              }}
              className="flex-1 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: '#582e8d' }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit Account Details Screen
  if (currentScreen === 'editAccountDetails') {
    const [changeRequest, setChangeRequest] = React.useState<string>('');

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center justify-between p-4 shadow-sm sticky top-0 z-50" style={{ backgroundColor: '#582e8d' }}>
          <button onClick={() => setCurrentScreen('account')} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">Change Account Details Request Form</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <textarea
              value={changeRequest}
              onChange={(e) => setChangeRequest(e.target.value)}
              placeholder="Enter your account change details here..."
              className="w-full h-48 p-4 border-2 rounded-lg resize-none outline-none text-gray-800"
              style={{ borderColor: '#0ea5a0', backgroundColor: '#ffffff' }}
            />
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentScreen('account')}
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                showToast('Details saved as draft', 'success');
              }}
              className="flex-1 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: '#fbbf24', color: '#1f2937' }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setCurrentScreen('account');
                showToast('Request submitted successfully', 'success');
              }}
              className="flex-1 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: '#582e8d' }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bid History Screen
  if (currentScreen === 'bidHistory') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center justify-between p-4 shadow-sm sticky top-0 z-50" style={{ backgroundColor: '#582e8d' }}>
          <button onClick={() => setCurrentScreen('dashboard')} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">Bid History</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-2xl font-semibold text-black">No Bid History available yet.</p>
        </div>
      </div>
    );
  }

  // My Wallet Screen
  if (currentScreen === 'myWallet') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center justify-between p-4 shadow-sm sticky top-0 z-50" style={{ backgroundColor: '#582e8d' }}>
          <button onClick={() => setCurrentScreen('dashboard')} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">My Wallet</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">My Wallet</h2>
          <div className="p-6 rounded-lg mb-6 shadow-md" style={{ background: 'linear-gradient(90deg, #de8427, #e6c13f)' }}>
            <p className="text-yellow-100 text-sm mb-2">My Tokens</p>
            <p className="text-white text-3xl font-bold mb-2">0.00</p>
            <p className="text-yellow-100 text-sm mb-4">Available</p>
            <div className="flex items-center justify-between">
              <p className="text-yellow-100 text-sm">1 Token = 1₹</p>
              <Wallet size={32} className="text-white opacity-90" />
            </div>
          </div>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setBuyTokensModal(true)}
              className="flex-1 py-3 rounded-lg font-semibold text-white"
              style={{ backgroundColor: '#582e8d' }}
            >
              Buy Tokens
            </button>
            <button
              onClick={() => setRedeemTokensModal(true)}
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
            >
              Redeem Tokens
            </button>
          </div>
          <button
            className="w-full py-3 rounded-lg font-semibold text-white"
            style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
          >
            <Clock size={20} className="inline mr-2" />
            Transaction History
          </button>
        </div>

        {/* Buy Tokens Modal */}
        {buyTokensModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
              <div className="p-6" style={{ background: 'linear-gradient(90deg, #582e8d, #6b3fa0)' }}>
                <h2 className="text-white text-lg font-semibold text-center">Please enter the number of tokens you wish to buy</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Enter Number of Tokens (1 Token = 1₹)</p>
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTokenAmount(e.target.value)}
                    className="w-full bg-white border-b-2 pb-2 text-gray-800 outline-none"
                    style={{ borderColor: '#0ea5a0' }}
                  />
                </div>
                {cbdcConnecting && <p className="text-center text-white font-medium">Connecting to CBDC wallet...</p>}
                {cbdcError && <p className="text-center text-red-500 text-sm">{cbdcError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => setBuyTokensModal(false)}
                    className="flex-1 py-2 rounded-lg font-semibold"
                    style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBuyTokens}
                    disabled={cbdcConnecting}
                    className="flex-1 py-2 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: '#ffffff', color: '#582e8d', border: '1px solid #582e8d', opacity: cbdcConnecting ? 0.5 : 1 }}
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Redeem Tokens Modal */}
        {redeemTokensModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
              <div className="p-6" style={{ background: 'linear-gradient(90deg, #582e8d, #6b3fa0)' }}>
                <h2 className="text-white text-lg font-semibold text-center">Please enter the number of tokens you wish to redeem</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm mb-2" style={{ color: '#0ea5a0' }}>Enter Number of Tokens (1 Token = 1₹)</p>
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTokenAmount(e.target.value)}
                    className="w-full bg-white border-b-2 pb-2 text-gray-800 outline-none"
                    style={{ borderColor: '#0ea5a0' }}
                  />
                  {parseFloat(tokenAmount) > 0.00 && (
                    <p className="text-red-500 text-sm mt-2">Insufficient tokens available. You have 0.00 tokens available.</p>
                  )}
                </div>
                {!vpaExists && (
                  <div className="text-black text-sm">
                    <p className="mb-2">A VPA must be created before you can redeem tokens.</p>
                    <button
                      onClick={() => {
                        setRedeemTokensModal(false);
                        setCurrentScreen('updateVPA');
                      }}
                      className="text-black font-semibold flex items-center gap-1"
                    >
                      <Plus size={16} /> Add VPA
                    </button>
                  </div>
                )}
                {cbdcConnecting && <p className="text-center text-white font-medium">Connecting to CBDC wallet...</p>}
                {cbdcError && <p className="text-center text-red-500 text-sm">{cbdcError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => setRedeemTokensModal(false)}
                    className="flex-1 py-2 rounded-lg font-semibold"
                    style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRedeemTokens}
                    disabled={cbdcConnecting || parseFloat(tokenAmount) <= 0}
                    className="flex-1 py-2 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: '#ffffff', color: '#582e8d', border: '1px solid #582e8d', opacity: (cbdcConnecting || parseFloat(tokenAmount) <= 0) ? 0.5 : 1 }}
                  >
                    Redeem
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Notifications Screen
  if (notificationsOpen) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#582e8d' }}>
        <div className="flex items-center justify-between p-4 shadow-sm" style={{ backgroundColor: '#582e8d' }}>
          <button onClick={() => setNotificationsOpen(false)} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg font-medium flex-1 text-center">Notifications</h1>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="divide-y">
            {sampleNotifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: notification.isRead ? '#d1d5db' : '#582e8d' }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{truncateText(notification.message)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Logout Confirmation Modal
  if (logoutConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
          <div className="p-6" style={{ background: 'linear-gradient(90deg, #582e8d, #6b3fa0)' }}>
            <h2 className="text-white text-lg font-semibold text-center">Logout</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-center text-gray-800">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLogoutConfirmation(false)}
                className="flex-1 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded-lg font-semibold text-white"
                style={{ backgroundColor: '#ffffff', color: '#582e8d', border: '1px solid #582e8d' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default P2PEnergyApp;