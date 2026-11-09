import React from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { Icon } from './Icon.jsx';

const cx = (...a) => a.filter(Boolean).join(' ');

// Serenity Button over the React Aria Button. Props as on the Serenity page (get_component "Button"):
// variant solid | outlined | ghost | subtle, tone primary | secondary, size xs | s | m, isRounded, iconLeading, iconTrailing.
export function Button({ variant = 'solid', tone = 'primary', size = 'm', isRounded = true, iconLeading, iconTrailing, className, children, ...props }) {
  return (
    <AriaButton
      {...props}
      className={({ isFocusVisible }) =>
        cx('srn-button', `srn-button--${variant}`, `srn-tone--${tone}`, `srn-size--${size}`, isRounded && 'srn-rounded',
          size === 's' || size === 'xs' ? 'text-label-small' : 'text-label-medium',
          'motion-feedback-press', isFocusVisible && 'effect-focus-neutral', className)
      }
    >
      {iconLeading && <Icon name={iconLeading} />}
      {children}
      {iconTrailing && <Icon name={iconTrailing} />}
    </AriaButton>
  );
}
