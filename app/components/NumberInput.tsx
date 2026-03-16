"use client";

import React, { useRef } from "react";

/**
 * A drop-in replacement for <input type="number"> that prevents
 * scroll from changing the value while keeping the input focused.
 */
const NumberInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, forwardedRef) => {
  const innerRef = useRef<HTMLInputElement>(null);
  const ref = (forwardedRef as React.RefObject<HTMLInputElement>) ?? innerRef;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Attach a non-passive wheel listener so we can call preventDefault
    const el = e.currentTarget;
    const handler = (ev: WheelEvent) => ev.preventDefault();
    el.addEventListener("wheel", handler, { passive: false });
    // Store handler so we can remove it on blur
    (el as any).__wheelHandler = handler;

    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const handler = (el as any).__wheelHandler;
    if (handler) {
      el.removeEventListener("wheel", handler);
      delete (el as any).__wheelHandler;
    }
    props.onBlur?.(e);
  };

  return (
    <input
      {...props}
      type="number"
      ref={ref}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
});

NumberInput.displayName = "NumberInput";

export default NumberInput;
