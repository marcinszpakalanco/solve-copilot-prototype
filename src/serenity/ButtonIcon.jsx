import React from 'react';
import { Button as AriaButton, ToggleButton, TooltipTrigger, Tooltip, OverlayArrow } from 'react-aria-components';
import { Icon } from './Icon.jsx';

const cx = (...a) => a.filter(Boolean).join(' ');

// Serenity Tooltip: the visible name of an icon-only control (Tooltip page: Enter/Slide in, Exit/Slide out).
export function SrnTooltip({ children, label, placement = 'bottom' }) {
  return (
    <TooltipTrigger delay={600} closeDelay={0}>
      {children}
      <Tooltip placement={placement} offset={6} className="srn-tooltip text-caption-medium motion-enter-slide motion-exit-slide">
        {label}
      </Tooltip>
    </TooltipTrigger>
  );
}

// Serenity Button: Icon. label is its accessible name and its Tooltip text.
export function ButtonIcon({ icon, label, variant = 'ghost', tone = 'secondary', size = 's', tooltip = true, className, isPending, ...props }) {
  const btn = (
    <AriaButton
      aria-label={label}
      isPending={isPending}
      {...props}
      className={({ isFocusVisible }) => cx('srn-button-icon', `srn-button--${variant}`, `srn-tone--${tone}`, `srn-size--${size}`, 'motion-feedback-press', isFocusVisible && 'effect-focus-neutral', className)}
    >
      {typeof icon === 'string' ? <Icon name={icon} /> : icon}
    </AriaButton>
  );
  return tooltip ? <SrnTooltip label={label}>{btn}</SrnTooltip> : btn;
}

// Serenity ToggleButton: Icon (aria-pressed). The selected state swaps to the filled look (Feedback/Select).
export function ToggleButtonIcon({ icon, label, size = 'xs', className, ...props }) {
  return (
    <SrnTooltip label={label}>
      <ToggleButton
        aria-label={label}
        {...props}
        className={({ isFocusVisible }) => cx('srn-button-icon', 'srn-toggle-icon', 'srn-button--ghost', 'srn-tone--secondary', `srn-size--${size}`, 'motion-feedback-press', 'motion-feedback-select', isFocusVisible && 'effect-focus-neutral', className)}
      >
        <Icon name={icon} />
      </ToggleButton>
    </SrnTooltip>
  );
}
