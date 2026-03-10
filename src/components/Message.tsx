import { useState } from 'react';
import type { Message as MessageType } from '../types/message';

type MessageProps = {
  message: MessageType;
  onSubmit: (payload: { input: string; type: string }) => void;
};

const ZODIAC_SIGNS = [
  { name: 'Bélier', emoji: '♈' },
  { name: 'Taureau', emoji: '♉' },
  { name: 'Gémeaux', emoji: '♊' },
  { name: 'Cancer', emoji: '♋' },
  { name: 'Lion', emoji: '♌' },
  { name: 'Vierge', emoji: '♍' },
  { name: 'Balance', emoji: '♎' },
  { name: 'Scorpion', emoji: '♏' },
  { name: 'Sagittaire', emoji: '♐' },
  { name: 'Capricorne', emoji: '♑' },
  { name: 'Verseau', emoji: '♒' },
  { name: 'Poissons', emoji: '♓' },
];

function Message({ message, onSubmit }: MessageProps) {
  const [value, setValue] = useState('');
  const [emailError, setEmailError] = useState('');
  const isUser = message.me;

  if (message.typing) {
    return (
      <div className="chat-row chat-row--bot">
        <div className="avatar avatar--bot">
          <img src="/logoProjet.png" alt="Astro" />
        </div>
        <div className="bubble-wrapper bubble-wrapper--bot">
          <div className="bubble bubble--bot bubble--typing">
            <div className="typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
            <div className="bubble-tail bubble-tail--bot" />
          </div>
        </div>
      </div>
    );
  }

  const submit = (val?: string) => {
    const finalValue = val ?? value.trim();
    if (!message.typeInput || finalValue === '') return;
    if (message.typeInput === 'email') {
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalValue);
      if (!valid) {
        setEmailError('Veuillez entrer une adresse email valide (ex: nom@domaine.com)');
        return;
      }
      setEmailError('');
    }
    onSubmit({ input: finalValue, type: message.typeInput });
    setValue('');
  };

  const renderInput = () => {
    if (!message.input || !message.typeInput) return null;

    if (message.typeInput === 'zodiac') {
      return (
        <div className="zodiac-selector">
          <p className="zodiac-label">Choisissez votre signe :</p>
          <div className="zodiac-grid">
            {ZODIAC_SIGNS.map((sign) => (
              <button
                key={sign.name}
                className="zodiac-btn"
                type="button"
                onClick={() => submit(`${sign.emoji} ${sign.name}`)}
              >
                <span className="zodiac-emoji">{sign.emoji}</span>
                <span className="zodiac-name">{sign.name}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (message.typeInput === 'description') {
      return (
        <div className="input-group-astro">
          <textarea
            className="astro-textarea"
            placeholder="Entrez votre besoin..."
            value={value}
            rows={3}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button className="astro-send-btn" type="button" onClick={() => submit()}>
            Envoyer ✨
          </button>
        </div>
      );
    }

    return (
      <div className="input-group-astro">
        <input
          type={message.typeInput === 'email' ? 'email' : 'text'}
          className={`astro-input${emailError ? ' astro-input--error' : ''}`}
          placeholder={message.typeInput === 'email' ? 'Entrez votre email' : 'Entrez votre prénom'}
          value={value}
          autoFocus
          onChange={(e) => { setValue(e.target.value); if (emailError) setEmailError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {emailError && <p className="astro-input-error">{emailError}</p>}
        <button className="astro-send-btn" type="button" onClick={() => submit()}>
          Envoyer ✨
        </button>
      </div>
    );
  };

  return (
    <div className={`chat-row ${isUser ? 'chat-row--user' : 'chat-row--bot'}`}>
      {!isUser && (
        <div className="avatar avatar--bot">
          <img src="/logoProjet.png" alt="Astro" />
        </div>
      )}

      <div className={`bubble-wrapper ${isUser ? 'bubble-wrapper--user' : 'bubble-wrapper--bot'}`}>
        <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--bot'}`}>
          {message.input ? renderInput() : <span>{message.text}</span>}
          <div className={`bubble-tail ${isUser ? 'bubble-tail--user' : 'bubble-tail--bot'}`} />
        </div>
      </div>

      {isUser && (
        <div className="avatar avatar--user">
          <span>👤</span>
        </div>
      )}
    </div>
  );
}

export default Message;
