import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Eye, EyeOff, ShieldAlert, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

interface VaultWizardProps {
  onSetup: (password: string) => Promise<void>;
}

type WizardStep = 'intro' | 'password' | 'notice';

export function VaultWizard({ onSetup }: VaultWizardProps) {
  const [step, setStep] = useState<WizardStep>('intro');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Super basic strength check (just for UI completeness as requested)
  const strength = password.length === 0 ? 0 : password.length < 8 ? 33 : password.length < 12 ? 66 : 100;
  const strengthColor = strength === 33 ? 'bg-danger' : strength === 66 ? 'bg-warning' : strength === 100 ? 'bg-success' : 'bg-border';

  const handleCreate = async () => {
    if (!acknowledged) return;
    setIsSubmitting(true);
    try {
      await onSetup(password);
    } catch (_e) {
      // Parent handles error toast
      setIsSubmitting(false);
    }
  };

  if (step === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-6">
          <Lock size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-3">
          Protect your sensitive clipboard history.
        </h2>
        <p className="text-[14px] text-text-secondary max-w-[42ch] mx-auto leading-relaxed mb-8">
          Passwords, API keys, SSH keys, recovery codes, private notes, and confidential text can be stored inside your encrypted Vault.
        </p>
        <div className="flex gap-4">
          <Button variant="primary" onClick={() => setStep('password')} className="gap-2">
            Create Vault <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'password') {
    const isNextDisabled = !password || password !== confirmPassword;
    return (
      <div className="max-w-[360px] mx-auto py-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Create Master Password</h3>
        <p className="text-sm text-text-secondary mb-6">
          Choose a strong password. This will be used to encrypt all items in your Vault.
        </p>

        <div className="space-y-4 mb-8">
          <Input 
            type={showPassword ? "text" : "password"}
            placeholder="Master Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            onRightIconClick={() => setShowPassword(!showPassword)}
          />
          
          <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-surface border border-border">
            <div className={`h-full transition-all duration-300 w-1/3 ${password.length > 0 ? strengthColor : 'bg-transparent'}`} />
            <div className={`h-full transition-all duration-300 w-1/3 ${password.length >= 8 ? strengthColor : 'bg-transparent'}`} />
            <div className={`h-full transition-all duration-300 w-1/3 ${password.length >= 12 ? strengthColor : 'bg-transparent'}`} />
          </div>

          <Input 
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            rightIcon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            onRightIconClick={() => setShowPassword(!showPassword)}
          />
        </div>

        <div className="flex justify-between items-center">
          <Button variant="secondary" onClick={() => setStep('intro')}>
            Back
          </Button>
          <Button variant="primary" disabled={isNextDisabled} onClick={() => setStep('notice')}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'notice') {
    return (
      <div className="max-w-[400px] mx-auto py-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center gap-3 mb-4 text-warning">
          <ShieldAlert size={24} />
          <h3 className="text-lg font-semibold text-text-primary">Important Notice</h3>
        </div>
        
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-5 mb-6">
          <ul className="space-y-3 text-sm text-text-primary">
            <li className="flex items-start gap-2">
              <span className="text-warning font-bold">•</span>
              <span><strong>ORNAS cannot recover forgotten passwords.</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning font-bold">•</span>
              <span>Recovery keys are never uploaded or synced.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning font-bold">•</span>
              <span>No company or developer can unlock your Vault.</span>
            </li>
          </ul>
        </div>

        <label className="flex items-start gap-3 cursor-pointer group mb-8 p-1">
          <div className="mt-0.5 relative flex items-center justify-center">
            <input 
              type="checkbox" 
              className="peer appearance-none w-4 h-4 rounded border border-text-tertiary checked:bg-primary checked:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors cursor-pointer"
              checked={acknowledged}
              onChange={e => setAcknowledged(e.target.checked)}
            />
            <CheckCircle2 size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
          </div>
          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors select-none">
            I understand that if I lose my master password, my encrypted clipboard data will be permanently lost.
          </span>
        </label>

        <div className="flex justify-between items-center">
          <Button variant="secondary" onClick={() => setStep('password')} disabled={isSubmitting}>
            Back
          </Button>
          <Button variant="primary" disabled={!acknowledged} loading={isSubmitting} onClick={handleCreate}>
            Create Vault
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
