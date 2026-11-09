import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { api, errorMessage } from '../services/api';
import type { ChatMessage, Conversation, UserProfile } from '../services/api';
import styles from './Chat.module.css';
import Avatar from '../components/ui/Avatar';

interface ChatProps {
  profile: UserProfile;
  startProviderId?: string;
}

const REFRESH_INTERVAL_MS = 4000;

export const Chat: React.FC<ChatProps> = ({ profile, startProviderId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshConversations = async (active = true) => {
    try {
      const result = await api.conversations();
      if (!active) return;
      setConversations(result);
      setSelectedId((current) => current || result[0]?.id || '');
    } catch (requestError) {
      if (active) setError(errorMessage(requestError));
    } finally {
      if (active) setLoadingConversations(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = () => { void refreshConversations(active); };
    load();
    const timer = window.setInterval(load, REFRESH_INTERVAL_MS);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!startProviderId) return;
    let active = true;
    setError('');
    api.startConversation(startProviderId)
      .then(async (conversation) => {
        if (!active) return;
        await refreshConversations(active);
        if (active) setSelectedId(conversation.id);
      })
      .catch((requestError: unknown) => { if (active) setError(errorMessage(requestError)); });
    return () => { active = false; };
  }, [startProviderId]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let active = true;
    setLoadingMessages(true);
    const load = async () => {
      try {
        const result = await api.messages(selectedId);
        if (active) {
          setMessages(result);
          void refreshConversations(active);
        }
      } catch (requestError) {
        if (active) setError(errorMessage(requestError));
      } finally {
        if (active) setLoadingMessages(false);
      }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, REFRESH_INTERVAL_MS);
    return () => { active = false; window.clearInterval(timer); };
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);
  const filteredConversations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return conversations.filter((conversation) =>
      !query || conversation.participante.username.toLocaleLowerCase().includes(query)
    );
  }, [conversations, search]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || sending) return;
    setSending(true);
    setError('');
    try {
      const message = await api.sendMessage(selectedId, body);
      setMessages((current) => [...current, message]);
      setDraft('');
      await refreshConversations();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSending(false);
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div><h1>Mensagens</h1><p>Conversas privadas entre clientes e prestadores.</p></div>
        <span className={styles.liveBadge}>Atualização automática</span>
      </header>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <section className={styles.chatShell} aria-label="Mensagens">
        <aside className={styles.sidebar}>
          <label className={styles.searchLabel} htmlFor="conversation-search">Buscar conversas</label>
          <input
            id="conversation-search"
            className={styles.search}
            type="search"
            placeholder="Nome"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className={styles.conversationList}>
            {loadingConversations ? <p className={styles.muted} role="status">Carregando conversas...</p> : filteredConversations.length === 0 ? (
              <p className={styles.muted}>Nenhuma conversa encontrada. Abra o perfil de um prestador para iniciar uma conversa.</p>
            ) : filteredConversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                className={`${styles.conversation} ${selectedId === conversation.id ? styles.selected : ''}`}
                onClick={() => setSelectedId(conversation.id)}
              >
                <Avatar name={conversation.participante.username} className={styles.avatar} />
                <span className={styles.conversationDetails}>
                  <strong>{conversation.participante.username}</strong>
                  <small>{conversation.ultima_mensagem?.body || 'Conversa iniciada'}</small>
                </span>
                {conversation.nao_lidas > 0 && <span className={styles.unread}>{conversation.nao_lidas}</span>}
              </button>
            ))}
          </div>
        </aside>
        <div className={styles.thread}>
          {selectedConversation ? (
            <>
              <header className={styles.threadHeader}>
                <Avatar name={selectedConversation.participante.username} className={styles.avatar} />
                <div><strong>{selectedConversation.participante.username}</strong><small>{selectedConversation.participante.tipo === 'PRESTADOR' ? 'Prestador' : 'Cliente'}</small></div>
              </header>
              <div className={styles.messages} aria-live="polite">
                {loadingMessages && messages.length === 0 ? <p className={styles.muted} role="status">Carregando mensagens...</p> : messages.length === 0 ? (
                  <p className={styles.muted}>Esta conversa ainda não tem mensagens. Envie a primeira mensagem.</p>
                ) : messages.map((message) => {
                  const own = message.sender_id === profile.id;
                  return (
                    <article key={message.id} className={`${styles.messageRow} ${own ? styles.ownMessage : ''}`}>
                      <div className={styles.bubble}>
                        <p>{message.body}</p>
                        <time dateTime={message.sent_at}>{new Date(message.sent_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</time>
                      </div>
                    </article>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form className={styles.compose} onSubmit={(event) => void send(event)}>
                <textarea
                  aria-label="Digite uma mensagem"
                  placeholder="Digite sua mensagem..."
                  value={draft}
                  maxLength={5000}
                  rows={2}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" disabled={sending || !draft.trim()}>{sending ? 'Enviando...' : 'Enviar'}</button>
              </form>
            </>
          ) : (
            <div className={styles.emptyThread}>
              <MessageSquare size={26} aria-hidden="true" />
              <strong>Suas conversas</strong>
              <p>Selecione uma conversa para ver as mensagens.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Chat;
