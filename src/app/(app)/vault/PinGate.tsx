'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface PinGateProps {
  children: React.ReactNode;
}

export function PinGate({ children }: PinGateProps) {
  const router = useRouter();
  const { user } = useUser();
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [isPinSet, setIsPinSet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmPin, setConfirmPin] = useState<string[]>(['', '', '', '']);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const userPin = localStorage.getItem('user_pin');
    setStoredPin(userPin);
    setIsPinSet(!!userPin);
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (!/^[0-9]$/.test(value) && value !== '') return;

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
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
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

  const handleConfirmPin = () => {
    if (pin.join('') !== confirmPin.join('')) {
      setError('PINs do not match. Please try again.');
      setPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setIsConfirming(false);
      inputRefs.current[0]?.focus();
      return;
    }
    const newPin = pin.join('');
    localStorage.setItem('user_pin', newPin);
    setStoredPin(newPin);
    setIsPinSet(true);
    setIsAuthenticated(true);
    setError(null);
  };

  useEffect(() => {
    if (isPinSet && !isAuthenticated) {
      const enteredPin = pin.join('');
      if (enteredPin.length === 4) {
        if (enteredPin === storedPin) {
          setIsAuthenticated(true);
          setError(null);
        } else {
          setError('Incorrect PIN. Please try again.');
          setPin(['', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      }
    }
  }, [pin, isPinSet, isAuthenticated, storedPin]);
  
  const handleForgotPin = async () => {
    try {
      localStorage.clear(); // Clear all localStorage data
      const authModule = await import('firebase/auth');
      // Use getAuth and signOut from firebase/auth
      const { getAuth, signOut } = authModule as any;
      const auth = getAuth();
      await signOut(auth);
      router.push('/login');
    } catch (error) {
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
                {isConfirming ? 'Please enter the PIN again to confirm.' : 'This PIN will protect your Secure Vault.'}
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
                <Button onClick={handleConfirmPin} className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset">Confirm PIN</Button>
              ) : (
                <Button onClick={handleCreatePin} className="w-full shadow-neumorphic-outset active:shadow-neumorphic-inset">Create PIN</Button>
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
              <CardDescription>Enter your 4-digit PIN to access the Secure Vault.</CardDescription>
            </CardHeader>
            <CardContent>
              <PinInputGrid value={pin} onChange={handlePinChange} onKeyDown={handleKeyDown} />
              {error && <Alert variant="destructive" className="mt-4"><AlertDescription>{error}</AlertDescription></Alert>}
            </CardContent>
            <CardFooter className="flex justify-center">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="link" className="text-muted-foreground">Forgot PIN?</Button>
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
