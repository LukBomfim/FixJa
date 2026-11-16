import React, { useEffect, useRef, useState } from 'react';
import { CalendarClock, Mail, MapPin, MessageCircle, MessageSquareQuote, Phone, Send } from 'lucide-react';
import { api, errorMessage } from '../../services/api';
import type { Provider, Review } from '../../services/api';
import PageHeader from '../../components/layout/PageHeader';
import Avatar from '../../components/ui/Avatar';
import CategoryIcon from '../../components/ui/CategoryIcon';
import { RatingBadge, StarDisplay } from '../../components/ui/StarRating';
import { EmptyState, Skeleton, SkeletonList } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/format';
import styles from './Client.module.css';

interface ProviderDetailProps {
  providerId: string;
  onBack: () => void;
  onOpenChat: (providerId?: string) => void;
  onOpenOrders: () => void;
}

function nowForInput(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

/** Perfil público do prestador com avaliações e formulário de solicitação. */
export const ProviderDetail: React.FC<ProviderDetailProps> = ({ providerId, onBack, onOpenChat, onOpenOrders }) => {
  const toast = useToast();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [providerLoading, setProviderLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let active = true;
    setProviderLoading(true);
    setError('');
    api.provider(providerId)
      .then((result) => { if (active) setProvider(result); })
      .catch((requestError: unknown) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setProviderLoading(false); });
    return () => { active = false; };
  }, [providerId]);

  useEffect(() => {
    if (!provider) return;
    let active = true;
    setReviewsLoading(true);
    api.reviews(provider.id)
      .then((result) => { if (active) setReviews(result); })
      .catch((requestError: unknown) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setReviewsLoading(false); });
    return () => { active = false; };
  }, [provider?.id]);

  const handleCreateContract = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!provider) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createContract({
        prestador_id: provider.id,
        descricao: description.trim(),
        data_solicitada: new Date(requestedDate).toISOString(),
      });
      setNotice('Sua solicitação foi registrada. Você pode acompanhar o status em Minhas contratações.');
      toast.show('Solicitação enviada ao prestador.', 'success');
      setDescription('');
      setRequestedDate('');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (providerLoading) {
    return (
      <div className={styles.view} role="status" aria-label="Carregando perfil">
        <PageHeader title={<Skeleton width={180} height={28} />} onBack={onBack} backLabel="Voltar para a lista" />
        <SkeletonList count={2} />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className={styles.view}>
        <PageHeader title="Perfil indisponível" onBack={onBack} backLabel="Voltar para a lista" />
        <p className="fx-alert fx-alert--error" role="alert">{error || 'Não foi possível carregar este prestador.'}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.view} fx-rise`}>
      <PageHeader title="Perfil do profissional" onBack={onBack} backLabel="Voltar para a lista" />

      <div className={styles.detailGrid}>
        <div className={styles.detailMain}>
          <section className={`fx-card ${styles.detailHero}`}>
            <Avatar name={provider.username} size="xl" />
            <div className={styles.detailIdentity}>
              <h2>{provider.username}</h2>
              <span className={styles.categoryBadge}>
                <CategoryIcon name={provider.categoria} size={14} /> {provider.categoria || 'Prestador'}
              </span>
              <span className={styles.providerCity}><MapPin size={14} aria-hidden="true" /> {provider.cidade || 'Cidade não informada'}{provider.estado ? ` - ${provider.estado}` : ''}</span>
            </div>
            <div className={styles.detailRating}>
              <RatingBadge value={provider.avaliacao} />
              <small>{reviews.length} avaliação(ões)</small>
            </div>
            <div className={styles.detailActions}>
              <button type="button" className="fx-btn fx-btn--primary" onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <CalendarClock size={17} aria-hidden="true" /> Solicitar serviço
              </button>
              <button type="button" className="fx-btn fx-btn--outline" onClick={() => onOpenChat(provider.id)}>
                <MessageCircle size={17} aria-hidden="true" /> Conversar
              </button>
            </div>
          </section>

          <section className={`fx-card ${styles.detailBlock}`} aria-labelledby="about-title">
            <h3 id="about-title" className="fx-section-title">Sobre</h3>
            <p className="fx-muted">{provider.descricao || 'Este prestador ainda não adicionou uma descrição.'}</p>
            <ul className={styles.contactList}>
              <li>
                <Phone size={16} aria-hidden="true" />
                {provider.telefone
                  ? <a href={`tel:${provider.telefone.replace(/[^\d+]/g, '')}`}>{provider.telefone}</a>
                  : <span className="fx-faint">Telefone não informado</span>}
              </li>
              <li>
                <Mail size={16} aria-hidden="true" />
                <a href={`mailto:${provider.email}`}>{provider.email}</a>
              </li>
            </ul>
          </section>

          <section className={`fx-card ${styles.detailBlock}`} aria-labelledby="reviews-title">
            <h3 id="reviews-title" className="fx-section-title">Avaliações</h3>
            {reviewsLoading ? <SkeletonList count={2} label="Carregando avaliações" /> : reviews.length === 0 ? (
              <EmptyState compact icon={<MessageSquareQuote size={20} aria-hidden="true" />} title="Ainda não há avaliações" />
            ) : (
              <div className={styles.reviewList}>
                {reviews.map((review) => (
                  <article key={review.id} className={styles.reviewItem}>
                    <div className={styles.reviewHead}>
                      <StarDisplay value={review.nota} />
                      <time dateTime={review.data}>{formatDate(review.data)}</time>
                    </div>
                    {review.comentario && <p>{review.comentario}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className={styles.detailSide}>
          <form ref={formRef} className={`fx-card ${styles.requestForm}`} onSubmit={handleCreateContract}>
            <h3 className="fx-section-title">Solicitar serviço</h3>
            <div className="fx-field">
              <label className="fx-label" htmlFor="request-description">Descreva o serviço</label>
              <textarea
                id="request-description"
                className="fx-input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ex.: vazamento embaixo da pia da cozinha"
                required
                rows={4}
              />
            </div>
            <div className="fx-field">
              <label className="fx-label" htmlFor="request-date">Data e horário desejados</label>
              <input
                id="request-date"
                className="fx-input"
                type="datetime-local"
                min={nowForInput()}
                value={requestedDate}
                onChange={(event) => setRequestedDate(event.target.value)}
                required
              />
            </div>
            {error && <p className="fx-alert fx-alert--error" role="alert">{error}</p>}
            {notice && (
              <div className="fx-alert fx-alert--success" role="status">
                <span>
                  {notice}{' '}
                  <button type="button" className="fx-link" onClick={onOpenOrders}>Ver pedidos</button>
                </span>
              </div>
            )}
            <button type="submit" className="fx-btn fx-btn--primary fx-btn--block fx-btn--lg" disabled={submitting}>
              <Send size={17} aria-hidden="true" /> {submitting ? 'Enviando...' : 'Enviar solicitação'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};

export default ProviderDetail;
