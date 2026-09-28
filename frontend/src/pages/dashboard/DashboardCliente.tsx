    import React, { useEffect, useState } from 'react';
    import styles from './DashboardCliente.module.css';
    import { api, errorMessage } from '../../services/api';
    import type { Category, Contract, ContractStatus, Provider, Review, UserProfile } from '../../services/api';

    interface DashboardClientProps {
      profile: UserProfile;
    }

    const STATUS_LABELS: Record<ContractStatus, string> = {
      pendente: 'Pendente',
      aceito: 'Aceito',
      concluido: 'Concluído',
      cancelado: 'Cancelado',
      recusado: 'Recusado',
    };

    export const DashboardClient: React.FC<DashboardClientProps> = ({ profile }) => {
      const [providers, setProviders] = useState<Provider[]>([]);
      const [categories, setCategories] = useState<Category[]>([]);
      const [contracts, setContracts] = useState<Contract[]>([]);
      const [reviews, setReviews] = useState<Review[]>([]);
      const [reviewsLoading, setReviewsLoading] = useState(false);
      const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
      const [searchTerm, setSearchTerm] = useState('');
      const [category, setCategory] = useState('');
      const [city, setCity] = useState('');
      const [description, setDescription] = useState('');
      const [requestedDate, setRequestedDate] = useState('');
      const [mode, setMode] = useState<'providers' | 'contracts'>('providers');
      const [loading, setLoading] = useState(true);
      const [contractsLoading, setContractsLoading] = useState(false);
      const [providerLoading, setProviderLoading] = useState(false);
      const [submitting, setSubmitting] = useState(false);
      const [error, setError] = useState('');
      const [notice, setNotice] = useState('');
      const [reviewNotes, setReviewNotes] = useState<Record<string, number>>({});
      const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

      useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([api.providers(), api.categories()])
          .then(([providerResults, categoryResults]) => {
            if (!active) return;
            setProviders(providerResults);
            setCategories(categoryResults);
          })
          .catch((requestError: unknown) => {
            if (active) setError(errorMessage(requestError));
          })
          .finally(() => {
            if (active) setLoading(false);
          });
        return () => { active = false; };
      }, []);

      useEffect(() => {
        if (mode !== 'contracts') return;
        let active = true;
        setContractsLoading(true);
        setError('');
        api.contracts()
          .then((result) => { if (active) setContracts(result); })
          .catch((requestError: unknown) => { if (active) setError(errorMessage(requestError)); })
          .finally(() => { if (active) setContractsLoading(false); });
        return () => { active = false; };
      }, [mode]);

      useEffect(() => {
        if (!selectedProvider) return;
        let active = true;
        setReviewsLoading(true);
        api.reviews(selectedProvider.id)
          .then((result) => { if (active) setReviews(result); })
          .catch((requestError: unknown) => { if (active) setError(errorMessage(requestError)); })
          .finally(() => { if (active) setReviewsLoading(false); });
        return () => { active = false; };
      }, [selectedProvider?.id]);

      const filteredProviders = providers.filter((provider) => {
        const query = searchTerm.trim().toLocaleLowerCase();
        return !query || [provider.username, provider.categoria, provider.cidade]
          .some((value) => value?.toLocaleLowerCase().includes(query));
      });

      const handleSearch = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
          setProviders(await api.providers({ categoria: category || undefined, cidade: city || undefined }));
        } catch (requestError) {
          setError(errorMessage(requestError));
        } finally {
          setLoading(false);
        }
      };

      const handleOpenProvider = async (id: string) => {
        setProviderLoading(true);
        setError('');
        setNotice('');
        try {
          setSelectedProvider(await api.provider(id));
        } catch (requestError) {
          setError(errorMessage(requestError));
        } finally {
          setProviderLoading(false);
        }
      };

      const handleCreateContract = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedProvider) return;
        setSubmitting(true);
        setError('');
        try {
          await api.createContract({
            prestador_id: selectedProvider.id,
            descricao: description.trim(),
            data_solicitada: new Date(requestedDate).toISOString(),
          });
          setNotice('Sua solicitação foi registrada. Você pode acompanhar o status em Minhas contratações.');
          setDescription('');
          setRequestedDate('');
        } catch (requestError) {
          setError(errorMessage(requestError));
        } finally {
          setSubmitting(false);
        }
      };

      const handleCancelContract = async (contract: Contract) => {
        setError('');
        try {
          const updated = await api.updateContract(contract.id, 'cancelado');
          setContracts((current) => current.map((item) => item.id === updated.id ? updated : item));
        } catch (requestError) {
          setError(errorMessage(requestError));
        }
      };

      const handleConfirmCompletion = async (contract: Contract) => {
        setError('');
        try {
          const updated = await api.updateContract(contract.id, 'concluido');
          setContracts((current) => current.map((item) => item.id === updated.id ? updated : item));
          setNotice('Conclusão do serviço confirmada.');
        } catch (requestError) {
          setError(errorMessage(requestError));
        }
      };

      const handleReview = async (contract: Contract) => {
        setError('');
        try {
          await api.createReview(contract.id, reviewNotes[contract.id] || 5, reviewComments[contract.id] || '');
          setContracts((current) => current.map((item) => item.id === contract.id ? { ...item, avaliada: true } : item));
          setNotice('Avaliação registrada.');
        } catch (requestError) {
          setError(errorMessage(requestError));
        }
      };

      if (selectedProvider) {
        return (
          <div className={styles.container}>
            <section className={styles.profileView}>
              <button type="button" className={styles.backBtn} onClick={() => setSelectedProvider(null)}>
                Voltar para a lista
              </button>
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatar} aria-hidden="true">{selectedProvider.username.slice(0, 1).toLocaleUpperCase()}</div>
                <div>
                  <h2 className={styles.title}>{selectedProvider.username}</h2>
                  <span className={styles.serviceBadge}>{selectedProvider.categoria || 'Prestador'}</span>
                  <p className={styles.providerLocation}>{selectedProvider.cidade}</p>
                </div>
              </div>
              <p className={styles.subtitle}>{selectedProvider.descricao || 'Este prestador ainda não adicionou uma descrição.'}</p>
              <p className={styles.rating}>Avaliação: {Number(selectedProvider.avaliacao || 0).toFixed(1)}</p>
              <div className={styles.contactBox}>
                <h3 className={styles.contactTitle}>Avaliações</h3>
                {reviewsLoading ? <p className={styles.providerLocation}>Carregando avaliações...</p> : reviews.length === 0 ? (
                  <p className={styles.providerLocation}>Ainda não há avaliações.</p>
                ) : reviews.map((review) => (
                  <div key={review.id} className={styles.reviewItem}>
                    <strong>Nota {review.nota} de 5</strong>
                    {review.comentario && <p>{review.comentario}</p>}
                    <small>{new Date(review.data).toLocaleDateString('pt-BR')}</small>
                  </div>
                ))}
              </div>
              <div className={styles.contactBox}>
                <h3 className={styles.contactTitle}>Informações de contato</h3>
                <div className={styles.contactItem}><strong>Telefone:</strong> {selectedProvider.telefone || 'Não informado'}</div>
                <div className={styles.contactItem}><strong>E-mail:</strong> {selectedProvider.email}</div>
              </div>
              {error && <p className={styles.errorMessage} role="alert">{error}</p>}
              {notice && <p className={styles.successText} role="status">{notice}</p>}
              <form className={styles.requestBox} onSubmit={handleCreateContract}>
                <h3 className={styles.requestTitle}>Solicitar serviço</h3>
                <div className={styles.inputField}>
                  <label className={styles.fieldLabel} htmlFor="request-description">Descreva o serviço</label>
                  <textarea id="request-description" className={styles.formInput} value={description} onChange={(event) => setDescription(event.target.value)} required rows={3} />
                </div>
                <div className={styles.inputField}>
                  <label className={styles.fieldLabel} htmlFor="request-date">Data e horário desejados</label>
                  <input id="request-date" className={styles.formInput} type="datetime-local" value={requestedDate} onChange={(event) => setRequestedDate(event.target.value)} required />
                </div>
                <button type="submit" className={styles.requestBtn} disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Solicitar serviço'}
                </button>
              </form>
            </section>
          </div>
        );
      }

      return (
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>{mode === 'providers' ? `Olá, ${profile.username}` : 'Minhas contratações'}</h1>
            <p className={styles.subtitle}>{mode === 'providers' ? 'Encontre profissionais disponíveis na sua região.' : 'Acompanhe as solicitações e atualize quando necessário.'}</p>
          </header>
          <div className={styles.dashboardToolbar}>
            <button type="button" className={styles.secondaryAction} onClick={() => { setMode('contracts'); setNotice(''); }}>Minhas contratações</button>
          </div>
          {error && <p className={styles.errorMessage} role="alert">{error}</p>}
          {notice && <p className={styles.successText} role="status">{notice}</p>}

          {mode === 'providers' ? (
            <>
              <form className={styles.searchForm} onSubmit={handleSearch}>
                <input type="search" aria-label="Buscar por nome, serviço ou cidade" placeholder="Nome, serviço ou cidade" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className={styles.searchInput} />
                <select aria-label="Categoria" value={category} onChange={(event) => setCategory(event.target.value)} className={styles.searchSelect}>
                  <option value="">Todas as categorias</option>
                  {categories.map((item) => <option key={item.id} value={item.categoria_name}>{item.categoria_name}</option>)}
                </select>
                <input type="search" aria-label="Filtrar por cidade" placeholder="Cidade" value={city} onChange={(event) => setCity(event.target.value)} className={styles.searchInput} />
                <button type="submit" className={styles.viewProfileBtn} disabled={loading}>Buscar</button>
              </form>
              {loading || providerLoading ? <p className={styles.emptyState} role="status">Carregando prestadores...</p> : filteredProviders.length === 0 ? (
                <div className={styles.emptyState}>{error ? 'Não foi possível carregar prestadores.' : 'Nenhum prestador encontrado.'}</div>
              ) : (
                <div className={styles.grid}>
                  {filteredProviders.map((provider) => (
                    <article key={provider.id} className={styles.card}>
                      <div>
                        <div className={styles.cardHeader}>
                          <div className={styles.avatar} aria-hidden="true">{provider.username.slice(0, 1).toLocaleUpperCase()}</div>
                          <div><h2 className={styles.providerName}>{provider.username}</h2><p className={styles.providerLocation}>{provider.cidade}</p></div>
                        </div>
                        <span className={styles.serviceBadge}>{provider.categoria || 'Prestador'}</span>
                        <p className={styles.providerRating}>Avaliação: {Number(provider.avaliacao || 0).toFixed(1)}</p>
                      </div>
                      <button type="button" className={styles.viewProfileBtn} onClick={() => void handleOpenProvider(provider.id)}>Ver perfil</button>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : contractsLoading ? (
            <p className={styles.emptyState} role="status">Carregando contratações...</p>
          ) : contracts.length === 0 ? (
            <div className={styles.emptyState}>Você ainda não tem contratações.</div>
          ) : (
            <div className={styles.contractList}>
              {contracts.map((contract) => (
                <article key={contract.id} className={styles.contractItem}>
                  <div className={styles.contractHeading}>
                    <strong>Prestador: {contract.prestador_nome || 'Nome indisponível'}</strong>
                    <span className={styles.queueBadge}>Status: {STATUS_LABELS[contract.status]}</span>
                  </div>
                  <p>{contract.descricao}</p>
                  {contract.status === 'recusado' && (
                    <p className={styles.refusalNotice} role="status">
                      {contract.mensagem || 'O prestador recusou o seu pedido.'}
                    </p>
                  )}
                  <small>Data solicitada: {new Date(contract.data_solicitada).toLocaleString('pt-BR')}</small>
                  {(contract.status === 'pendente' || contract.status === 'aceito') && (
                    <div className={styles.contractActions}>
                      <button type="button" className={styles.secondaryAction} onClick={() => void handleCancelContract(contract)}>Cancelar solicitação</button>
                      {contract.status === 'aceito' && (
                        <button type="button" className={styles.viewProfileBtn} onClick={() => void handleConfirmCompletion(contract)}>Confirmar conclusão</button>
                      )}
                    </div>
                  )}
                  {contract.status === 'concluido' && !contract.avaliada && (
                    <div className={styles.reviewForm}>
                      <label className={styles.fieldLabel} htmlFor={`review-note-${contract.id}`}>Nota de 1 a 5</label>
                      <input id={`review-note-${contract.id}`} type="number" min="1" max="5" value={reviewNotes[contract.id] || 5} onChange={(event) => setReviewNotes((current) => ({ ...current, [contract.id]: Number(event.target.value) }))} className={styles.formInput} />
                      <label className={styles.fieldLabel} htmlFor={`review-comment-${contract.id}`}>Comentário</label>
                      <textarea id={`review-comment-${contract.id}`} value={reviewComments[contract.id] || ''} onChange={(event) => setReviewComments((current) => ({ ...current, [contract.id]: event.target.value }))} className={styles.formInput} rows={2} />
                      <button type="button" className={styles.viewProfileBtn} onClick={() => void handleReview(contract)}>Enviar avaliação</button>
                    </div>
                  )}
                  {contract.status === 'concluido' && contract.avaliada && <p className={styles.providerLocation}>Avaliação enviada.</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      );
    };

    export default DashboardClient;