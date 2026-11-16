import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Search, SendHorizontal } from 'lucide-react';
import { api, errorMessage } from '../services/api';
import type { ChatMessage, Conversation, UserProfile } from '../services/api';
import styles from './Chat.module.css';
import Avatar from '../components/ui/Avatar';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { formatTime } from '../utils/format';

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
  const [threadOpen, setThreadOpen] = useState(Boolean(startProviderId));
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

  const openConversation = (id: string) => {
    setSelectedId(id);
    setThreadOpen(true);
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const dayLabel = (value: string) => {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  return (
    <div className={`${styles.page} fx-rise`}>
      <header className={styles.heading}>
        <h1>Mensagens</h1>
        <span className={styles.liveBadge}><span className={styles.liveDot} aria-hidden="true" /> Atualização automática</span>
      </header>
      {error && <p className="fx-alert fx-alert--error" role="alert">{error}</p>}
      <section className={styles.chatShell} data-thread-open={threadOpen && Boolean(selectedConversation)} aria-label="Mensagens">
        <aside className={styles.sidebar}>
          <div className={styles.searchBox}>
            <Search size={17} aria-hidden="true" />
            <label className="fx-sr-only" htmlFor="conversation-search">Buscar conversas</label>
            <input
              id="conversation-search"
              type="search"
              placeholder="Buscar conversas"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className={styles.conversationList}>
            {loadingConversations ? <SkeletonList count={3} label="Carregando conversas" /> : filteredConversations.length === 0 ? (
              <EmptyState
                compact
                icon={<MessageCircle size={20} aria-hidden="true" />}
                title="Nenhuma conversa encontrada"
                description={profile.tipo === 'PRESTADOR' ? 'Quando um cliente enviar uma mensagem, ela aparece aqui.' : 'Abra o perfil de um prestador para iniciar uma conversa.'}
              />
            ) : filteredConversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                className={`${styles.conversation} ${selectedId === conversation.id ? styles.selected : ''}`}
                aria-current={selectedId === conversation.id ? 'true' : undefined}
                onClick={() => openConversation(conversation.id)}
              >
                <Avatar name={conversation.participante.username} />
                <span className={styles.conversationDetails}>
                  <span className={styles.conversationTop}>
                    <strong>{conversation.participante.username}</strong>
                    {conversation.ultima_mensagem && <time dateTime={conversation.ultima_mensagem.sent_at}>{formatTime(conversation.ultima_mensagem.sent_at)}</time>}
                  </span>
                  <span className={styles.conversationBottom}>
                    <small>{conversation.ultima_mensagem?.body || 'Conversa iniciada'}</small>
                    {conversation.nao_lidas > 0 && <span className={styles.unread}>{conversation.nao_lidas}</span>}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>
        <div className={styles.thread}>
          {selectedConversation ? (
            <>
              <header className={styles.threadHeader}>
                <button type="button" className={styles.threadBack} onClick={() => setThreadOpen(false)} aria-label="Voltar para as conversas">
                  <ArrowLeft size={20} aria-hidden="true" />
                </button>
                <Avatar name={selectedConversation.participante.username} size="sm" />
                <div>
                  <strong>{selectedConversation.participante.username}</strong>
                  <small>{selectedConversation.participante.tipo === 'PRESTADOR' ? 'Prestador' : 'Cliente'}</small>
                </div>
              </header>
              <div className={styles.messages} aria-live="polite">
                {loadingMessages && messages.length === 0 ? <p className={styles.muted} role="status">Carregando mensagens...</p> : messages.length === 0 ? (
                  <p className={styles.muted}>Esta conversa ainda não tem mensagens. Envie a primeira mensagem.</p>
                ) : messages.map((message, index) => {
                  const own = message.sender_id === profile.id;
                  const previous = messages[index - 1];
                  const newDay = !previous || new Date(previous.sent_at).toDateString() !== new Date(message.sent_at).toDateString();
                  return (
                    <React.Fragment key={message.id}>
                      {newDay && <div className={styles.dayDivider}><span>{dayLabel(message.sent_at)}</span></div>}
                      <article className={`${styles.messageRow} ${own ? styles.ownMessage : ''}`}>
                        <div className={styles.bubble}>
                          <p>{message.body}</p>
                          <time dateTime={message.sent_at}>{new Date(message.sent_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
                        </div>
                      </article>
                    </React.Fragment>
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
                  rows={1}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                />
                <button type="submit" disabled={sending || !draft.trim()} aria-label={sending ? 'Enviando...' : 'Enviar'}>
                  <SendHorizontal size={19} aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <div className={styles.emptyThread}>
              <EmptyState
                icon={<MessageCircle size={22} aria-hidden="true" />}
                title="Suas conversas"
                description="Selecione uma conversa para ver as mensagens."
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Chat;
