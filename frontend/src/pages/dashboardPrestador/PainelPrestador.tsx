import React, { useState } from 'react';
import styles from './DashboardPrestador.module.css';

interface Solicitation {
  id: number;
  client: string;
  service: string;
  description: string;
  time: string;
  status: string;
}

const INITIAL_REQUESTS: Solicitation[] = [
  {
    id: 1,
    client: 'Maria Santos',
    service: 'Instalação de chuveiro',
    description: 'Instalação de chuveiro elétrico no banheiro.',
    time: '10:30',
    status: 'PENDENTE',
  },
  {
    id: 2,
    client: 'Pedro Oliveira',
    service: 'Troca de tomada',
    description: 'Troca de duas tomadas da sala.',
    time: '11:15',
    status: 'PENDENTE',
  },
  {
    id: 3,
    client: 'Ana Costa',
    service: 'Instalação de luminária',
    description: 'Instalação de luminária no quarto.',
    time: '12:00',
    status: 'PENDENTE',
  },
];

export const DashboardPrestador: React.FC = () => {
 const [requests, setRequests] = useState<Solicitation[]>(() => {
  const savedRequests = localStorage.getItem('fixja_requests');

 if (savedRequests) {
  const newRequests = JSON.parse(savedRequests).map(
    (request: Solicitation) => ({
      ...request,
      status: request.status || 'PENDENTE',
    })
  );

  return [...INITIAL_REQUESTS, ...newRequests];
}

  return INITIAL_REQUESTS;
});

  const [currentService, setCurrentService] =
    useState<Solicitation | null>(null);

  const [finishedServices, setFinishedServices] = useState<Solicitation[]>([]);

  const [status, setStatus] = useState('PENDENTE');

 const handleAttend = (requestId: number) => {
  const selectedRequest = requests.find(
    (request) => request.id === requestId
  );

  if (!selectedRequest) {
    return;
  }

  // Apenas seleciona o atendimento.
  // A solicitação continua na fila.
  setCurrentService(selectedRequest);
  setStatus(selectedRequest.status);
};

const updateRequestStatus = (requestId: number, newStatus: string) => {
  setRequests((currentRequests) =>
    currentRequests.map((request) =>
      request.id === requestId
        ? { ...request, status: newStatus }
        : request
    )
  );
};

  const handleStartService = () => {
  if (!currentService) {
    return;
  }

  setStatus('EM ANDAMENTO');

  updateRequestStatus(
    currentService.id,
    'EM ANDAMENTO'
  );
};

const handleUndoStatus = () => {
  if (!currentService) {
    return;
  }

  if (status === 'CONCLUÍDO') {
    setStatus('EM ANDAMENTO');

    updateRequestStatus(
      currentService.id,
      'EM ANDAMENTO'
    );

    setFinishedServices((currentStack) =>
      currentStack.filter(
        (service) => service.id !== currentService.id
      )
    );

    return;
  }

  if (status === 'EM ANDAMENTO') {
    setStatus('ACEITO');

    updateRequestStatus(
      currentService.id,
      'ACEITO'
    );

    return;
  }

  if (status === 'ACEITO') {
    setStatus('PENDENTE');

    updateRequestStatus(
      currentService.id,
      'PENDENTE'
    );
  }
};
  const handleFinishService = () => {
  if (!currentService) {
    return;
  }

  setStatus('CONCLUÍDO');

  // Remove da fila somente quando o serviço é finalizado
  setRequests((currentRequests) =>
    currentRequests.filter(
      (request) => request.id !== currentService.id
    )
  );

  // Adiciona na pilha de atendimentos concluídos
  setFinishedServices((currentStack) => {
    const alreadyFinished = currentStack.some(
      (service) => service.id === currentService.id
    );

    if (alreadyFinished) {
      return currentStack;
    }

    return [
      { ...currentService, status: 'CONCLUÍDO' },
      ...currentStack,
    ];
  });
};

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.greeting}>Olá, João! 👋</p>

          <h1 className={styles.title}>
            Painel do profissional
          </h1>

          <p className={styles.subtitle}>
            Gerencie suas solicitações de serviço.
          </p>
        </div>

        <div className={styles.providerProfile}>
          <div className={styles.avatar}>
            👷
          </div>

          <div>
            <strong>João Silva</strong>
            <span>Eletricista</span>
          </div>
        </div>
      </header>

      {/* RESUMO */}
      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>📋</span>

          <div>
            <strong>{requests.length}</strong>
            <span>Solicitações na fila</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>🔧</span>

          <div>
            <strong>
              {currentService ? 1 : 0}
            </strong>
            <span>Em atendimento</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statIcon}>⭐</span>

          <div>
            <strong>4,9</strong>
            <span>Avaliação</span>
          </div>
        </div>
      </section>

      <div className={styles.contentGrid}>
        {/* FILA */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Solicitações pendentes</h2>

              <p>
                Fila de atendimento
              </p>
            </div>

            <span className={styles.fifoBadge}>
              FILA
            </span>
          </div>

          {requests.length === 0 ? (
            <div className={styles.empty}>
              <span>✓</span>

              <p>
                Não há solicitações pendentes.
              </p>
            </div>
          ) : (
            <div className={styles.queue}>
              {requests.map((request, index) => (
                <div
                  key={request.id}
                  className={`${styles.requestCard} ${
                    index === 0 ? styles.nextRequest : ''
                  }`}
                >
                  <div className={styles.requestNumber}>
                    {index + 1}
                  </div>

                  <div className={styles.requestInfo}>
                    <strong>{request.client}</strong>

                    <span className={styles.serviceName}>
                      {request.service}
                    </span>

                    <p>{request.description}</p>

                    <small>
                      Solicitação às {request.time}
                    </small>
                    <span className={styles.requestStatus}>
                      Status: {request.status}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={styles.attendBtn}
                  onClick={() => handleAttend(request.id)}
                >
              Atender
          </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ATENDIMENTO ATUAL */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Atendimento atual</h2>

              <p>
                Controle de status
              </p>
            </div>

            <span className={styles.stackBadge}>
              PILHA
            </span>
          </div>

          {!currentService ? (
            <div className={styles.noService}>
              <span>🔧</span>

              <p>
                Nenhum atendimento em andamento.
              </p>

              <small>
                Atenda uma solicitação da fila.
              </small>
            </div>
          ) : (
            <div className={styles.currentService}>
              <div className={styles.currentClient}>
                <div className={styles.clientAvatar}>
                  {currentService.client.charAt(0)}
                </div>

                <div>
                  <strong>
                    {currentService.client}
                  </strong>

                  <span>
                    {currentService.service}
                  </span>
                </div>
              </div>

              <div className={styles.statusBox}>
                <span>Status atual</span>

                <strong>{status}</strong>
              </div>

              <div className={styles.statusHistory}>
                <div
                  className={
                    status === 'PENDENTE'
                      ? styles.activeStatus
                      : ''
                  }
                >
                  PENDENTE
                </div>

                <div
                  className={
                    status === 'ACEITO'
                      ? styles.activeStatus
                      : ''
                  }
                >
                  ACEITO
                </div>

                <div
                  className={
                    status === 'EM ANDAMENTO'
                      ? styles.activeStatus
                      : ''
                  }
                >
                  EM ANDAMENTO
                </div>

                <div
                  className={
                    status === 'CONCLUÍDO'
                      ? styles.activeStatus
                      : ''
                  }
                >
                  CONCLUÍDO
                </div>
              </div>

              <div className={styles.actions}>
                {status !== 'PENDENTE' && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={handleUndoStatus}
                  >
                    ↩ Desfazer avanço
                  </button>
                )}
                {status === 'PENDENTE' && (
  <button
    type="button"
    className={styles.primaryBtn}
    onClick={() => {
      setStatus('ACEITO');
      updateRequestStatus(currentService.id, 'ACEITO');
    }}
  >
    Aceitar serviço
  </button>
)}
                {status === 'ACEITO' && (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleStartService}
                  >
                    Iniciar serviço
                  </button>
                )}

                {status === 'EM ANDAMENTO' && (
                  <button
                    type="button"
                    className={styles.finishBtn}
                    onClick={handleFinishService}
                  >
                    Finalizar serviço
                  </button>
                )}

                {status === 'CONCLUÍDO' && (
                  <div className={styles.completed}>
                    ✓ Serviço concluído
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
                <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Atendimentos finalizados</h2>
              <p>Histórico em pilha</p>
            </div>

            <span className={styles.stackBadge}>
              PILHA
            </span>
          </div>

          {finishedServices.length === 0 ? (
            <div className={styles.noService}>
              <span>📚</span>

              <p>
                Nenhum atendimento finalizado.
              </p>

              <small>
                Os atendimentos concluídos aparecerão aqui.
              </small>
            </div>
          ) : (
            <div className={styles.queue}>
              {finishedServices.map((service, index) => (
                <div
                  key={service.id}
                  className={styles.requestCard}
                >
                  <div className={styles.requestNumber}>
                    {index + 1}
                  </div>

                  <div className={styles.requestInfo}>
                    <strong>{service.client}</strong>

                    <span className={styles.serviceName}>
                      {service.service}
                    </span>

                    <p>{service.description}</p>

                    <small>
                      Atendimento finalizado
                    </small>
                  </div>

                  {index === 0 && (
                    <span className={styles.fifoBadge}>
                      TOPO
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

    </div>
  );
};

export default DashboardPrestador;