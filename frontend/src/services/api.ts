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
	descricao: string | null;
	avaliacao: number;
}

export type Provider = Omit<UserProfile, 'data_nascimento'>;

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
	descricao: string | null;
}

export interface RegistrationResult {
	usuario: Pick<UserProfile, 'id' | 'username' | 'email'>;
	token: string | null;
}

export interface LoginResult {
	usuario: UserProfile | null;
	token: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
const TOKEN_KEY = 'fixja_access_token';
export const UNAUTHORIZED_EVENT = 'fixja:unauthorized';

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
	setToken(token: string): void {
		window.sessionStorage.setItem(TOKEN_KEY, token);
	},
	clear(): void {
		window.sessionStorage.removeItem(TOKEN_KEY);
	},
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
		if (response.status === 401 && token) {
			session.clear();
			window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
		}
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
