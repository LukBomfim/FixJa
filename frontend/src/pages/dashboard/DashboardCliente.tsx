import React, { useState } from 'react';
import styles from './DashboardCliente.module.css';
import { Provider } from '../../types';

// Dados mockados para exibição inicial
const MOCK_PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'Carlos Oliveira',
    email: 'carlos.eletrica@gmail.com',
    service: 'Eletricista',
    phone: '(11) 98765-4321',
    bio: 'Especialista em instalações residenciais e comerciais com mais de 8 anos de experiência.',
    rating: 4.9,
    avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Fernanda Lima',
    email: 'fernanda.encanadora@gmail.com',
    service: 'Encanador',
    phone: '(11) 91234-5678',
    bio: 'Resolução de vazamentos, desentupimentos e instalação de metais sanitários em geral.',
    rating: 4.8,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Roberto Souza',
    email: 'roberto.pinturas@gmail.com',
    service: 'Pintor',
    phone: '(11) 97777-8888',
    bio: 'Pintura residencial, comercial, textura e aplicação de efeitos decorativos.',
    rating: 4.7,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop',
  },
    {
    id: '4',
    name: 'João Silva',
    email: 'joao.eletricista@gmail.com',
    service: 'Eletricista',
    phone: '(82) 99999-9999',
    bio: 'Eletricista especializado em instalações residenciais, manutenção elétrica e troca de tomadas e luminárias.',
    rating: 4.9,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
  },
];

export const DashboardClient: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [serviceRequested, setServiceRequested] = useState(false);

  // filtro pelo serviço ou prestador
  const filteredProviders = MOCK_PROVIDERS.filter((p) =>
    p.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

    const handleRequestService = () => {
  if (!selectedProvider) {
    return;
  }

  const newRequest = {
    id: Date.now(),
    client: 'Cliente atual',
    service: selectedProvider.service,
    description: `Solicitação de ${selectedProvider.service.toLowerCase()}.`,
    time: new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  const existingRequests = JSON.parse(
    localStorage.getItem('fixja_requests') || '[]'
  );

  localStorage.setItem(
    'fixja_requests',
    JSON.stringify([...existingRequests, newRequest])
  );

  setServiceRequested(true);

  console.log('Solicitação adicionada à fila:', newRequest);
};

  // exibir o perfil
  if (selectedProvider) {
    return (
      <div className={styles.container}>
        <div className={styles.profileView}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setSelectedProvider(null)}
          >
            ← Voltar para a lista
          </button>

          <div className={styles.profileHeader}>
            <img
              src={selectedProvider.avatarUrl || 'https://via.placeholder.com/80'}
              alt={selectedProvider.name}
              className={styles.profileAvatar}
            />
            <div>
              <h2 className={styles.title}>{selectedProvider.name}</h2>
              <span className={styles.serviceBadge}>{selectedProvider.service}</span>
            </div>
          </div>

          <p className={styles.subtitle}>{selectedProvider.bio}</p>

          <div className={styles.contactBox}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#0f172a' }}>
              Informações de Contato
            </h3>
            <div className={styles.contactItem}>
              <strong>Telefone / WhatsApp:</strong> {selectedProvider.phone}
            </div>
            <div className={styles.contactItem}>
              <strong>E-mail:</strong> {selectedProvider.email}
            </div>
          </div>

            <div className={styles.requestBox}>
            {!serviceRequested ? (
              <>
                <h3 className={styles.requestTitle}>
                  Precisa desse serviço?
                </h3>

                <p className={styles.requestText}>
                  Solicite um atendimento com {selectedProvider.name}.
                </p>

                <button
                  type="button"
                  className={styles.requestBtn}
                  onClick={handleRequestService}
                >
                  Solicitar serviço
                </button>
              </>
            ) : (
              <div className={styles.successMessage}>
                <div className={styles.successIcon}>✓</div>

                <h3>Solicitação enviada!</h3>

                <p>
                  Seu pedido foi colocado na fila de atendimento de{' '}
                  <strong>{selectedProvider.name}</strong>.
                </p>

                <span className={styles.queueBadge}>
                  Status: PENDENTE
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Encontre o profissional ideal</h1>
        <p className={styles.subtitle}>
          Busque por serviços ou navegando pelos profissionais disponíveis no FixJá.
        </p>
      </header>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Pesquise por serviço (ex: Eletricista, Encanador, Pintor)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {filteredProviders.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhum prestador encontrado para o serviço "{searchTerm}".
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProviders.map((provider) => (
            <div key={provider.id} className={styles.card}>
              <div>
                <div className={styles.cardHeader}>
                  <img
                    src={provider.avatarUrl || 'https://via.placeholder.com/52'}
                    alt={provider.name}
                    className={styles.avatar}
                  />
                  <div>
                    <h3 className={styles.providerName}>{provider.name}</h3>
                  </div>
                </div>
                <span className={styles.serviceBadge}>{provider.service}</span>
              </div>

              <button
                type="button"
                className={styles.viewProfileBtn}
                onClick={() => setSelectedProvider(provider)}
              >
                Ver Perfil e Contato
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardClient;