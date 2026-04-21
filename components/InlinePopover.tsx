"use client";

import { useEffect, useRef, useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface InlinePopoverProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel: string;
  displayLabel?: string;
}

export default function InlinePopover({
  value,
  options,
  onChange,
  ariaLabel,
  displayLabel,
}: InlinePopoverProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number>(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value)
    )
  );

  const rootRef = useRef<HTMLSpanElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Close on click-outside.
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  // Focus the currently-highlighted option when opening or moving.
  useEffect(() => {
    if (!open) return;
    optionRefs.current[focusIndex]?.focus();
  }, [open, focusIndex]);

  const openAndHighlightSelected = () => {
    const idx = options.findIndex((o) => o.value === value);
    setFocusIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const select = (v: string) => {
    onChange(v);
    close();
  };

  const handleTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      openAndHighlightSelected();
    }
  };

  const handleOptionKey = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    i: number
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((i - 1 + options.length) % options.length);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(options[i].value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <span ref={rootRef} className="relative inline-block">
      <button
        type="button"
        ref={triggerRef}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openAndHighlightSelected())}
        onKeyDown={handleTriggerKey}
        className="border-b border-dotted border-gray-400 bg-gray-50 px-1 rounded-sm hover:bg-gray-100 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {displayLabel ?? value}
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full mt-1 bg-white border border-gray-200 shadow-md rounded-lg p-1 min-w-[140px] z-10"
        >
          {options.map((opt, i) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => select(opt.value)}
                onKeyDown={(e) => handleOptionKey(e, i)}
                onFocus={() => setFocusIndex(i)}
                className="w-full text-left px-3 py-1.5 rounded hover:bg-gray-100 text-sm flex items-center justify-between gap-3 focus:outline-none focus:bg-gray-100"
              >
                <span>{opt.label}</span>
                {selected ? (
                  <span aria-hidden="true" className="text-blue-600">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </span>
  );
}
