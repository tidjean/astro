import { useEffect, useRef, useState } from 'react';
import Message from './components/Message';
import Starfield from './components/Starfield';
import texts from './config/text.config.json';
import type { Message as MessageType } from './types/message';

let _msgId = 0;
const mkMsg = (m: Omit<MessageType, 'id'>): MessageType => ({ ...m, id: ++_msgId });
const TYPING = (): MessageType => mkMsg({ text: '', me: false, typing: true });
const INITIAL_TYPING_DELAY = 600;
const SHORT_TYPING_DELAY = 1600;
const MEDIUM_TYPING_DELAY = 2800;
const LONG_TYPING_DELAY = 3600;
const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const HUMAN_TYPING_CHARS_PER_MINUTE = 240;

const getHumanTypingDelay = (text: string) => {
  const sanitizedText = text.trim();

  if (!sanitizedText) {
    return MEDIUM_TYPING_DELAY;
  }

  const punctuationCount = (sanitizedText.match(/[.!?,;:]/g) || []).length;
  const spacesCount = (sanitizedText.match(/\s/g) || []).length;
  const effectiveLength = sanitizedText.length + punctuationCount * 8 + spacesCount * 2;
  const rawDelay = (effectiveLength / HUMAN_TYPING_CHARS_PER_MINUTE) * 60_000;

  return Math.max(4200, Math.min(14000, Math.round(rawDelay)));
};

function App() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [lead, setLead] = useState<{ name: string; zodiac: string; description: string; email: string }>({
    name: '',
    zodiac: '',
    description: '',
    email: '',
  });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setMessages([TYPING()]);
    }, 500);

    const t2 = window.setTimeout(() => {
      setMessages([mkMsg({ text: texts.hello, me: false }), TYPING()]);
    }, INITIAL_TYPING_DELAY + 1200);

    const t3 = window.setTimeout(() => {
      setMessages([
        mkMsg({ text: texts.hello, me: false }),
        mkMsg({ text: texts.name, me: false }),
        mkMsg({ text: 'Nom:', me: true, input: true, typeInput: 'name' }),
      ]);
    }, INITIAL_TYPING_DELAY + LONG_TYPING_DELAY);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  const saveLead = async (payload: { name: string; email: string }) => {
    const response = await fetch('/api/leads.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Impossible d’enregistrer le lead.');
    }
  };

  const handleAddItem = async (data: { input: string; type: string; acceptedTerms?: boolean }) => {
    switch (data.type) {
      case 'name': {
        setLead((prev) => ({ ...prev, name: data.input }));
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
        }, SHORT_TYPING_DELAY);

        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({ text: texts.zodiac, me: false }),
            mkMsg({ text: 'Signe zodiacal:', me: true, input: true, typeInput: 'zodiac' }),
          ]);
        }, MEDIUM_TYPING_DELAY + 600);

        break;
      }

      case 'zodiac': {
        setLead((prev) => ({ ...prev, zodiac: data.input }));
        setMessages((prev) => [
          ...prev.slice(0, -1),
          mkMsg({ text: data.input, me: true }),
          TYPING(),
        ]);

        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({ text: `${data.input} — un signe fascinant ! 🌟 En quoi puis-je vous aider ?`, me: false }),
            // TYPING(),
          ]);
        }, SHORT_TYPING_DELAY);

        window.setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({ text: 'Description:', me: true, input: true, typeInput: 'description' }),
          ]);
        }, MEDIUM_TYPING_DELAY + 400);

        break;
      }

      case 'description': {
        const nextLead = { ...lead, description: data.input };
        setLead(nextLead);

        setMessages((prev) => [
          ...prev.slice(0, -1),
          mkMsg({ text: data.input, me: true }),
          TYPING(),
        ]);

        await sleep(MEDIUM_TYPING_DELAY);

        setMessages((prev) => [
          ...prev.filter((m) => !m.typing),
          mkMsg({ text: 'Merci pour votre message. Je consulte les astres pour vous... 🔮', me: false }),
          TYPING(),
        ]);

        try {
          const { generateFortuneReading } = await import('./services/fortune');
          const reading = await generateFortuneReading({
            name: nextLead.name,
            zodiac: nextLead.zodiac,
            question: data.input,
          });
          const responseText = reading.response || 'Les astres restent discrets pour le moment, mais une lumiere approche.';

          await sleep(getHumanTypingDelay(responseText));

          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({ text: responseText, me: false }),
            TYPING(),
          ]);
        } catch {
          setMessages((prev) => [
            ...prev.filter((m) => !m.typing),
            mkMsg({
              text: 'Je ressens une periode de flou, mais les astres laissent entrevoir une eclaircie prochaine. Continuez d avancer avec confiance, une reponse plus nette se dessinera bientot.',
              me: false,
            }),
            TYPING(),
          ]);
        }

        await sleep(LONG_TYPING_DELAY);

        setMessages((prev) => [
          ...prev.filter((m) => !m.typing),
          mkMsg({ text: texts.email, me: false }),
          mkMsg({ text: 'Email:', me: true, input: true, typeInput: 'email' }),
        ]);

        break;
      }

      case 'email': {
        const nextLead = { ...lead, email: data.input };

        setMessages((prev) => [
          ...prev.slice(0, -1),
          mkMsg({ text: data.input, me: true }),
          TYPING(),
        ]);

        try {
          await saveLead({ name: nextLead.name, email: nextLead.email });
          setLead(nextLead);

          window.setTimeout(() => {
            setMessages((prev) => [
              ...prev.filter((m) => !m.typing),
              mkMsg({ text: 'Merci ! Les etoiles vous guideront. Je vous recontacte tres vite. 🌙', me: false }),
            ]);
          }, MEDIUM_TYPING_DELAY);
        } catch {
          window.setTimeout(() => {
            setMessages((prev) => [
              ...prev.filter((m) => !m.typing),
              mkMsg({
                text: 'Votre email a bien ete recu, mais l’enregistrement CSV a echoue. Merci de verifier le serveur local.',
                me: false,
              }),
            ]);
          }, MEDIUM_TYPING_DELAY);
        }

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
