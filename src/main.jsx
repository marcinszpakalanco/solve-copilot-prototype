import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css'; // generated from the Serenity token JSON; never edited by hand
import './styles/motion.css'; // one class per Serenity motion pattern; never edited by hand
import './styles/base.css';
import './styles/components.css';
import { App } from './App.jsx';

// ?theme=dark shows the Dark mode, ?screen=<id> opens one screen (the QA script uses both)
const params = new URLSearchParams(location.search);
if (params.get('theme')) document.documentElement.dataset.theme = params.get('theme');
createRoot(document.getElementById('root')).render(<App initial={params.get('screen')} />);
