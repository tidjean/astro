import { useEffect, useRef, useState } from 'react';
import Message from './components/Message';
import Starfield from './components/Starfield';
import texts from './config/text.config.json';
import type { Message as MessageType } from './types/message';

let _msgId = 0;
const mkMsg = (m: Omit<MessageType, 'id'>): MessageType => ({ ...m, id: ++_msgId });
const TYPING = (): MessageType => mkMsg({ text: '', me: false, typing: true });

function App() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setMessages([TYPING()]);
    }, 300);

    const t2 = window.setTimeout(() => {
      setMessages([mkMsg({ text: texts.hello, me: false }), TYPING()]);
    }, 1100);

    const t3 = window.setTimeout(() => {
      setMessages([
        mkMsg({ text: texts.hello, me: false }),
        mkMsg({ text: texts.name, me: false }),
        mkMsg({ text: 'Nom:', me: true, input: true, typeInput: 'name' }),
      ]);
    }, 2000);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const handleAddItem = (data: { input: string; type: string }) => {
    switch (data.type) {
      case 'name': {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          mkMsg({ text: data.input, me: true }),
          TYPING(),
        ]);

        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({ text: `Enchanté(e) ${data.input} ! ✨`, me: false }),
            TYPING(),
          ]);
        }, 900);

        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({ text: texts.zodiac, me: false }),
            mkMsg({ text: 'Signe zodiacal:', me: true, input: true, typeInput: 'zodiac' }),
          ]);
        }, 1800);

        break;
      }

      case 'zodiac': {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          mkMsg({ text: data.input, me: true }),
          TYPING(),
        ]);

        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({ text: `${data.input} — un signe fascinant ! 🌟 En quoi puis-je vous aider ?`, me: false }),
            TYPING(),
          ]);
        }, 800);

        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({ text: texts.description, me: false }),
            mkMsg({ text: 'Description:', me: true, input: true, typeInput: 'description' }),
          ]);
        }, 1700);

        break;
      }

      case 'description': {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          mkMsg({ text: data.input, me: true }),
          TYPING(),
        ]);

        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({ text: 'Merci pour votre message. Je consulte les astres pour vous... 🔮', me: false }),
            TYPING(),
          ]);
        }, 1100);

        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({ text: texts.email, me: false }),
            mkMsg({ text: 'Email:', me: true, input: true, typeInput: 'email' }),
          ]);
        }, 2200);

        break;
      }

      case 'email': {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          mkMsg({ text: data.input, me: true }),
          TYPING(),
        ]);

        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({ text: 'Merci ! Les étoiles vous guideront. Je vous recontacte très vite. 🌙', me: false }),
          ]);
        }, 1000);

        break;
      }

      default:
        break;
    }
  };

  return (
    <div className="astro-app">
      <Starfield />
      <header className="astro-header">
        <img src="/logoProjet.png" className="astro-banner" alt="Logo Astro" />
      </header>

      <main className="astro-chat-container">
        <div className="astro-chat-inner">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              onSubmit={handleAddItem}
            />
          ))}
          <div ref={endRef} />
        </div>
      </main>
    </div>
  );
}

export default App;
