import React, { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleCheck,
  ClipboardList,
  Inbox,
  Layers3,
  ListOrdered,
  Mail,
  MessageCircle,
  Phone,
  Star,
  Undo2,
  Wrench,
} from 'lucide-react';
import styles from './DashboardPrestador.module.css';
import { api, errorMessage } from '../../services/api';
import type { Contract, ContractStatus, UserProfile } from '../../services/api';
import { LinkedList, Stack } from '../../dataStructures';
import Avatar from '../../components/ui/Avatar';
import PageHeader from '../../components/layout/PageHeader';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import StatusPill, { STATUS_LABELS } from '../../components/ui/StatusPill';
import { EmptyState, SkeletonList } from '../../components/ui/Feedback';
import { useToast } from '../../components/ui/Toast';
import { firstName, formatDateTime, formatRating } from '../../utils/format';

export type ProviderView = 'home' | 'orders';

interface DashboardPrestadorProps {
  profile: UserProfile;
  view?: ProviderView;
  onOpenChat: () => void;
  onNavigate?: (view: ProviderView) => void;
}

const FLOW: ContractStatus[] = ['pendente', 'aceito', 'concluido'];

interface ProviderAction {
  contractId: string;
  client: string;
  previousStatus: ContractStatus;
  nextStatus: ContractStatus;
  createdAt: string;
}

type OrdersTab = 'queue' | 'active' | 'finished';

