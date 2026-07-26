import React, { forwardRef, useId } from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, rightIcon, onRightIconClick, required, disabled, id, ...props }, ref) => {
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
        <div className="relative flex items-center">
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
              rightIcon && "pr-9"
            )}
            {...props}
          />
          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              disabled={disabled}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-text-tertiary hover:text-text-primary rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50 transition-colors"
            >
              {rightIcon}
            </button>
          )}
        </div>
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
