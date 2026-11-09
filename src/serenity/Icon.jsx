import React from 'react';
import { ICONS, LOGO_SOLVE } from '../icons.js';

// A Serenity icon: decorative by default (the control around it carries the accessible name).
export function Icon({ name, className = 'srn-icon', ...props }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: ICONS[name] }} {...props} />;
}

// The Solve logo mark (logo: jewel, variant=solve, color=off).
export function LogoSolve({ label = 'Solve' }) {
  return <svg className="srn-logo" viewBox="0 0 32 33" fill="none" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: LOGO_SOLVE }} />;
}