export const DashboardPrestador: React.FC<DashboardPrestadorProps> = ({ profile, view = 'home', onOpenChat, onNavigate }) => {
  const toast = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [actionHistory, setActionHistory] = useState<ProviderAction[]>([]);
  const [currentContract, setCurrentContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [ordersTab, setOrdersTab] = useState<OrdersTab>('queue');
  const contractList = useMemo(() => {
    const list = new LinkedList<Contract>();
    contracts.forEach((contract) => list.append(contract));
    return list;
  }, [contracts]);
  const actionsStack = new Stack(actionHistory);

  useEffect(() => {
    let active = true;
    api.contracts()
      .then((result) => {
        if (!active) return;
        setContracts(result);
        setCurrentContract(result.find((contract) => contract.status === 'aceito') || null);
      })
      .catch((requestError: unknown) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const pendingContracts = [...contractList]
    .filter((contract) => contract.status === 'pendente')
    .sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at));
  const activeContracts = [...contractList].filter((contract) => contract.status === 'aceito');
  const finishedContracts = [...contractList]
    .filter((contract) => contract.status === 'concluido')
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));

  const updateStatus = async (status: ContractStatus, targetContract = currentContract) => {
    if (!targetContract) return;
    setUpdating(true);
    setError('');
    try {
      const updated = await api.updateContract(targetContract.id, status);
      setContracts((current) => {
        const list = new LinkedList<Contract>();
        current.forEach((contract) => list.append(contract));
        list.remove((contract) => contract.id === updated.id);
        list.append(updated);
        return [...list];
      });
      setActionHistory((current) => {
        const stack = new Stack(current);
        stack.push({
          contractId: updated.id,
          client: updated.cliente_nome || 'Cliente',
          previousStatus: targetContract.status,
          nextStatus: updated.status,
          createdAt: new Date().toISOString(),
        });
        return stack.toArrayNewestFirst().reverse();
      });
      setCurrentContract(updated);
      toast.show(`${updated.cliente_nome || 'Cliente'}: ${STATUS_LABELS[targetContract.status]} → ${STATUS_LABELS[updated.status]}`, 'success');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setUpdating(false);
    }
  };

  const attend = (contract: Contract) => {
    setCurrentContract(contractList.find((item) => item.id === contract.id) || contract);
    if (view !== 'home') onNavigate?.('home');
  };

  const contactLinks = (contract: Contract) => (
    <div className={styles.contacts}>
      {contract.cliente_telefone && (
        <a href={`tel:${contract.cliente_telefone.replace(/[^\d+]/g, '')}`}><Phone size={14} aria-hidden="true" /> {contract.cliente_telefone}</a>
      )}
      {contract.cliente_email && <a href={`mailto:${contract.cliente_email}`}><Mail size={14} aria-hidden="true" /> {contract.cliente_email}</a>}
      {!contract.cliente_telefone && !contract.cliente_email && <small>Contato não informado.</small>}
    </div>
  );

  /* ---------------- Início ---------------- */
  if (view === 'home') {
    const nextInQueue = pendingContracts[0];
    return (
      <div className={`${styles.view} fx-rise`}>
        <PageHeader
          eyebrow={`Olá, ${firstName(profile.username)}`}
          title="Painel do profissional"
          subtitle="Gerencie suas solicitações de serviço."
          size="lg"
        />

        {error && <p className="fx-alert fx-alert--error" role="alert">{error}</p>}

        <section className={`${styles.stats} fx-stagger`} aria-label="Resumo">
          <button type="button" className={styles.statCard} onClick={() => { setOrdersTab('queue'); onNavigate?.('orders'); }}>
            <span className={styles.statIcon}><ListOrdered size={20} aria-hidden="true" /></span>
            <strong>{loading ? '–' : pendingContracts.length}</strong>
            <span>Pendentes</span>
          </button>
          <button type="button" className={styles.statCard} onClick={() => { setOrdersTab('active'); onNavigate?.('orders'); }}>
            <span className={styles.statIcon}><BriefcaseBusiness size={20} aria-hidden="true" /></span>
            <strong>{loading ? '–' : activeContracts.length}</strong>
            <span>Em atendimento</span>
          </button>
          <div className={styles.statCard}>
            <span className={styles.statIcon}><Star size={20} aria-hidden="true" /></span>
            <strong>{formatRating(profile.avaliacao)}</strong>
            <span>Avaliação</span>
          </div>
        </section>

        <div className={styles.homeGrid}>
          <section className={`fx-card ${styles.current}`} aria-labelledby="current-title">
            <div className={styles.cardHead}>
              <div>
                <h2 id="current-title" className="fx-section-title">Atendimento atual</h2>
                <p className={styles.cardSub}>Controle de status</p>
              </div>
              {currentContract && <StatusPill status={currentContract.status} />}
            </div>

            {!currentContract ? (
              <EmptyState
                compact
                icon={<Wrench size={22} aria-hidden="true" />}
                title="Nenhuma solicitação selecionada"
                description={nextInQueue ? 'Atenda o próximo cliente da fila para começar.' : 'Quando chegar um pedido, ele aparece na sua fila.'}
                action={nextInQueue ? <button type="button" className="fx-btn fx-btn--primary fx-btn--sm" onClick={() => attend(nextInQueue)}>Atender próximo</button> : undefined}
              />
            ) : (
              <div className={styles.currentBody}>
                <div className={styles.client}>
                  <Avatar name={currentContract.cliente_nome} size="lg" />
                  <div>
                    <strong>{currentContract.cliente_nome || 'Nome indisponível'}</strong>
                    <span>{profile.categoria || 'Serviço'}</span>
                  </div>
                </div>
                <p className={styles.description}>{currentContract.descricao}</p>
                <p className={styles.when}><CalendarDays size={15} aria-hidden="true" /> Solicitado para {formatDateTime(currentContract.data_solicitada)}</p>
                {contactLinks(currentContract)}

                <ol className={styles.stepper} aria-label="Etapas do atendimento">
                  {FLOW.map((status, index) => {
                    const position = FLOW.indexOf(currentContract.status);
                    const done = position > index;
                    const now = position === index;
                    return (
                      <li key={status} className={`${done ? styles.stepDone : ''} ${now ? styles.stepNow : ''}`} aria-current={now ? 'step' : undefined}>
                        <span className={styles.stepDot}>{done ? <Check size={13} aria-hidden="true" /> : index + 1}</span>
                        <span>{STATUS_LABELS[status]}</span>
                      </li>
                    );
                  })}
                </ol>

                <div className={styles.actions}>
                  {currentContract.status === 'pendente' && (
                    <>
                      <button type="button" className="fx-btn fx-btn--primary fx-btn--lg" disabled={updating} onClick={() => void updateStatus('aceito')}>
                        {updating ? 'Salvando...' : 'Aceitar serviço'}
                      </button>
                      <button type="button" className="fx-btn fx-btn--danger" disabled={updating} onClick={() => void updateStatus('recusado')}>Recusar</button>
                    </>
                  )}
                  {currentContract.status === 'aceito' && (
                    <button type="button" className="fx-btn fx-btn--accent fx-btn--lg" disabled={updating} onClick={() => void updateStatus('concluido')}>
                      <CircleCheck size={18} aria-hidden="true" /> {updating ? 'Salvando...' : 'Finalizar serviço'}
                    </button>
                  )}
                  {currentContract.status === 'concluido' && <p className="fx-alert fx-alert--success">Serviço concluído</p>}
                  {currentContract.status === 'cancelado' && <p className="fx-alert fx-alert--warning">Solicitação cancelada</p>}
                  {currentContract.status === 'recusado' && <p className="fx-alert fx-alert--warning">Solicitação recusada</p>}
                </div>
              </div>
            )}
          </section>

          <div className={styles.sideCol}>
            <section className={`fx-card ${styles.panel}`} aria-labelledby="next-title">
              <div className={styles.cardHead}>
                <div>
                  <h2 id="next-title" className="fx-section-title">Próximo da fila</h2>
                  <p className={styles.cardSub}>Ordem de chegada (FIFO)</p>
                </div>
                <button type="button" className="fx-section-link" onClick={() => { setOrdersTab('queue'); onNavigate?.('orders'); }}>Ver fila</button>
              </div>
              {loading ? <SkeletonList count={1} /> : !nextInQueue ? (
                <p className={styles.muted}>Não há solicitações pendentes.</p>
              ) : (
                <div className={styles.nextItem}>
                  <span className={styles.queueNumber}>1</span>
                  <div className={styles.nextText}>
                    <strong>{nextInQueue.cliente_nome || 'Nome indisponível'}</strong>
                    <span>{nextInQueue.descricao}</span>
                  </div>
                  <button type="button" className="fx-btn fx-btn--primary fx-btn--sm" onClick={() => attend(nextInQueue)}>Atender</button>
                </div>
              )}
              <button type="button" className={`fx-btn fx-btn--soft fx-btn--block ${styles.chatShortcut}`} onClick={onOpenChat}>
                <MessageCircle size={17} aria-hidden="true" /> Abrir mensagens
              </button>
            </section>

            <section className={`fx-card ${styles.panel}`} aria-labelledby="action-stack-heading">
              <div className={styles.cardHead}>
                <div>
                  <h2 id="action-stack-heading" className="fx-section-title">Histórico de ações</h2>
                  <p className={styles.cardSub}>Pilha — última ação no topo</p>
                </div>
                <span className={styles.badge} aria-label={actionsStack.peek() ? 'Pilha com ações' : 'Pilha vazia'}>
                  <Layers3 size={14} aria-hidden="true" /> {actionHistory.length}
                </span>
              </div>
              {actionsStack.peek() ? (
                <>
                  <ol className={styles.stack}>
                    {actionsStack.toArrayNewestFirst().map((action, index) => (
                      <li key={`${action.contractId}-${action.createdAt}`} className={index === 0 ? styles.stackTop : ''}>
                        <strong>{action.client}</strong>
                        <span>{STATUS_LABELS[action.previousStatus]} → {STATUS_LABELS[action.nextStatus]}</span>
                        <small>{formatDateTime(action.createdAt)}</small>
                      </li>
                    ))}
                  </ol>
                  <button
                    type="button"
                    className="fx-btn fx-btn--ghost fx-btn--sm"
                    onClick={() => setActionHistory((current) => {
                      const stack = new Stack(current);
                      stack.pop();
                      return stack.toArrayNewestFirst().reverse();
                    })}
                  >
                    <Undo2 size={15} aria-hidden="true" /> Ocultar último registro
                  </button>
                  <p className={styles.hint}>Isso não altera o status da contratação.</p>
                </>
              ) : <p className={styles.muted}>As próximas ações de status confirmadas serão registradas aqui.</p>}
            </section>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Pedidos ---------------- */
  const lists: Record<OrdersTab, Contract[]> = {
    queue: pendingContracts,
    active: activeContracts,
    finished: finishedContracts,
  };
  const visible = lists[ordersTab];

  return (
    <div className={`${styles.view} fx-rise`}>
      <PageHeader title="Pedidos" subtitle="Solicitações, atendimentos e histórico." />

      <SegmentedTabs<OrdersTab>
        label="Filtrar pedidos"
        value={ordersTab}
        onChange={setOrdersTab}
        options={[
          { id: 'queue', label: 'Fila', icon: <ListOrdered size={16} aria-hidden="true" />, count: pendingContracts.length },
          { id: 'active', label: 'Em andamento', icon: <BriefcaseBusiness size={16} aria-hidden="true" />, count: activeContracts.length },
          { id: 'finished', label: 'Finalizados', icon: <CircleCheck size={16} aria-hidden="true" /> },
        ]}
      />

      {ordersTab === 'queue' && (
        <p className={styles.queueNote}><ListOrdered size={15} aria-hidden="true" /> Fila de atendimento: o primeiro a chegar é o primeiro a ser atendido.</p>
      )}

      {error && <p className="fx-alert fx-alert--error" role="alert">{error}</p>}

      {loading ? <SkeletonList count={3} label="Carregando solicitações" /> : visible.length === 0 ? (
        <EmptyState
          icon={ordersTab === 'queue' ? <Inbox size={22} aria-hidden="true" /> : <ClipboardList size={22} aria-hidden="true" />}
          title={ordersTab === 'queue' ? 'Não há solicitações pendentes.' : ordersTab === 'active' ? 'Não há atendimentos em andamento.' : 'Nenhum atendimento finalizado.'}
        />
      ) : (
        <div className={`${styles.requests} fx-stagger`}>
          {visible.map((contract, index) => (
            <article
              key={contract.id}
              className={`fx-card ${styles.request} ${ordersTab === 'queue' && index === 0 ? styles.requestNext : ''}`}
            >
              {ordersTab !== 'active' && <span className={styles.queueNumber}>{index + 1}</span>}
              <div className={styles.requestBody}>
                <div className={styles.requestHead}>
                  <strong>{contract.cliente_nome || 'Nome indisponível'}</strong>
                  <StatusPill status={contract.status} />
                </div>
                <span className={styles.service}>{profile.categoria || 'Serviço'}</span>
                <p>{contract.descricao}</p>
                <small className={styles.when}><CalendarDays size={14} aria-hidden="true" /> Solicitado para {formatDateTime(contract.data_solicitada)}</small>
                {ordersTab === 'active' && contactLinks(contract)}
                {ordersTab === 'queue' && (
                  <div className={styles.requestActions}>
                    <button
                      type="button"
                      className="fx-btn fx-btn--primary fx-btn--sm"
                      disabled={index !== 0}
                      onClick={() => attend(contract)}
                    >
                      {index === 0 ? 'Atender' : 'Na fila'}
                    </button>
                    <button type="button" className="fx-btn fx-btn--danger fx-btn--sm" disabled={updating} onClick={() => void updateStatus('recusado', contract)}>Recusar</button>
                  </div>
                )}
                {ordersTab === 'active' && (
                  <div className={styles.requestActions}>
                    <button type="button" className="fx-btn fx-btn--soft fx-btn--sm" onClick={() => attend(contract)}>Controlar status</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPrestador;
