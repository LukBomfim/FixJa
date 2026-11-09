import React, { useEffect, useMemo, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { ChartNoAxesCombined, Database, Hash, Waypoints } from 'lucide-react';
import { api, errorMessage } from '../services/api';
import type { BenchmarkResult, Contract, DeveloperInfo, GeographicGraphResult } from '../services/api';
import { LinkedList, Stack } from '../dataStructures';
import styles from './DeveloperMode.module.css';

type DevTab = 'hash' | 'grafo' | 'benchmark' | 'estruturas';

const CONTRACT_STATUS_LABELS: Record<Contract['status'], string> = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  recusado: 'Recusado',
};

export const DeveloperMode: React.FC = () => {
  const [tab, setTab] = useState<DevTab>('hash');
  const [info, setInfo] = useState<DeveloperInfo | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [graph, setGraph] = useState<GeographicGraphResult | null>(null);
  const [contracts, setContracts] = useState<Awaited<ReturnType<typeof api.contracts>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.developerInfo(), api.developerBenchmark(), api.developerGraph(), api.contracts()])
      .then(([developerInfo, benchmarkResult, graphResult, contractResult]) => {
        if (!active) return;
        setInfo(developerInfo);
        setBenchmark(benchmarkResult);
        setGraph(graphResult);
        setContracts(contractResult);
      })
      .catch((requestError: unknown) => { if (active) setError(errorMessage(requestError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const linkedContracts = useMemo(() => {
    const list = new LinkedList<Contract>();
    contracts.forEach((contract) => list.append(contract));
    return [...list];
  }, [contracts]);
  const recentStatusStack = useMemo(() => {
    const stack = new Stack(
      [...linkedContracts]
        .sort((left, right) => left.created_at.localeCompare(right.created_at))
        .map((contract) => contract),
    );
    return stack.toArrayNewestFirst().slice(0, 10);
  }, [linkedContracts]);

  const tabs: Array<{ id: DevTab; label: string; icon: React.ReactNode }> = [
    { id: 'hash', label: 'Hash', icon: <Hash size={16} aria-hidden="true" /> },
    { id: 'grafo', label: 'Grafos', icon: <Waypoints size={16} aria-hidden="true" /> },
    { id: 'benchmark', label: 'Ordenação', icon: <ChartNoAxesCombined size={16} aria-hidden="true" /> },
    { id: 'estruturas', label: 'Estruturas', icon: <Database size={16} aria-hidden="true" /> },
  ];

  const handleTabChange = (value: string) => {
    const selected = tabs.find((item) => item.id === value);
    if (selected) setTab(selected.id);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><p>Área restrita</p><h1>Modo Desenvolvedor</h1><span>Veja como o FixJá organiza e analisa os dados.</span></div>
        <span className={styles.accessBadge}>Acesso liberado</span>
      </header>
      <Tabs.Root value={tab} onValueChange={handleTabChange}>
        <Tabs.List className={styles.tabs} aria-label="Seções do Modo Desenvolvedor">
          {tabs.map((item) => <Tabs.Trigger type="button" key={item.id} value={item.id}>{item.icon}{item.label}</Tabs.Trigger>)}
        </Tabs.List>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading ? <p className={styles.empty} role="status">Carregando dados e análises...</p> : null}
      <Tabs.Content value="hash">
      {!loading && info && (
        <section className={styles.panel}>
          <h2>Proteção de senha</h2>
          <p><strong>Serviço:</strong> {info.hash.algoritmo}</p>
          <p>O Supabase Auth cuida do cadastro e da verificação. O FixJá não guarda nem exibe senhas.</p>
        </section>
      )}
      </Tabs.Content>
      <Tabs.Content value="grafo">
      {!loading && graph && (
        <section className={styles.panel}>
          <h2>Grafo geográfico do sistema</h2>
          <p>{graph.vertices.length} vértice(s) e {graph.arestas.length} aresta(s) com pesos reais em quilômetros.</p>
          {graph.grafico_png_base64
            ? <img className={styles.chart} src={`data:image/png;base64,${graph.grafico_png_base64}`} alt="Grafo geográfico Matplotlib com prestadores reais e pesos das arestas" />
            : <p className={styles.empty}>Não há localizações cadastradas para visualizar.</p>}
          {graph.arestas.length > 0 && (
            <div className={styles.edgeList}>
              {graph.arestas.map((edge) => {
                const source = graph.vertices.find((vertex) => vertex.id === edge.origem)?.nome || edge.origem;
                const destination = graph.vertices.find((vertex) => vertex.id === edge.destino)?.nome || edge.destino;
                return <div key={`${edge.origem}-${edge.destino}`}>{source} — {destination}: {edge.distancia_km.toLocaleString('pt-BR')} km</div>;
              })}
            </div>
          )}
        </section>
      )}
      </Tabs.Content>
      <Tabs.Content value="benchmark">
      {!loading && benchmark && (
        <section className={styles.panel}>
          <h2>Benchmark de ordenação</h2>
          <p>{benchmark.registros_disponiveis} prestador(es) reais · {benchmark.criterio}.</p>
          {benchmark.grafico_png_base64 && <img className={styles.chart} src={`data:image/png;base64,${benchmark.grafico_png_base64}`} alt="Comparação de tempo dos algoritmos, gerada com Matplotlib" />}
          {benchmark.cenarios.length === 0 ? <p className={styles.empty}>Não há dados de prestadores para medir.</p> : benchmark.cenarios.map((scenario) => (
            <div key={scenario.quantidade} className={styles.scenario}>
              <h3>{scenario.quantidade} registros — mais rápido: {scenario.mais_rapido}</h3>
              <div className={styles.tableWrap}>
                <table><thead><tr><th>Algoritmo</th><th>Tempo (ms)</th><th>Comparações</th><th>Trocas</th><th>Movimentações</th></tr></thead>
                  <tbody>{scenario.resultados.map((result) => <tr key={result.algoritmo}><td>{result.algoritmo}</td><td>{result.tempo_ms}</td><td>{result.comparacoes}</td><td>{result.trocas}</td><td>{result.movimentacoes}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}
      </Tabs.Content>
      <Tabs.Content value="estruturas">
      {!loading && info && (
        <section className={styles.panel}>
          <h2>Estruturas de dados</h2>
          <p>Contratações carregadas do sistema: {linkedContracts.length}.</p>
          <ul className={styles.contractList}>
            {linkedContracts.slice(0, 10).map((contract) => <li key={contract.id}>{CONTRACT_STATUS_LABELS[contract.status]}: {contract.descricao}</li>)}
          </ul>
          <h3>Contratações recentes</h3>
          {recentStatusStack.length ? (
            <ol className={styles.stackList}>{recentStatusStack.map((contract) => (
              <li key={contract.id}>
                <strong>{contract.descricao}</strong>
                <span>{CONTRACT_STATUS_LABELS[contract.status]} · {new Date(contract.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </li>
            ))}</ol>
          ) : <p className={styles.empty}>Não há contratações para visualizar.</p>}
        </section>
      )}
      </Tabs.Content>
      </Tabs.Root>
    </main>
  );
};

export default DeveloperMode;
