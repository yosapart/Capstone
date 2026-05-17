"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-2xl w-[370px] flex flex-col items-center space-y-4 shadow-xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && !success && (
          <div
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl"
            style={{ animation: 'fadeIn 0.2s ease' }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #1594dd',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />

            <p className="text-sm text-gray-500 mt-3 font-medium">
              Processing...
            </p>
          </div>
        )}

        {success && (
          <div
            className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-2xl"
            style={{
              animation:
                'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-800">
              {mode === 'login' ? 'Welcome Back!' : 'Welcome!'}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {mode === 'login'
                ? 'Login successful'
                : 'Sign up success'}
            </p>

            <style>{`
              @keyframes scaleUp {
                from {
                  opacity: 0;
                  transform: scale(0.8);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }

              @keyframes spin {
                to {
                  transform: rotate(360deg);
                }
              }

              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        )}

        <h2 className="text-[22px] font-bold text-center text-[#34495e]">
          {showOtp
            ? 'OTP Verification'
            : mode === 'login'
            ? '─ Login ─'
            : '─ Sign up ─'}
        </h2>

        {!showOtp ? (
          <>
            {mode === 'register' && (
              <div className="w-[275px] min-h-[65px] flex flex-col items-start">
                <input
                  className={`border w-[275px] p-3 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? 'border-red-500 focus:ring-red-400 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-400'
                  }`}
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() =>
                    setErrors((p) => ({
                      ...p,
                      name: getNameErrorMessage(name),
                    }))
                  }
                />

                <div className="h-2 mt-1.5">
                  {errors.name && (
                    <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="w-[275px] min-h-[65px] flex flex-col items-start">
              <input
                className={`border w-[275px] p-3 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-400 bg-red-50'
                    : 'border-gray-300 focus:ring-blue-400'
                }`}
                placeholder="Email (@gmail.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() =>
                  setErrors((p) => ({
                    ...p,
                    email: getEmailErrorMessage(email),
                  }))
                }
              />

              <div className="h-2 mt-1.5">
                {errors.email && (
                  <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="w-[275px] min-h-[65px] flex flex-col items-start">
              <input
                className={`border w-[275px] p-3 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  errors.password
                    ? 'border-red-500 focus:ring-red-400 bg-red-50'
                    : 'border-gray-300 focus:ring-blue-400'
                }`}
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() =>
                  setErrors((p) => ({
                    ...p,
                    password: getPasswordErrorMessage(password),
                  }))
                }
              />

              <div className="h-2 mt-1.5">
                {errors.password && (
                  <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {mode === 'register' && (
              <div className="w-[275px] min-h-[65px] flex flex-col items-start">
                <input
                  className={`border w-[275px] p-3 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.confirmPassword
                      ? 'border-red-500 focus:ring-red-400 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-400'
                  }`}
                  placeholder="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  onBlur={() =>
                    setErrors((p) => ({
                      ...p,
                      confirmPassword:
                        getConfirmPasswordErrorMessage(
                          confirmPassword
                        ),
                    }))
                  }
                />

                <div className="h-2 mt-1.5">
                  {errors.confirmPassword && (
                    <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center">
              <button
                onClick={handleSubmit}
                className="my-2 bg-[#1594dd] h-[2.75rem] cursor-pointer text-white px-8 py-2 rounded-full font-semibold hover:bg-[#1973c8] transition-all"
              >
                {mode === 'login'
                  ? 'Login'
                  : 'Create account'}
              </button>
            </div>
          </>
        ) : (
          <div className="w-[275px] flex flex-col items-start">
            <input
              className={`border w-[275px] p-3 rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.otp
                  ? 'border-red-500 focus:ring-red-400 bg-red-50'
                  : 'border-gray-300 focus:ring-blue-400'
              }`}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <div className="h-2 mt-1.5">
              {errors.otp && (
                <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">
                  {errors.otp}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSubmit}
                className="text-sm text-gray-500 underline cursor-pointer"
              >
                Verify
              </button>

              <button
                onClick={handleResendOtp}
                className="text-sm text-gray-500 cursor-pointer"
              >
                {resendTimer > 0
                  ? `Resend (${resendTimer})`
                  : 'Resend'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}