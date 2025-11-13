"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { verifyPin, hashPin } from '@/lib/crypto';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Link from 'next/link';
import { LockKeyhole, ArrowLeft, ShieldCheck } from 'lucide-react';

interface StoredPinData { hash: string; salt: string; version: number }

export default function VaultSettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [step, setStep] = useState<'verify' | 'new' | 'done'>('verify');
  const [currentPin, setCurrentPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [storedPinData, setStoredPinData] = useState<StoredPinData | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentRefs = useRef<(HTMLInputElement | null)[]>([]);
  const newRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  const pinStorageKey = user?.uid ? `user_pin_${user.uid}` : 'user_pin';

  useEffect(() => {
    const raw = localStorage.getItem(pinStorageKey);
    if (raw) {
      try {
        const parsed: StoredPinData = JSON.parse(raw);
        if (parsed.hash && parsed.salt) {
          setStoredPinData(parsed);
        }
      } catch {/* ignore */}
    }
  }, [pinStorageKey]);

  const handleDigitChange = (arrSetter: React.Dispatch<React.SetStateAction<string[]>>, refs: React.MutableRefObject<(HTMLInputElement | null)[]>, index: number, value: string) => {
    if (!/^[0-9]$/.test(value) && value !== '') return;
    arrSetter(prev => {
      const next = [...prev];
      next[index] = value;
      if (value && index < 3) refs.current[index + 1]?.focus();
      return next;
    });
  };

  const handleBackspace = (arr: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>, index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !arr[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handleVerifyCurrentPin = async () => {
    if (!storedPinData) {
      setError('No existing PIN found.');
      return;
    }
    if (currentPin.join('').length !== 4) {
      setError('Enter full current PIN.');
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const isValid = await verifyPin(currentPin.join(''), storedPinData.hash, storedPinData.salt);
      if (!isValid) {
        setError('Incorrect current PIN.');
        setCurrentPin(['', '', '', '']);
        currentRefs.current[0]?.focus();
        return;
      }
      setStep('new');
    } catch {
      setError('Verification failed. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetNewPin = async () => {
    if (newPin.join('').length !== 4 || confirmPin.join('').length !== 4) {
      setError('PIN must be 4 digits.');
      return;
    }
    if (newPin.join('') !== confirmPin.join('')) {
      setError('PINs do not match.');
      setNewPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      newRefs.current[0]?.focus();
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const { hash, salt } = await hashPin(newPin.join(''));
      const pinData: StoredPinData = { hash, salt, version: 1 };
      localStorage.setItem(pinStorageKey, JSON.stringify(pinData));
      setStoredPinData(pinData);
      if (firestore && user) {
        const userRef = doc(firestore, 'users', user.uid);
        setDocumentNonBlocking(userRef, { vaultPin: { ...pinData, updatedAt: Date.now() } }, { merge: true });
      }
      setSuccessMessage('PIN updated successfully.');
      setStep('done');
    } catch {
      setError('Failed to update PIN.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemovePin = () => {
    localStorage.removeItem(pinStorageKey);
    if (firestore && user) {
      const userRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userRef, { vaultPin: null, vaultPinRemovedAt: Date.now() }, { merge: true });
    }
    setStoredPinData(null);
    setStep('verify');
    setCurrentPin(['', '', '', '']);
    setNewPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setSuccessMessage('PIN removed. Vault will require new setup next access.');
  };

  const PinInputs = ({ value, refs, onChange, onKeyDown }: { value: string[]; refs: React.MutableRefObject<(HTMLInputElement | null)[]>; onChange: (i:number,v:string)=>void; onKeyDown: (i:number,e:React.KeyboardEvent<HTMLInputElement>)=>void }) => (
    <div className="flex justify-center gap-3">
      {value.map((d,i) => (
        <Input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="password"
          maxLength={1}
          value={d}
          disabled={isVerifying}
          onChange={e => onChange(i,e.target.value)}
          onKeyDown={e => onKeyDown(i,e)}
          className="w-14 h-16 text-center text-2xl font-bold shadow-neumorphic-inset"
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/vault" className="flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline">Vault Security Settings</h1>
      </div>

      <Card className="shadow-neumorphic-outset">
        <CardHeader>
          <CardTitle>Change PIN</CardTitle>
          <CardDescription>Update or remove your secure vault PIN.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'verify' && storedPinData && (
            <>
              <p className="text-sm text-muted-foreground">Enter current PIN to proceed.</p>
              <PinInputs
                value={currentPin}
                refs={currentRefs}
                onChange={(i,v) => handleDigitChange(setCurrentPin,currentRefs,i,v)}
                onKeyDown={(i,e) => handleBackspace(currentPin,currentRefs,i,e)}
              />
              <Button onClick={handleVerifyCurrentPin} disabled={isVerifying || currentPin.join('').length !== 4} className="w-full shadow-neumorphic-outset">
                {isVerifying ? 'Verifying...' : 'Verify PIN'}
              </Button>
            </>
          )}

          {step === 'verify' && !storedPinData && (
            <Alert>
              <AlertDescription>No PIN is currently set. Set a new one below.</AlertDescription>
            </Alert>
          )}

          {step === 'new' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">New PIN</p>
                <PinInputs
                  value={newPin}
                  refs={newRefs}
                  onChange={(i,v) => handleDigitChange(setNewPin,newRefs,i,v)}
                  onKeyDown={(i,e) => handleBackspace(newPin,newRefs,i,e)}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Confirm PIN</p>
                <PinInputs
                  value={confirmPin}
                  refs={confirmRefs}
                  onChange={(i,v) => handleDigitChange(setConfirmPin,confirmRefs,i,v)}
                  onKeyDown={(i,e) => handleBackspace(confirmPin,confirmRefs,i,e)}
                />
              </div>
              <Button onClick={handleSetNewPin} disabled={isVerifying || newPin.join('').length !== 4 || confirmPin.join('').length !== 4} className="w-full shadow-neumorphic-outset">
                {isVerifying ? 'Saving...' : 'Save New PIN'}
              </Button>
            </div>
          )}

          {step === 'done' && successMessage && (
            <Alert className="border-green-600 bg-green-600/10">
              <AlertDescription className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-600" /> {successMessage}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {storedPinData && step !== 'new' && step !== 'done' && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Need to remove the PIN entirely?</p>
                <Button type="button" variant="outline" onClick={handleRemovePin} disabled={isVerifying} className="w-full shadow-neumorphic-outset">
                  Remove PIN
                </Button>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><LockKeyhole className="h-3 w-3" /> Hashing & rate limiting enabled</div>
        </CardFooter>
      </Card>
    </div>
  );
}
