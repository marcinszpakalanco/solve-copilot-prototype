import React, { useRef } from 'react';
import { TextField, TextArea, Label, ToggleButton, MenuTrigger, Popover, Menu, MenuItem, Button as AriaButton, Text } from 'react-aria-components';
import { Icon } from './Icon.jsx';
import { ButtonIcon, SrnTooltip } from './ButtonIcon.jsx';

const cx = (...a) => a.filter(Boolean).join(' ');

export const MODELS = [
  { id: 'solve-1.5', name: 'Solve 1.5', description: 'Fast answers with sources' },
  { id: 'solve-1.5-deep', name: 'Solve 1.5 Deep research', description: 'Longer research with more sources' },
  { id: 'solve-1.0', name: 'Solve 1.0', description: 'The previous model' },
];

// The model picker inside PromptField (property model=on): a ghost Button with a Menu in a Popover (Enter/Pop, Exit/Pop).
function ModelMenu({ model, onModelChange }) {
  const current = MODELS.find((m) => m.id === model) ?? MODELS[0];
  return (
    <MenuTrigger>
      <AriaButton aria-label={`Model: ${current.name}`} className={({ isFocusVisible }) => cx('srn-button', 'srn-button--ghost', 'srn-tone--secondary', 'srn-size--s', 'srn-rounded', 'text-label-medium', 'motion-feedback-press', 'srn-model-trigger', isFocusVisible && 'effect-focus-neutral')}>
        <span className="motion-feedback-label"><span key={current.id} data-motion-part="enter">{current.name}</span></span>
        <Icon name="chevron-down-small" className="srn-icon motion-feedback-rotate" />
      </AriaButton>
      <Popover placement="bottom end" offset={8} className="srn-popover effect-elevation-overlay motion-enter-pop motion-exit-pop">
        <Menu
          aria-label="Model"
          selectionMode="single"
          selectedKeys={[current.id]}
          onAction={(key) => onModelChange(String(key))}
          className="srn-menu"
        >
          {MODELS.map((m) => (
            <MenuItem key={m.id} id={m.id} textValue={m.name} className={({ isFocused, isFocusVisible }) => cx('srn-menu-item', 'motion-feedback-hover', isFocused && 'is-focused', isFocusVisible && 'effect-focus-inset-neutral')}>
              {({ isSelected }) => (
                <>
                  <span className="srn-menu-item-content">
                    <Text slot="label" className="text-body-medium">{m.name}</Text>
                    <Text slot="description" className="text-caption-medium srn-text-secondary">{m.description}</Text>
                  </span>
                  <span className="motion-feedback-select" data-selected={isSelected || undefined}>
                    <Icon name="check" className="srn-icon" data-motion-part="mark" />
                  </span>
                </>
              )}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}

// Serenity PromptField: the text area on top, the tool row below, the send button from focus or the first character.
// While an answer streams (isPending) send turns into Stop. Enter sends, Shift+Enter breaks the line, Esc stops.
export function PromptField({ value, onChange, onSubmit, onStop, isPending, size = 'l', placeholder = 'Ask anything, type @ to add context or / for commands', model, onModelChange, webSearch, onWebSearchChange, autoFocus }) {
  const ref = useRef(null);
  const hasValue = value.trim().length > 0;
  const submit = () => { if (hasValue && !isPending) onSubmit(value.trim()); };
  return (
    <form
      className={cx('srn-prompt', `srn-prompt--${size}`, 'effect-field-default', 'motion-feedback-hover')}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      onKeyDown={(e) => { if (e.key === 'Escape' && isPending) { e.preventDefault(); onStop(); } }}
    >
      <TextField aria-label="Prompt" value={value} onChange={onChange} className="srn-prompt-field" autoFocus={autoFocus}>
        <TextArea
          ref={ref}
          rows={1}
          placeholder={placeholder}
          className={cx('srn-prompt-input', size === 'l' ? 'text-body-large' : 'text-body-medium')}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`; }}
        />
      </TextField>
      <div className="srn-prompt-actions">
        <div className="srn-prompt-leading">
          <ButtonIcon icon="plus" label="Add files" />
          <SrnTooltip label={webSearch ? 'Web search is on' : 'Search the web'}>
            <ToggleButton aria-label="Search the web" isSelected={webSearch} onChange={onWebSearchChange}
              className={({ isFocusVisible }) => cx('srn-button-icon', 'srn-toggle-icon', 'srn-button--ghost', 'srn-tone--secondary', 'srn-size--s', 'motion-feedback-press', 'motion-feedback-select', isFocusVisible && 'effect-focus-neutral')}>
              <Icon name="globe" />
            </ToggleButton>
          </SrnTooltip>
        </div>
        <div className="srn-prompt-trailing">
          <ModelMenu model={model} onModelChange={onModelChange} />
          <ButtonIcon icon="mic" label="Dictate" />
          {isPending ? (
            <ButtonIcon key="stop" icon="stop" label="Stop" variant="solid" tone="primary" className="motion-enter-pop" onPress={onStop} />
          ) : hasValue ? (
            <ButtonIcon key="send" icon="arrow-up" label="Send" variant="solid" tone="primary" type="submit" className="motion-enter-pop" />
          ) : null}
        </div>
      </div>
    </form>
  );
}
