"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthModal({
  mode,
  onClose,
}: {
  mode: 'login' | 'register';
  onClose: () => void;
}) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (showOtp && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((p) => p - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [showOtp, resendTimer]);

  useEffect(() => {
    if (showOtp) setResendTimer(10);
  }, [showOtp]);

  const getNameErrorMessage = (v: string) =>
    !v ? 'Please enter your username.' : '';

  const getEmailErrorMessage = (v: string) =>
    !v
      ? 'Please enter your email.'
      : !v.endsWith('@gmail.com')
      ? 'Only @gmail.com addresses are supported.'
      : '';

  const getPasswordErrorMessage = (v: string) =>
    !v
      ? 'Please enter your password.'
      : v.length < 6
      ? 'Password must be at least 6 characters.'
      : '';

  const getConfirmPasswordErrorMessage = (v: string) =>
    !v
      ? 'Please confirm your password.'
      : v.length < 6
      ? 'Password must be at least 6 characters.'
      : '';

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await handleSubmitInner();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInner = async () => {
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      otp: '',
    };

    setErrors(newErrors);

    let hasError = false;

    newErrors.email = getEmailErrorMessage(email);
    if (newErrors.email) hasError = true;

    newErrors.password = getPasswordErrorMessage(password);
    if (newErrors.password) hasError = true;

    if (mode === 'register') {
      newErrors.name = getNameErrorMessage(name);
      if (newErrors.name) hasError = true;

      newErrors.confirmPassword =
        getConfirmPasswordErrorMessage(confirmPassword);

      if (newErrors.confirmPassword) hasError = true;

      if (hasError) {
        setErrors(newErrors);
        return;
      }
    }

    if (mode === 'login' && !showOtp) {
      const emailMsg = getEmailErrorMessage(email);
      const passMsg = getPasswordErrorMessage(password);

      if (emailMsg || passMsg) {
        setErrors({
          ...errors,
          email: emailMsg,
          password: passMsg,
        });

        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({
          ...errors,
          email: ' ',
          password: 'Invalid email or password',
        });

        return;
      }

      if (data.requiresOtp) {
        setShowOtp(true);
      } else {
        sessionStorage.setItem('user', JSON.stringify(data.user));

        window.dispatchEvent(new Event('user-changed'));

        await new Promise((r) => setTimeout(r, 800));

        setSuccess(true);

        setTimeout(() => {
          onClose();
          router.push('/home');
        }, 1500);
      }
    }

    if (showOtp) {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors((p) => ({
          ...p,
          otp: 'Invalid OTP. Please try again.',
        }));

        return;
      }

      sessionStorage.setItem('user', JSON.stringify(data.user));

      window.dispatchEvent(new Event('user-changed'));

      await new Promise((r) => setTimeout(r, 800));

      setSuccess(true);

      setTimeout(() => {
        onClose();
        router.push('/home');
      }, 1500);
    }

    if (mode === 'register' && !showOtp) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && data.errors.fieldErrors) {
          const f = data.errors.fieldErrors;

          setErrors({
            name: f.name ? f.name[0] : '',
            email: f.email ? f.email[0] : '',
            password: f.password ? f.password[0] : '',
            confirmPassword: f.confirmPassword
              ? f.confirmPassword[0]
              : '',
            otp: '',
          });
        } else if (data.message) {
          const lm = data.message.toLowerCase();

          if (lm.includes('email') || lm.includes('gmail')) {
            setErrors((p) => ({
              ...p,
              email: data.message,
            }));
          } else {
            setErrors((p) => ({
              ...p,
              password: data.message,
            }));
          }
        }

        return;
      }

      if (data.requiresOtp) {
        setShowOtp(true);
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setLoading(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      if (res.ok) {
        setResendTimer(10);
        setOtp('');

        setErrors((p) => ({
          ...p,
          otp: '',
        }));
      } else {
        const data = await res.json();

        setErrors((p) => ({
          ...p,
          otp: data.message || 'Failed to resend OTP.',
        }));
      }
    } catch {
      setErrors((p) => ({
        ...p,
        otp: 'An error occurred. Please try again.',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-2000 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white/95 backdrop-blur-xl border border-white p-8 sm:p-10 rounded-3xl w-full max-w-105 shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-400 hover:text-red-500 hover:bg-gray-500/10 rounded-full transition-all duration-300 z-50 p-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          <AnimatePresence>
            {loading && !success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-40 rounded-3xl"
              >
                <div className="w-12 h-12 border-4 border-gray-100 border-t-[#5d88bd] rounded-full animate-spin"></div>
                <p className="text-sm text-gray-600 mt-4 font-semibold tracking-wide">Processing...</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-3xl"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm"
                >
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {mode === 'login' ? 'Welcome Back!' : 'Welcome!'}
                </h3>
                <p className="text-gray-500 font-medium text-center">
                  {mode === 'login' ? 'Login successful.' : 'Account created successfully.'}<br/>Redirecting to your dashboard...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-8 text-center mt-2 relative z-30">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {showOtp ? 'Verification' : mode === 'login' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-sm text-gray-500 mt-3 font-medium px-4">
              {showOtp 
                ? `Enter the 6-digit code sent to ${email}`
                : mode === 'login'
                ? 'Enter your details to access your account.'
                : 'Join us and optimize your factory today.'}
            </p>
          </div>

          <div className="relative z-30">
            {!showOtp ? (
              <div className="flex flex-col gap-4">
                {mode === 'register' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setErrors((p) => ({ ...p, name: getNameErrorMessage(name) }))}
                      className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all focus:bg-white ${errors.name ? 'border-red-300 focus:ring-red-400 bg-red-50/30' : 'border-gray-200 focus:ring-[#5d88bd] focus:border-transparent'}`}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{errors.name}</p>}
                  </div>
                )}

                <div>
                  <input
                    type="email"
                    placeholder="Email (@gmail.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setErrors((p) => ({ ...p, email: getEmailErrorMessage(email) }))}
                    className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all focus:bg-white ${errors.email ? 'border-red-300 focus:ring-red-400 bg-red-50/30' : 'border-gray-200 focus:ring-[#5d88bd] focus:border-transparent'}`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{errors.email}</p>}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setErrors((p) => ({ ...p, password: getPasswordErrorMessage(password) }))}
                    className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all focus:bg-white ${errors.password ? 'border-red-300 focus:ring-red-400 bg-red-50/30' : 'border-gray-200 focus:ring-[#5d88bd] focus:border-transparent'}`}
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{errors.password}</p>}
                </div>

                {mode === 'register' && (
                  <div>
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setErrors((p) => ({ ...p, confirmPassword: getConfirmPasswordErrorMessage(confirmPassword) }))}
                      className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all focus:bg-white ${errors.confirmPassword ? 'border-red-300 focus:ring-red-400 bg-red-50/30' : 'border-gray-200 focus:ring-[#5d88bd] focus:border-transparent'}`}
                    />
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{errors.confirmPassword}</p>}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  className="w-full mt-4 bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  {mode === 'login' ? 'Login' : 'Create account'}
                </button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={`w-full px-4 py-4 bg-gray-50 border rounded-xl text-center text-2xl tracking-[0.5em] font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 transition-all focus:bg-white ${errors.otp ? 'border-red-300 focus:ring-red-400 bg-red-50/30' : 'border-gray-200 focus:ring-[#5d88bd] focus:border-transparent'}`}
                    maxLength={6}
                  />
                  {errors.otp && <p className="text-xs text-red-500 mt-2 text-center font-medium">{errors.otp}</p>}
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full mt-2 bg-[#5d88bd] text-white font-bold py-3.5 rounded-xl hover:bg-[#4a72a4] shadow-md hover:shadow-lg transition-all"
                >
                  Verify Code
                </button>

                <div className="text-center mt-3">
                  <button
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className={`text-sm font-medium transition-colors ${resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-[#5d88bd]'}`}
                  >
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}