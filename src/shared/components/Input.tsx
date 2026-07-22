import React, { forwardRef, useId } from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, required, disabled, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <label 
            htmlFor={inputId} 
            className="text-xs font-medium text-text-secondary"
          >
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          disabled={disabled}
          required={required}
          className={cn(
            "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-text-primary shadow-sm transition-all duration-100 ease-out",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-text-secondary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger focus-visible:ring-danger",
          )}
          {...props}
        />
        {helperText && (
          <p className={cn("text-xs", error ? "text-danger" : "text-text-secondary")}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
