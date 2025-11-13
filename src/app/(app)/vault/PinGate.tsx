'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { hashPin, verifyPin } from '@/lib/crypto';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { logError } from '@/lib/logger';
import { doc, getDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface PinGateProps { children: React.ReactNode }
interface StoredPinData { hash: string; salt: string; version: number }
interface RateLimitData { attempts: number; lastAttempt: number; lockedUntil: number | null }

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds
const ATTEMPT_WINDOW_MS = 60000; // 1 minute window


export function PinGate({ children }: PinGateProps) {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [storedPinData, setStoredPinData] = useState<StoredPinData | null>(null);
  const [isPinSet, setIsPinSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmPin, setConfirmPin] = useState<string[]>(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pinStorageKey = useMemo(() => (user?.uid ? `user_pin_${user.uid}` : 'user_pin'), [user?.uid]);
  const rateLimitKey = useMemo(() => `${pinStorageKey}_ratelimit`, [pinStorageKey]);

  // Sync PIN to Firestore (non-blocking merge into user doc)
  const syncPinToFirestore = (pinData: StoredPinData) => {
    if (!firestore || !user) return;
    try {
      const userRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userRef, { vaultPin: { ...pinData, updatedAt: Date.now() } }, { merge: true });
    } catch {
      // Silent; security remains local even if sync fails
    }
  };

  // Check and update rate limit
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const stored = localStorage.getItem(rateLimitKey);
    let rateLimitData: RateLimitData = stored
      ? JSON.parse(stored)
      : { attempts: 0, lastAttempt: now, lockedUntil: null };

    // Check if locked out
    if (rateLimitData.lockedUntil && now < rateLimitData.lockedUntil) {
      const remainingSeconds = Math.ceil((rateLimitData.lockedUntil - now) / 1000);
      setLockoutSeconds(remainingSeconds);
      setIsLockedOut(true);
      return false;
    }

    // Reset attempts if window expired
    if (now - rateLimitData.lastAttempt > ATTEMPT_WINDOW_MS) {
      rateLimitData.attempts = 0;
    }

    rateLimitData.attempts += 1;
    rateLimitData.lastAttempt = now;

    // Lock out if max attempts reached
    if (rateLimitData.attempts >= MAX_ATTEMPTS) {
      rateLimitData.lockedUntil = now + LOCKOUT_DURATION_MS;
      setIsLockedOut(true);
      setLockoutSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
    } else {
      rateLimitData.lockedUntil = null;
    }

    localStorage.setItem(rateLimitKey, JSON.stringify(rateLimitData));
    return rateLimitData.lockedUntil === null;
  };

  const resetRateLimit = () => {
    localStorage.removeItem(rateLimitKey);
    setIsLockedOut(false);
    setLockoutSeconds(0);
  };

  // Countdown timer for lockout
  useEffect(() => {
    if (isLockedOut && lockoutSeconds > 0) {
      const timer = setTimeout(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLockedOut, lockoutSeconds]);

  useEffect(() => {
    const storedData = localStorage.getItem(pinStorageKey);
    if (storedData) {
      try {
        const parsed: StoredPinData = JSON.parse(storedData);
        setStoredPinData(parsed);
        setIsPinSet(true);
      } catch {
        // Invalid data, clear it
        localStorage.removeItem(pinStorageKey);
        setStoredPinData(null);
        setIsPinSet(false);
      }
    } else {
      setStoredPinData(null);
      setIsPinSet(false);
      // Attempt remote load if local missing
      (async () => {
        try {
          if (!firestore || !user) return;
            const userRef = doc(firestore, 'users', user.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const data = snap.data() as any;
              if (data?.vaultPin?.hash && data?.vaultPin?.salt && typeof data?.vaultPin?.version === 'number') {
                const remote: StoredPinData = {
                  hash: data.vaultPin.hash,
                  salt: data.vaultPin.salt,
                  version: data.vaultPin.version,
                };
                // Persist locally for faster subsequent auth
                localStorage.setItem(pinStorageKey, JSON.stringify(remote));
                setStoredPinData(remote);
                setIsPinSet(true);
              }
            }
        } catch {
          // Ignore remote load failures
        }
      })();
    }
    setPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setIsConfirming(false);
    setIsAuthenticated(false);
    setError(null);
    resetRateLimit();
  }, [pinStorageKey]);

  const handlePinChange = (index: number, value: string) => {
    if (isLockedOut || (!/^[0-9]$/.test(value) && value !== '')) return;

    const newPin = [...(isConfirming ? confirmPin : pin)];
    newPin[index] = value;

    if (isConfirming) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isLockedOut) return;
    const activePin = isConfirming ? confirmPin : pin;
    if (e.key === 'Backspace' && !activePin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCreatePin = () => {
    if (pin.join('').length !== 4) {
      setError('PIN must be 4 digits.');
      return;
    }
    setIsConfirming(true);
    setError(null);
  };

  const handleConfirmPin = async () => {
    if (pin.join('') !== confirmPin.join('')) {
      setError('PINs do not match. Please try again.');
      setPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setIsConfirming(false);
      inputRefs.current[0]?.focus();
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    try {
      const pinString = pin.join('');
      const { hash, salt } = await hashPin(pinString);
      
      const pinData: StoredPinData = {
        hash,
        salt,
        version: 1,
      };
      
      localStorage.setItem(pinStorageKey, JSON.stringify(pinData));
      setStoredPinData(pinData);
      setIsPinSet(true);
      setIsAuthenticated(true);
      syncPinToFirestore(pinData);
      resetRateLimit();
    } catch {
      setError('Failed to create PIN. Please try again.');
      setPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setIsConfirming(false);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (isPinSet && !isAuthenticated && storedPinData && !isLockedOut) {
      const enteredPin = pin.join('');
      if (enteredPin.length === 4) {
                // Check rate limit before verifying
                if (!checkRateLimit()) {
                  setError(`Too many attempts. Please wait ${lockoutSeconds} seconds.`);
                  setPin(['', '', '', '']);
                  inputRefs.current[0]?.focus();
                  return;
                }
        
        setIsVerifying(true);
        verifyPin(enteredPin, storedPinData.hash, storedPinData.salt)
          .then((isValid) => {
            if (isValid) {
                            resetRateLimit();
              setIsAuthenticated(true);
              setError(null);
              // Ensure remote copy exists (e.g., from legacy local-only users)
              syncPinToFirestore(storedPinData);
            } else {
              setError('Incorrect PIN. Please try again.');
              setPin(['', '', '', '']);
              inputRefs.current[0]?.focus();
            }
          })
          .catch(() => {
            setError('Verification failed. Please try again.');
            setPin(['', '', '', '']);
            inputRefs.current[0]?.focus();
          })
          .finally(() => {
            setIsVerifying(false);
          });
      }
    }
  }, [pin, isPinSet, isAuthenticated, storedPinData, isLockedOut]);
  
  const handleForgotPin = async () => {
      resetRateLimit();
    try {
      localStorage.removeItem(pinStorageKey);
      const authModule = await import('firebase/auth');
      const { getAuth, signOut } = authModule;
      const auth = getAuth();
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      logError('Failed to reset PIN', error);
      setError('Failed to reset PIN. Please try again.');
    }
  };


  if (isAuthenticated) {
    return <>{children}</>;
  }

  const PinInputGrid = ({ value, onChange, onKeyDown }: { value: string[], onChange: (i:number, v:string)=>void, onKeyDown: (i:number, e: React.KeyboardEvent<HTMLInputElement>)=>void }) => (
    <div className="flex justify-center gap-4">
      {value.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => { inputRefs.current[index] = el }}
          type="password"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
                    disabled={isVerifying || isLockedOut}
          className="w-14 h-16 text-center text-3xl font-bold shadow-neumorphic-inset"
        />
      ))}
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md shadow-neumorphic-outset">
        {!isPinSet ? (
          // Create PIN View
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                 <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-accent mb-4 shadow-neumorphic-inset">
                    <KeyRound size={32} />
                 </div>
              </div>
              <CardTitle>{isConfirming ? 'Confirm Your PIN' : 'Create Your 4-Digit PIN'}</CardTitle>
              <CardDescription>
                {isConfirming ? 'Please enter the PIN again to confirm.' : 'This PIN will be encrypted and protect your Secure Vault.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConfirming ? (
                 <PinInputGrid value={confirmPin} onChange={handlePinChange} onKeyDown={handleKeyDown} />
              ): (
                 <PinInputGrid value={pin} onChange={handlePinChange} onKeyDown={handleKeyDown} />
              )}
              {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
            </CardContent>
            <CardFooter>
              {isConfirming ? (
                <Button
                  onClick={handleConfirmPin}
                                    disabled={isVerifying}
                  aria-label="Confirm PIN"
                  tabIndex={0}
                  className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset focus:outline focus:outline-2 focus:outline-accent"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleConfirmPin(); }}
                >
                  {isVerifying ? 'Securing...' : 'Confirm PIN'}
                </Button>
              ) : (
                <Button
                  onClick={handleCreatePin}
                  aria-label="Create PIN"
                  tabIndex={0}
                  className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset focus:outline focus:outline-2 focus:outline-accent"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleCreatePin(); }}
                >
                  Create PIN
                </Button>
              )}
            </CardFooter>
          </>
        ) : (
          // Enter PIN View
          <>
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-accent mb-4 shadow-neumorphic-inset">
                        <KeyRound size={32} />
                    </div>
                </div>
              <CardTitle>Enter Your PIN</CardTitle>
              <CardDescription>
                {isLockedOut 
                  ? `Locked. Wait ${lockoutSeconds}s.` 
                  : isVerifying 
                    ? 'Verifying...' 
                    : 'Enter your 4-digit PIN to access the Secure Vault.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PinInputGrid value={pin} onChange={handlePinChange} onKeyDown={handleKeyDown} />
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {isLockedOut && (
                <Alert className="mt-4 border-warning bg-warning/10">
                  <AlertDescription className="text-warning">
                    Account temporarily locked due to multiple failed attempts. Please wait {lockoutSeconds} seconds.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="link" disabled={isVerifying || isLockedOut} className="text-muted-foreground">Forgot PIN?</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to reset your PIN?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will log you out of the application. You will need to log back in to set a new PIN. Your journal entries will remain safe.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleForgotPin}>Confirm and Log Out</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
