export type AccountType = 'CLIENTE' | 'PRESTADOR';
export type ContractStatus = 'pendente' | 'aceito' | 'concluido' | 'cancelado' | 'recusado';

export interface UserProfile {
	id: string;
	username: string;
	email: string;
	telefone: string;
	data_nascimento: string;
	tipo: AccountType;
	categoria: string | null;
	cidade: string;
	estado: string | null;
	endereco: string | null;
	latitude: number | null;
	longitude: number | null;
	descricao: string | null;
	avaliacao: number;
}

export type Provider = Omit<UserProfile, 'data_nascimento' | 'endereco' | 'latitude' | 'longitude'>;

export interface Category {
	id: string;
	categoria_name: string;
}

export interface Contract {
	id: string;
	client_id: string;
	prestador_id: string;
	created_at: string;
	data: string;
	data_solicitada: string;
	descricao: string;
	status: ContractStatus;
	cliente_nome?: string | null;
	cliente_email?: string | null;
	cliente_telefone?: string | null;
	prestador_nome?: string | null;
	prestador_email?: string | null;
	prestador_telefone?: string | null;
	avaliada?: boolean;
	mensagem?: string;
}

export interface Review {
	id: number;
	contratacao_id: string;
	prestador_id: string;
	nota: number;
	comentario: string | null;
	data: string;
}

export interface ProfileInput {
	username: string;
	telefone: string;
	data_nascimento: string;
	tipo?: AccountType;
	categoria: string | null;
	cidade: string;
	estado: string | null;
	endereco: string | null;
	latitude: number | null;
	longitude: number | null;
	descricao: string | null;
}

export interface NearbyRecommendation {
	prestador: Pick<Provider, 'id' | 'username' | 'categoria' | 'cidade' | 'estado' | 'avaliacao'> & {
		latitude: number;
		longitude: number;
	};
	distancia_km: number;
}

export interface NearbyResult {
	prestadores: NearbyRecommendation[];
	quantidade_vertices: number;
	quantidade_arestas: number;
}

export interface BenchmarkResult {
	criterio: string;
	registros_disponiveis: number;
	cenarios: Array<{
		quantidade: number;
		mais_rapido: string;
		resultados: Array<{
			algoritmo: string;
			tempo_ms: number;
			comparacoes: number;
			trocas: number;
			movimentacoes: number;
		}>;
	}>;
	grafico_png_base64: string;
}

export interface ConversationParticipant {
	id: string;
	username: string;
	tipo: AccountType;
}

export interface ChatMessage {
	id: number;
	conversation_id: string;
	sender_id: string;
	body: string;
	sent_at: string;
	read_at: string | null;
}

export interface Conversation {
	id: string;
	participante: ConversationParticipant;
	ultima_mensagem: ChatMessage | null;
	nao_lidas: number;
}

export interface DeveloperInfo {
	hash: { algoritmo: string; fluxo: string; armazenamento: string };
	algoritmos: string[];
	estruturas: string[];
}

export interface GeographicGraphResult {
	vertices: Array<{ id: string; nome: string; latitude: number; longitude: number }>;
	arestas: Array<{ origem: string; destino: string; distancia_km: number }>;
	grafico_png_base64: string;
}

export interface RegistrationResult {
	usuario: Pick<UserProfile, 'id' | 'username' | 'email'>;
	token: string | null;
	refresh_token: string | null;
}

export interface LoginResult {
	usuario: UserProfile | null;
	token: string;
	refresh_token: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
const TOKEN_KEY = 'fixja_access_token';
const REFRESH_TOKEN_KEY = 'fixja_refresh_token';
export const UNAUTHORIZED_EVENT = 'fixja:unauthorized';
let refreshInFlight: Promise<{ token: string; refresh_token: string }> | null = null;

export class ApiError extends Error {
	constructor(message: string, public readonly status: number) {
		super(message);
		this.name = 'ApiError';
	}
}

function normalizeContractStatus(value: string): ContractStatus {
	const normalized = value.toLowerCase();
	if (['pendente', 'aceito', 'concluido', 'cancelado', 'recusado'].includes(normalized)) {
		return normalized as ContractStatus;
	}
	throw new ApiError('A API retornou um status de contratação desconhecido.', 500);
}

export const session = {
	getToken(): string | null {
		return window.sessionStorage.getItem(TOKEN_KEY);
	},
	setCredentials(token: string, refreshToken: string): void {
		window.sessionStorage.setItem(TOKEN_KEY, token);
		window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
	},
	getRefreshToken(): string | null {
		return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
	},
	clear(): void {
		window.sessionStorage.removeItem(TOKEN_KEY);
		window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
	},
};

async function requestOnce<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = session.getToken();
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
	});

	let body: unknown = null;
	try {
		body = await response.json();
	} catch {
		body = null;
	}

	if (!response.ok) {
		const message =
			typeof body === 'object' && body !== null && 'erro' in body && typeof body.erro === 'string'
				? body.erro
				: response.status >= 500
					? 'O servidor está indisponível no momento.'
					: 'Não foi possível concluir a operação.';
		throw new ApiError(message, response.status);
	}

	return body as T;
}

