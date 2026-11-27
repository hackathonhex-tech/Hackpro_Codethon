'use client';

import React, { useState, useRef, useEffect, useMemo, forwardRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  leftIcon?: React.ReactNode;
  selectSize?: 'sm' | 'md';
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      leftIcon,
      selectSize = 'md',
      className = '',
      children,
      id,
      value,
      defaultValue,
      onChange,
      onValueChange,
      disabled,
      placeholder = 'Select option...',
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);

    // Extract options either from prop or from <option> children
    const parsedOptions: SelectOption[] = useMemo(() => {
      if (options && options.length > 0) return options;
      if (!children) return [];

      const extracted: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          extracted.push({
            value: String(child.props.value ?? ''),
            label: String(child.props.children ?? child.props.value ?? ''),
            disabled: child.props.disabled,
          });
        }
      });
      return extracted;
    }, [options, children]);

    // Current selected value
    const currentValue = value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : '';

    const selectedOption = parsedOptions.find((opt) => opt.value === currentValue);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    // Close on click outside
    useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);
      }
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen]);

    const handleSelect = (opt: SelectOption) => {
      if (opt.disabled) return;
      setIsOpen(false);

      if (onValueChange) {
        onValueChange(opt.value);
      }

      if (onChange) {
        // Synthesize native change event for compatibility
        const syntheticEvent = {
          target: { value: opt.value, name: props.name || '' },
          currentTarget: { value: opt.value, name: props.name || '' },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;

        onChange(syntheticEvent);
      }
    };

    const sizeClasses =
      selectSize === 'sm'
        ? 'py-1.5 text-xs pl-3 pr-8 min-h-[36px]'
        : 'py-2.5 text-xs pl-3.5 pr-9 min-h-[44px]';

    const paddingWithLeftIcon = leftIcon ? (selectSize === 'sm' ? 'pl-8' : 'pl-9') : '';

    return (
      <div ref={containerRef} className="w-full space-y-1.5 relative">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 tracking-tight">
            {label}
          </label>
        )}

        {/* Custom Styled Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`
            w-full flex items-center justify-between rounded-xl font-medium text-slate-800 bg-white
            border transition-all duration-150 cursor-pointer shadow-2xs text-left
            hover:border-slate-300 hover:bg-slate-50/50
            focus:outline-none focus:ring-2 focus:ring-[#3760F8]/20 focus:border-[#3760F8]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50
            ${isOpen ? 'border-[#3760F8] ring-2 ring-[#3760F8]/20 bg-slate-50/40' : error ? 'border-rose-300' : 'border-slate-200/90'}
            ${sizeClasses}
            ${paddingWithLeftIcon}
            ${className}
          `}
        >
          {leftIcon && (
            <div className="absolute left-3 pointer-events-none text-slate-400 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <span className="truncate block font-semibold text-slate-900">
            {displayLabel}
          </span>

          <div className={`absolute right-3 pointer-events-none text-slate-400 flex items-center justify-center transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#3760F8]' : ''}`}>
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
        </button>

        {/* Custom High-End Popover Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 z-50 mt-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden py-1.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            {parsedOptions.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xs text-slate-400 italic">No options available</div>
            ) : (
              parsedOptions.map((opt) => {
                const isSelected = opt.value === currentValue;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    className={`
                      w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors
                      ${
                        isSelected
                          ? 'bg-[#EEF2FF] text-[#3760F8]'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }
                      ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#3760F8] shrink-0 stroke-[2.5]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Hidden select to satisfy any form submit or ref bindings */}
        <select
          ref={ref}
          value={currentValue}
          onChange={onChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          {...props}
        >
          {parsedOptions.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && <p className="text-[11px] font-medium text-rose-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
