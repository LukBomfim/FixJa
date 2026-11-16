import React, { useEffect, useState } from 'react';
import { ChevronRight, Code2, LogOut, Mail, MapPin, Moon, Phone, Sun } from 'lucide-react';
import styles from './Perfil.module.css';
import { api, errorMessage } from '../services/api';
import type { AccountType, Category, ProfileInput, Review, UserProfile } from '../services/api';
import type { RegistrationDraft } from './cadastro/cadastro';
import LocationPicker, { type LocationValue } from '../components/LocationPicker';
import Avatar from '../components/ui/Avatar';
import { RatingBadge, StarDisplay } from '../components/ui/StarRating';
import { EmptyState, SkeletonList } from '../components/ui/Feedback';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../utils/format';

type Theme = 'light' | 'dark';

interface ProfileProps {
	profile: UserProfile | null;
	initial?: RegistrationDraft;
	onSaved: (profile: UserProfile) => void;
	onLogout: () => void;
	theme?: Theme;
	onThemeChange?: (theme: Theme) => void;
	onOpenDeveloper?: () => void;
	developerAuthorized?: boolean;
}

const Profile: React.FC<ProfileProps> = ({
	profile,
	initial,
	onSaved,
	onLogout,
	theme,
	onThemeChange,
	onOpenDeveloper,
	developerAuthorized,
}) => {
	const toast = useToast();
	const [username, setUsername] = useState(profile?.username || initial?.username || '');
	const [phone, setPhone] = useState(profile?.telefone || '');
	const [birthDate, setBirthDate] = useState(profile?.data_nascimento?.slice(0, 10) || '1990-01-01');
	const [accountType, setAccountType] = useState<AccountType>(profile?.tipo || initial?.tipo || 'CLIENTE');
	const [category, setCategory] = useState(profile?.categoria || initial?.categoria || '');
	const [location, setLocation] = useState<LocationValue>({
		estado: profile?.estado || '',
		cidade: profile?.cidade || '',
		endereco: profile?.endereco || '',
		latitude: profile?.latitude?.toString() || '',
		longitude: profile?.longitude?.toString() || '',
	});
	const [locationConfirmed, setLocationConfirmed] = useState(false);
	const [description, setDescription] = useState(profile?.descricao || '');
	const [categories, setCategories] = useState<Category[]>([]);
	const [reviews, setReviews] = useState<Review[]>([]);
	const [reviewsLoading, setReviewsLoading] = useState(false);
	const [reviewsError, setReviewsError] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		api.categories().then(setCategories).catch((requestError: unknown) => setError(errorMessage(requestError)));
	}, []);

	useEffect(() => {
		if (!profile || profile.tipo !== 'PRESTADOR') return;
		let active = true;
		setReviewsLoading(true);
		setReviewsError('');
		api.reviews(profile.id)
			.then((result) => { if (active) setReviews(result); })
			.catch((requestError: unknown) => { if (active) setReviewsError(errorMessage(requestError)); })
			.finally(() => { if (active) setReviewsLoading(false); });
		return () => { active = false; };
	}, [profile?.id, profile?.tipo]);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!username.trim()) {
			setError('Informe seu nome.');
			return;
		}
		if (accountType === 'PRESTADOR' && !locationConfirmed) {
			setError('Confirme a localização selecionada antes de salvar o perfil.');
			return;
		}
		setLoading(true);
		setError('');
		const values: ProfileInput = {
			username: username.trim(),
			telefone: phone.trim(),
			data_nascimento: birthDate,
			categoria: accountType === 'PRESTADOR' ? category || null : null,
			cidade: location.cidade.trim(),
			estado: location.estado || null,
			endereco: accountType === 'PRESTADOR' ? location.endereco.trim() : null,
			latitude: accountType === 'PRESTADOR' ? Number(location.latitude) : null,
			longitude: accountType === 'PRESTADOR' ? Number(location.longitude) : null,
			descricao: description.trim() || null,
		};
		try {
			const saved = profile
				? await api.updateProfile(values)
				: await api.createProfile({ ...values, tipo: accountType });
			if (profile) toast.show('Perfil atualizado.', 'success');
			onSaved(saved);
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setLoading(false);
		}
	};

	const form = (
		<form className={`fx-card ${styles.formCard}`} onSubmit={handleSubmit}>
			<div className={styles.formHead}>
				<h2 className={styles.sectionTitle}>{profile ? 'Dados pessoais' : 'Seus dados'}</h2>
				{!profile && <p className="fx-muted">Complete as informações para começar a usar o FixJá.</p>}
			</div>
			<div className={styles.grid}>
				<div className={`fx-field ${styles.full}`}>
					<label className="fx-label" htmlFor="profile-name">Nome</label>
					<input id="profile-name" className="fx-input" autoComplete="name" value={username} onChange={(event) => setUsername(event.target.value)} required />
				</div>
				<div className="fx-field">
					<label className="fx-label" htmlFor="profile-phone">Telefone</label>
					<input id="profile-phone" className="fx-input" type="tel" autoComplete="tel" placeholder="(82) 90000-0000" value={phone} onChange={(event) => setPhone(event.target.value)} />
				</div>
				<div className="fx-field">
					<label className="fx-label" htmlFor="profile-birth-date">Data de nascimento</label>
					<input id="profile-birth-date" className="fx-input" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
				</div>
				{!profile && (
					<div className="fx-field">
						<label className="fx-label" htmlFor="profile-type">Tipo de conta</label>
						<select id="profile-type" className="fx-input" value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)}>
							<option value="CLIENTE">Cliente</option>
							<option value="PRESTADOR">Prestador</option>
						</select>
					</div>
				)}
				{accountType === 'PRESTADOR' && (
					<div className="fx-field">
						<label className="fx-label" htmlFor="profile-category">Categoria</label>
						<select id="profile-category" className="fx-input" value={category} onChange={(event) => setCategory(event.target.value)}>
							<option value="">Selecione uma categoria</option>
							{categories.map((item) => <option key={item.id} value={item.categoria_name}>{item.categoria_name}</option>)}
						</select>
					</div>
				)}
				<div className={styles.full}>
					<LocationPicker
						value={location}
						onChange={setLocation}
						onConfirmedChange={setLocationConfirmed}
						showAddress={accountType === 'PRESTADOR'}
					/>
				</div>
				<div className={`fx-field ${styles.full}`}>
					<label className="fx-label" htmlFor="profile-description">{accountType === 'PRESTADOR' ? 'Sobre seus serviços' : 'Descrição'}</label>
					<textarea
						id="profile-description"
						className="fx-input"
						value={description}
						onChange={(event) => setDescription(event.target.value)}
						rows={3}
						placeholder={accountType === 'PRESTADOR' ? 'Conte sua experiência, especialidades e horários.' : 'Opcional'}
					/>
				</div>
			</div>
			{error && <p className="fx-alert fx-alert--error" role="alert">{error}</p>}
			<button type="submit" disabled={loading} className="fx-btn fx-btn--primary fx-btn--lg fx-btn--block">
				{loading ? 'Salvando...' : profile ? 'Salvar alterações' : 'Concluir perfil'}
			</button>
		</form>
	);

	if (!profile) {
		return (
			<div className={styles.onboarding}>
				<header className={styles.onboardingHead}>
					<p className="fx-eyebrow">Quase lá</p>
					<h1 className={styles.onboardingTitle}>Conclua seu perfil</h1>
				</header>
				{form}
				<button type="button" className={`fx-btn fx-btn--ghost ${styles.logout}`} onClick={onLogout}>
					<LogOut size={17} aria-hidden="true" /> Sair da conta
				</button>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<section className={`fx-card ${styles.identity}`}>
				<Avatar name={profile.username} size="xl" />
				<div className={styles.identityText}>
					<h1 className={styles.name}>{profile.username}</h1>
					<span className={styles.role}>{profile.tipo === 'PRESTADOR' ? profile.categoria || 'Prestador' : 'Cliente'}</span>
					<ul className={styles.facts}>
						<li><Mail size={15} aria-hidden="true" /> {profile.email}</li>
						{profile.telefone && <li><Phone size={15} aria-hidden="true" /> {profile.telefone}</li>}
						{profile.cidade && <li><MapPin size={15} aria-hidden="true" /> {profile.cidade}{profile.estado ? ` - ${profile.estado}` : ''}</li>}
					</ul>
				</div>
				{profile.tipo === 'PRESTADOR' && (
					<div className={styles.ratingBox}>
						<RatingBadge value={profile.avaliacao} />
						<small>{reviews.length} avaliação(ões)</small>
					</div>
				)}
			</section>

			<div className={styles.columns}>
				<div className={styles.mainCol}>{form}</div>

				<aside className={styles.sideCol}>
					<section className={`fx-card ${styles.menu}`} aria-labelledby="prefs-title">
						<h2 id="prefs-title" className={styles.sectionTitle}>Preferências</h2>
						{theme && onThemeChange && (
							<div className={styles.menuRow}>
								<span className={styles.menuLabel}>{theme === 'dark' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />} Tema</span>
								<div className={styles.themeSwitch} role="radiogroup" aria-label="Tema">
									<button type="button" role="radio" aria-checked={theme === 'light'} className={theme === 'light' ? styles.themeActive : ''} onClick={() => onThemeChange('light')}>
										<Sun size={15} aria-hidden="true" /> Claro
									</button>
									<button type="button" role="radio" aria-checked={theme === 'dark'} className={theme === 'dark' ? styles.themeActive : ''} onClick={() => onThemeChange('dark')}>
										<Moon size={15} aria-hidden="true" /> Escuro
									</button>
								</div>
							</div>
						)}
						{onOpenDeveloper && (
							<button type="button" className={styles.menuLink} onClick={onOpenDeveloper}>
								<span className={styles.menuLabel}><Code2 size={18} aria-hidden="true" /> Modo Desenvolvedor</span>
								<span className={styles.menuMeta}>
									{developerAuthorized ? 'Liberado' : 'Restrito'}
									<ChevronRight size={17} aria-hidden="true" />
								</span>
							</button>
						)}
						<button type="button" className={`${styles.menuLink} ${styles.danger}`} onClick={onLogout}>
							<span className={styles.menuLabel}><LogOut size={18} aria-hidden="true" /> Sair da conta</span>
						</button>
					</section>

					{profile.tipo === 'PRESTADOR' && (
						<section className={`fx-card ${styles.menu}`} aria-labelledby="profile-reviews-title">
							<h2 id="profile-reviews-title" className={styles.sectionTitle}>Últimas avaliações</h2>
							{reviewsLoading ? <SkeletonList count={2} label="Carregando avaliações" /> : reviewsError ? (
								<p className="fx-alert fx-alert--error" role="alert">{reviewsError}</p>
							) : reviews.length === 0 ? (
								<EmptyState compact title="Sem avaliações ainda" description="As notas dos clientes aparecem aqui após cada serviço concluído." />
							) : (
								<div className={styles.reviews}>
									{reviews.map((review) => (
										<article key={review.id} className={styles.review}>
											<div className={styles.reviewMeta}>
												<StarDisplay value={review.nota} />
												<time dateTime={review.data}>{formatDate(review.data)}</time>
											</div>
											<p>{review.comentario || 'Sem comentário.'}</p>
										</article>
									))}
								</div>
							)}
						</section>
					)}
				</aside>
			</div>
		</div>
	);
};

export default Profile;
