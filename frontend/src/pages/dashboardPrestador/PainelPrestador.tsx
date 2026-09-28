import React, { useEffect, useState } from 'react';
import styles from './DashboardPrestador.module.css';
import { api, errorMessage } from '../../services/api';
import type { Contract, ContractStatus, UserProfile } from '../../services/api';

interface DashboardPrestadorProps {
  profile: UserProfile;
}

const STATUS_LABELS: Record<ContractStatus, string> = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  recusado: 'Recusado',
};

const STATUS_ORDER: ContractStatus[] = ['pendente', 'aceito', 'concluido', 'cancelado', 'recusado'];

export const DashboardPrestador: React.FC<DashboardPrestadorProps> = ({ profile }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [currentContract, setCurrentContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

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

  const pendingContracts = contracts.filter((contract) => contract.status === 'pendente');
  const activeContracts = contracts.filter((contract) => contract.status === 'aceito');
  const finishedContracts = contracts.filter((contract) => contract.status === 'concluido');

  const updateStatus = async (status: ContractStatus, targetContract = currentContract) => {
    if (!targetContract) return;
    setUpdating(true);
    setError('');
    try {
      const updated = await api.updateContract(targetContract.id, status);
      setContracts((current) => current.map((contract) => contract.id === updated.id ? updated : contract));
      setCurrentContract(updated);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.greeting}>Olá, {profile.username}</p>
          <h1 className={styles.title}>Painel do profissional</h1>
          <p className={styles.subtitle}>Gerencie suas solicitações de serviço.</p>
        </div>
        <div className={styles.providerProfile}>
          <div className={styles.avatar} aria-hidden="true">{profile.username.slice(0, 1).toLocaleUpperCase()}</div>
          <div><strong>{profile.username}</strong><span>{profile.categoria || 'Prestador'}</span></div>
        </div>
      </header>

      {error && <p className={styles.errorMessage} role="alert">{error}</p>}

      <section className={styles.stats}>
        <div className={styles.statCard}><span className={styles.statIcon}>Fila</span><div><strong>{pendingContracts.length}</strong><span>Solicitações pendentes</span></div></div>
        <div className={styles.statCard}><span className={styles.statIcon}>Ativo</span><div><strong>{activeContracts.length}</strong><span>Em atendimento</span></div></div>
        <div className={styles.statCard}><span className={styles.statIcon}>Média</span><div><strong>{Number(profile.avaliacao || 0).toFixed(1)}</strong><span>Avaliação</span></div></div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div><h2>Solicitações pendentes</h2><p>Fila de atendimento</p></div>
            <span className={styles.fifoBadge}>FILA</span>
          </div>
          {loading ? <p className={styles.empty}>Carregando solicitações...</p> : pendingContracts.length === 0 ? (
            <div className={styles.empty}><p>Não há solicitações pendentes.</p></div>
          ) : (
            <div className={styles.queue}>
              {pendingContracts.map((contract, index) => (
                <article key={contract.id} className={`${styles.requestCard} ${index === 0 ? styles.nextRequest : ''}`}>
                  <div className={styles.requestNumber}>{index + 1}</div>
                  <div className={styles.requestInfo}>
                    <strong>Cliente: {contract.cliente_nome || 'Nome indisponível'}</strong>
                    <span className={styles.serviceName}>{profile.categoria || 'Serviço'}</span>
                    <p>{contract.descricao}</p>
                    <small>Solicitado para {new Date(contract.data_solicitada).toLocaleString('pt-BR')}</small>
                    <span className={styles.requestStatus}>{STATUS_LABELS[contract.status]}</span>
                  </div>
                  <div className={styles.requestActions}>
                    <button type="button" className={styles.attendBtn} onClick={() => setCurrentContract(contract)}>Atender</button>
                    <button type="button" className={styles.refuseBtn} disabled={updating} onClick={() => void updateStatus('recusado', contract)}>Recusar</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div><h2>Atendimentos em andamento</h2><p>Serviços aceitos</p></div>
            <span className={styles.stackBadge}>{activeContracts.length}</span>
          </div>
          {loading ? <div className={styles.empty}>Carregando atendimentos...</div> : activeContracts.length === 0 ? (
            <div className={styles.empty}><p>Não há atendimentos em andamento.</p></div>
          ) : (
            <div className={styles.queue}>
              {activeContracts.map((contract) => (
                <article key={contract.id} className={styles.requestCard}>
                  <div className={styles.requestInfo}>
                    <strong>Cliente: {contract.cliente_nome || 'Nome indisponível'}</strong>
                    <span className={styles.serviceName}>{profile.categoria || 'Serviço'}</span>
                    <p>{contract.descricao}</p>
                    <small>Solicitado para {new Date(contract.data_solicitada).toLocaleString('pt-BR')}</small>
                    <div className={styles.contactDetails}>
                      {contract.cliente_telefone && <a href={`tel:${contract.cliente_telefone.replace(/[^\d+]/g, '')}`}>Telefone: {contract.cliente_telefone}</a>}
                      {contract.cliente_email && <a href={`mailto:${contract.cliente_email}`}>E-mail: {contract.cliente_email}</a>}
                      {!contract.cliente_telefone && !contract.cliente_email && <small>Contato não informado.</small>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div><h2>Atendimento atual</h2><p>Controle de status</p></div>
            <span className={styles.stackBadge}>STATUS</span>
          </div>
          {!currentContract ? (
            <div className={styles.noService}><p>Nenhuma solicitação selecionada.</p><small>Selecione uma solicitação pendente.</small></div>
          ) : (
            <div className={styles.currentService}>
              <div className={styles.currentClient}>
                <div className={styles.clientAvatar}>{(currentContract.cliente_nome || 'C').slice(0, 1).toLocaleUpperCase()}</div>
                <div><strong>Cliente: {currentContract.cliente_nome || 'Nome indisponível'}</strong><span>{profile.categoria || 'Serviço'}</span></div>
              </div>
              <p>{currentContract.descricao}</p>
              <div className={styles.contactDetails}>
                {currentContract.cliente_telefone && <a href={`tel:${currentContract.cliente_telefone.replace(/[^\d+]/g, '')}`}>Telefone: {currentContract.cliente_telefone}</a>}
                {currentContract.cliente_email && <a href={`mailto:${currentContract.cliente_email}`}>E-mail: {currentContract.cliente_email}</a>}
                {!currentContract.cliente_telefone && !currentContract.cliente_email && <small>Contato não informado.</small>}
              </div>
              <div className={styles.statusBox}><span>Status atual</span><strong>{STATUS_LABELS[currentContract.status]}</strong></div>
              <div className={styles.statusHistory}>
                {STATUS_ORDER.map((status) => (
                  <div key={status} className={currentContract.status === status ? styles.activeStatus : ''}>{STATUS_LABELS[status]}</div>
                ))}
              </div>
              <div className={styles.actions}>
                {currentContract.status === 'pendente' && <button type="button" className={styles.primaryBtn} disabled={updating} onClick={() => void updateStatus('aceito')}>{updating ? 'Salvando...' : 'Aceitar serviço'}</button>}
                {currentContract.status === 'aceito' && <button type="button" className={styles.finishBtn} disabled={updating} onClick={() => void updateStatus('concluido')}>{updating ? 'Salvando...' : 'Finalizar serviço'}</button>}
                {currentContract.status === 'concluido' && <div className={styles.completed}>Serviço concluído</div>}
                {currentContract.status === 'cancelado' && <div className={styles.waiting}>Solicitação cancelada</div>}
                              {currentContract.status === 'recusado' && <div className={styles.waiting}>Solicitação recusada</div>}
              </div>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}><div><h2>Atendimentos finalizados</h2><p>Histórico de contratações</p></div></div>
          {finishedContracts.length === 0 ? (
            <div className={styles.noService}><p>Nenhum atendimento finalizado.</p></div>
          ) : (
            <div className={styles.queue}>
              {finishedContracts.map((contract, index) => (
                <article key={contract.id} className={styles.requestCard}>
                  <div className={styles.requestNumber}>{index + 1}</div>
                  <div className={styles.requestInfo}>
                    <strong>Cliente: {contract.cliente_nome || 'Nome indisponível'}</strong>
                    <span className={styles.serviceName}>{profile.categoria || 'Serviço'}</span>
                    <p>{contract.descricao}</p>
                    <small>{STATUS_LABELS[contract.status]}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPrestador;