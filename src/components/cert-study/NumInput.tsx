import { useState } from "react";

type NumInputProps = {
  value: number | string;
  onCommit: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
};

export function NumInput({ value, onCommit, min = 0, max = 100000, className = "", ...rest }: NumInputProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [raw, setRaw] = useState(String(value ?? ""));
  if (value !== prevValue) {
    setPrevValue(value);
    setRaw(String(value ?? ""));
  }
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={raw}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || /^\d*\.?\d*$/.test(v)) {
          setRaw(v);
          const n = parseFloat(v);
          if (!isNaN(n)) onCommit(clamp(n));
        }
      }}
      onBlur={() => {
        let n = parseFloat(raw);
        if (isNaN(n)) n = min;
        n = clamp(n);
        setRaw(String(n));
        onCommit(n);
      }}
      {...rest}
    />
  );
}
