import { Input } from "@/components/ui/input";
import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number | string;
  onChange: (value: any) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  /** Fallback value used when the field is blurred while empty. Defaults to 0. */
  fallback?: number;
}

/**
 * A number input that stores the display value as a string so users can
 * freely clear the field, delete leading zeros, and type new values
 * without the input snapping back to "0".
 *
 * - While focused, the raw string is shown and the parent receives parsed numbers.
 * - On blur, if the field is empty it reverts to the fallback (default 0).
 * - External value changes (e.g. from OCR extraction) are reflected when the
 *   input is not focused.
 * - Accepts both string and number values, and calls onChange with the same
 *   type as the initial value to maintain compatibility with string-based forms.
 */
export function NumberInput({
  value,
  onChange,
  className,
  min,
  max,
  step,
  placeholder,
  fallback = 0,
}: NumberInputProps) {
  const isStringMode = typeof value === "string";
  const numericValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  const [displayValue, setDisplayValue] = useState<string>(String(value));
  const [focused, setFocused] = useState(false);

  // Sync display when value changes externally (not while user is typing)
  useEffect(() => {
    if (!focused) {
      setDisplayValue(String(value));
    }
  }, [value, focused]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setDisplayValue(raw);

      // Parse and propagate if it's a valid number
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        onChange(isStringMode ? raw : parsed);
      } else if (raw === "" || raw === "-") {
        // Allow clearing or typing a negative sign
        onChange(isStringMode ? raw : fallback);
      }
    },
    [onChange, isStringMode, fallback],
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    // Select all text on focus so the user can immediately type a replacement
    e.target.select();
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
    // If the field is empty or not a valid number, revert to fallback
    const parsed = parseFloat(displayValue);
    if (displayValue === "" || isNaN(parsed)) {
      setDisplayValue(String(fallback));
      onChange(isStringMode ? String(fallback) : fallback);
    } else {
      // Clean up display (remove trailing dots, etc.)
      setDisplayValue(String(parsed));
      onChange(isStringMode ? String(parsed) : parsed);
    }
  }, [displayValue, fallback, onChange, isStringMode]);

  return (
    <Input
      type="number"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(className)}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
    />
  );
}