async function renewSession(): Promise<{ token: string; refresh_token: string }> {
	if (refreshInFlight) return refreshInFlight;
	const refreshToken = session.getRefreshToken();
	if (!refreshToken) throw new ApiError('Sua sessão expirou. Entre novamente.', 401);

	const pending = (async () => {
		const response = await fetch(`${API_BASE_URL}/session/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh_token: refreshToken }),
		});
		let body: unknown = null;
		try {
			body = await response.json();
		} catch {
			body = null;
		}
		if (!response.ok) {
			const message =
				typeof body === 'object' && body !== null && 'erro' in body && typeof body.erro === 'string'
					? body.erro
					: 'Não foi possível atualizar sua sessão.';
			throw new ApiError(message, response.status);
		}
		if (
			typeof body !== 'object' || body === null ||
			!('token' in body) || typeof body.token !== 'string' ||
			!('refresh_token' in body) || typeof body.refresh_token !== 'string'
		) {
			throw new ApiError('A API retornou uma sessão inválida.', 500);
		}
		return { token: body.token, refresh_token: body.refresh_token };
	})();
	refreshInFlight = pending;
	try {
		return await pending;
	} finally {
		if (refreshInFlight === pending) refreshInFlight = null;
	}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = session.getToken();
	try {
		return await requestOnce<T>(path, options);
	} catch (error) {
		if (!(error instanceof ApiError) || error.status !== 401 || !token) throw error;
		try {
			const credentials = await renewSession();
			session.setCredentials(credentials.token, credentials.refresh_token);
			return await requestOnce<T>(path, options);
		} catch (refreshError) {
			if (refreshError instanceof ApiError && refreshError.status === 401) {
				session.clear();
				window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
			}
			throw refreshError;
		}
	}
}

function jsonBody(body: unknown): RequestInit {
	return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const api = {
	login(email: string, senha: string): Promise<LoginResult> {
		return request('/login', { method: 'POST', ...jsonBody({ email, senha }) });
	},
	register(email: string, senha: string, username: string): Promise<RegistrationResult> {
		return request('/register', { method: 'POST', ...jsonBody({ email, senha, username }) });
	},
	profile(): Promise<UserProfile> {
		return request('/perfil');
	},
	createProfile(profile: ProfileInput & { tipo: AccountType }): Promise<UserProfile> {
		return request('/register/profile', { method: 'POST', ...jsonBody(profile) });
	},
	updateProfile(profile: ProfileInput): Promise<UserProfile> {
		return request('/perfil', { method: 'PUT', ...jsonBody(profile) });
	},
	categories(): Promise<Category[]> {
		return request('/categorias');
	},
	providers(filters: { categoria?: string; cidade?: string } = {}): Promise<Provider[]> {
		const query = new URLSearchParams();
		if (filters.categoria) query.set('categoria', filters.categoria);
		if (filters.cidade) query.set('cidade', filters.cidade);
		const suffix = query.size ? `?${query.toString()}` : '';
		return request(`/prestadores${suffix}`);
	},
	nearbyProviders(location: { latitude: number; longitude: number; cidade?: string; estado?: string }): Promise<NearbyResult> {
		return request('/prestadores/proximos', { method: 'POST', ...jsonBody(location) });
	},
	conversations(): Promise<Conversation[]> {
		return request('/conversas');
	},
	startConversation(providerId: string): Promise<{ id: string }> {
		return request('/conversas', { method: 'POST', ...jsonBody({ prestador_id: providerId }) });
	},
	messages(conversationId: string): Promise<ChatMessage[]> {
		return request(`/conversas/${encodeURIComponent(conversationId)}/mensagens`);
	},
	sendMessage(conversationId: string, body: string): Promise<ChatMessage> {
		return request(`/conversas/${encodeURIComponent(conversationId)}/mensagens`, {
			method: 'POST',
			...jsonBody({ body }),
		});
	},
	developerInfo(): Promise<DeveloperInfo> {
		return request('/dev/info');
	},
	developerAccess(): Promise<{ authorized: boolean }> {
		return request('/dev/access');
	},
	developerBenchmark(): Promise<BenchmarkResult> {
		return request('/dev/benchmark');
	},
	developerGraph(): Promise<GeographicGraphResult> {
		return request('/dev/grafo');
	},
	provider(id: string): Promise<Provider> {
		return request(`/prestadores/${encodeURIComponent(id)}`);
	},
	async contracts(): Promise<Contract[]> {
		const contracts = await request<Contract[]>('/contratacoes');
		return contracts.map((contract) => ({
			...contract,
			status: normalizeContractStatus(contract.status),
		}));
	},
	createContract(data: Pick<Contract, 'prestador_id' | 'descricao' | 'data_solicitada'>): Promise<Contract> {
		return request('/contratacoes', { method: 'POST', ...jsonBody(data) });
	},
	async updateContract(id: string, status: ContractStatus): Promise<Contract> {
		const contract = await request<Contract>(`/contratacoes/${id}`, { method: 'PUT', ...jsonBody({ status }) });
		return { ...contract, status: normalizeContractStatus(contract.status) };
	},
	createReview(id: string, nota: number, comentario: string): Promise<Review> {
		return request(`/contratacoes/${id}/avaliacoes`, {
			method: 'POST',
			...jsonBody({ nota, comentario }),
		});
	},
	reviews(providerId: string): Promise<Review[]> {
		return request(`/prestadores/${encodeURIComponent(providerId)}/avaliacoes`);
	},
};

export function errorMessage(error: unknown): string {
	if (error instanceof ApiError) return error.message;
	if (error instanceof TypeError) return 'Não foi possível conectar à API. Verifique se o backend está disponível.';
	return 'Ocorreu um erro inesperado. Tente novamente.';
}
