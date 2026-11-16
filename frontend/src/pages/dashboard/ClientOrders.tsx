import React, { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, CircleCheck, ClipboardList, Clock3, List, MessageCircle, Star, UserRound } from 'lucide-react';
import { api, errorMessage } from '../../services/api';
import type { Contract, Provider } from '../../services/api';
import PageHeader from '../../components/layout/PageHeader';
import CategoryIcon from '../../components/ui/CategoryIcon';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import StatusPill from '../../components/ui/StatusPill';
import { StarInput } from '../../components/ui/StarRating';
import { EmptyState, SkeletonList } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatDateTime } from '../../utils/format';
import styles from './Client.module.css';

type OrdersTab = 'all' | 'active' | 'done';

interface ClientOrdersProps {
  providerIndex: Record<string, Provider>;
  onOpenChat: (providerId?: string) => void;
  onOpenProvider: (id: string) => void;
  onFindProviders: () => void;
}

/** "Minhas contratações": abas Todas/Ativas/Concluídas, cancelamento, conclusão e avaliação. */
export const ClientOrders: React.FC<ClientOrdersProps> = ({ providerIndex, onOpenChat, onOpenProvider, onFindProviders }) => {
  const toast = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<OrdersTab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, number>>({});
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.contracts()
      .then((result) => { if (active) setContracts(result); })
      .catch((requestError: unknown) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const sorted = [...contracts].sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));
  const activeList = sorted.filter((contract) => contract.status === 'pendente' || contract.status === 'aceito');
  const doneList = sorted.filter((contract) => contract.status === 'concluido');
  const visible = tab === 'active' ? activeList : tab === 'done' ? doneList : sorted;

  const replace = (updated: Contract) => setContracts((current) => current.map((item) => item.id === updated.id ? updated : item));

  const handleCancelContract = async (contract: Contract) => {
    setError('');
    setBusy(contract.id);
    try {
      replace(await api.updateContract(contract.id, 'cancelado'));
      setConfirmingCancel(null);
      toast.show('Solicitação cancelada.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(null);
    }
  };

  const handleConfirmCompletion = async (contract: Contract) => {
    setError('');
    setBusy(contract.id);
    try {
      replace(await api.updateContract(contract.id, 'concluido'));
      toast.show('Conclusão do serviço confirmada.', 'success');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(null);
    }
  };

  const handleReview = async (contract: Contract) => {
    setError('');
    setBusy(contract.id);
    try {
      await api.createReview(contract.id, reviewNotes[contract.id] || 5, reviewComments[contract.id] || '');
      setContracts((current) => current.map((item) => item.id === contract.id ? { ...item, avaliada: true } : item));
      setReviewing(null);
      toast.show('Avaliação registrada. Obrigado!', 'success');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`${styles.view} fx-rise`}>
      <PageHeader title="Minhas contratações" />

      <SegmentedTabs<OrdersTab>
        label="Filtrar contratações"
        value={tab}
        onChange={setTab}
        options={[
          { id: 'all', label: 'Todas', icon: <List size={16} aria-hidden="true" /> },
          { id: 'active', label: 'Ativas', icon: <Clock3 size={16} aria-hidden="true" />, count: activeList.length },
          { id: 'done', label: 'Concluídas', icon: <CircleCheck size={16} aria-hidden="true" /> },
        ]}
      />

      {error && <p className="fx-alert fx-alert--error" role="alert">{error}</p>}

      {loading ? (
        <SkeletonList count={3} label="Carregando contratações" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} aria-hidden="true" />}
          title={contracts.length === 0 ? 'Você ainda não tem contratações' : 'Nada por aqui'}
          description={contracts.length === 0 ? 'Encontre um profissional e solicite seu primeiro serviço.' : 'Não há contratações nesta aba.'}
          action={contracts.length === 0 ? <button type="button" className="fx-btn fx-btn--primary fx-btn--sm" onClick={onFindProviders}>Encontrar profissionais</button> : undefined}
        />
      ) : (
        <div className={`${styles.orderList} fx-stagger`}>
          {visible.map((contract) => {
            const provider = providerIndex[contract.prestador_id];
            const isOpen = expanded === contract.id;
            const isBusy = busy === contract.id;
            return (
              <article key={contract.id} className={`fx-card ${styles.order}`}>
                <button
                  type="button"
                  className={styles.orderMain}
                  onClick={() => setExpanded(isOpen ? null : contract.id)}
                  aria-expanded={isOpen}
                  aria-controls={`order-${contract.id}`}
                >
                  <span className={styles.orderIcon}><CategoryIcon name={provider?.categoria} size={22} /></span>
                  <span className={styles.orderText}>
                    <strong>{contract.prestador_nome || provider?.username || 'Nome indisponível'}</strong>
                    <span>{contract.descricao}</span>
                  </span>
                  <span className={styles.orderSide}>
                    <StatusPill status={contract.status} />
                    <ChevronDown size={18} aria-hidden="true" className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
                  </span>
                </button>

                {contract.status === 'recusado' && (
                  <p className={styles.refusal} role="status">{contract.mensagem || 'O prestador recusou o seu pedido.'}</p>
                )}

                {isOpen && (
                  <div id={`order-${contract.id}`} className={styles.orderDetails}>
                    <dl>
                      <div><dt>Data solicitada</dt><dd>{formatDateTime(contract.data_solicitada)}</dd></div>
                      <div><dt>Pedido criado em</dt><dd>{formatDateTime(contract.created_at)}</dd></div>
                    </dl>
                    <div className={styles.orderLinks}>
                      <button type="button" className="fx-btn fx-btn--soft fx-btn--sm" onClick={() => onOpenChat(contract.prestador_id)}>
                        <MessageCircle size={15} aria-hidden="true" /> Conversar
                      </button>
                      <button type="button" className="fx-btn fx-btn--soft fx-btn--sm" onClick={() => onOpenProvider(contract.prestador_id)}>
                        <UserRound size={15} aria-hidden="true" /> Ver perfil
                      </button>
                    </div>
                  </div>
                )}

                <div className={styles.orderFoot}>
                  <span className={styles.orderDate}><CalendarDays size={15} aria-hidden="true" /> {formatDate(contract.data_solicitada)}</span>
                  <div className={styles.orderActions}>
                    {(contract.status === 'pendente' || contract.status === 'aceito') && confirmingCancel !== contract.id && (
                      <>
                        <button type="button" className="fx-btn fx-btn--ghost fx-btn--sm" onClick={() => setConfirmingCancel(contract.id)}>Cancelar</button>
                        {contract.status === 'aceito' && (
                          <button type="button" className="fx-btn fx-btn--primary fx-btn--sm" disabled={isBusy} onClick={() => void handleConfirmCompletion(contract)}>
                            <CircleCheck size={15} aria-hidden="true" /> Confirmar conclusão
                          </button>
                        )}
                      </>
                    )}
                    {confirmingCancel === contract.id && (
                      <span className={styles.confirmRow}>
                        <span>Cancelar solicitação?</span>
                        <button type="button" className="fx-btn fx-btn--ghost fx-btn--sm" onClick={() => setConfirmingCancel(null)}>Não</button>
                        <button type="button" className="fx-btn fx-btn--danger fx-btn--sm" disabled={isBusy} onClick={() => void handleCancelContract(contract)}>Sim, cancelar</button>
                      </span>
                    )}
                    {contract.status === 'concluido' && !contract.avaliada && reviewing !== contract.id && (
                      <button type="button" className="fx-btn fx-btn--outline fx-btn--sm" onClick={() => setReviewing(contract.id)}>
                        <Star size={15} aria-hidden="true" /> Avaliar serviço
                      </button>
                    )}
                    {contract.status === 'concluido' && contract.avaliada && (
                      <span className={styles.reviewed}><CircleCheck size={15} aria-hidden="true" /> Avaliação enviada</span>
                    )}
                  </div>
                </div>

                {reviewing === contract.id && contract.status === 'concluido' && !contract.avaliada && (
                  <form
                    className={styles.reviewForm}
                    onSubmit={(event) => { event.preventDefault(); void handleReview(contract); }}
                  >
                    <StarInput
                      name={`review-note-${contract.id}`}
                      label="Como foi o serviço?"
                      value={reviewNotes[contract.id] || 5}
                      onChange={(note) => setReviewNotes((current) => ({ ...current, [contract.id]: note }))}
                    />
                    <div className="fx-field">
                      <label className="fx-label" htmlFor={`review-comment-${contract.id}`}>Comentário (opcional)</label>
                      <textarea
                        id={`review-comment-${contract.id}`}
                        className="fx-input"
                        rows={2}
                        placeholder="Conte como foi o atendimento"
                        value={reviewComments[contract.id] || ''}
                        onChange={(event) => setReviewComments((current) => ({ ...current, [contract.id]: event.target.value }))}
                      />
                    </div>
                    <div className={styles.filterActions}>
                      <button type="button" className="fx-btn fx-btn--ghost fx-btn--sm" onClick={() => setReviewing(null)}>Agora não</button>
                      <button type="submit" className="fx-btn fx-btn--primary fx-btn--sm" disabled={isBusy}>{isBusy ? 'Enviando...' : 'Enviar avaliação'}</button>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientOrders;
