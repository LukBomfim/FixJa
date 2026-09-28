import React, { useEffect, useState } from 'react';
import styles from './login/Login.module.css';
import { api, errorMessage } from '../services/api';
import type { AccountType, Category, ProfileInput, Review, UserProfile } from '../services/api';
import type { RegistrationDraft } from './cadastro/cadastro';

interface ProfileProps {
	profile: UserProfile | null;
	initial?: RegistrationDraft;
	onSaved: (profile: UserProfile) => void;
	onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, initial, onSaved, onLogout }) => {
	const [username, setUsername] = useState(profile?.username || initial?.username || '');
	const [phone, setPhone] = useState(profile?.telefone || '');
	const [birthDate, setBirthDate] = useState(profile?.data_nascimento?.slice(0, 10) || '1990-01-01');
	const [accountType, setAccountType] = useState<AccountType>(profile?.tipo || initial?.tipo || 'CLIENTE');
	const [category, setCategory] = useState(profile?.categoria || initial?.categoria || '');
	const [city, setCity] = useState(profile?.cidade || '');
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
		setLoading(true);
		setError('');
		const values: ProfileInput = {
			username: username.trim(),
			telefone: phone.trim(),
			data_nascimento: birthDate,
			categoria: accountType === 'PRESTADOR' ? category || null : null,
			cidade: city.trim(),
			descricao: description.trim() || null,
		};
		try {
			const saved = profile
				? await api.updateProfile(values)
				: await api.createProfile({ ...values, tipo: accountType });
			onSaved(saved);
		} catch (requestError) {
			setError(errorMessage(requestError));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={styles.formSection}>
			<section className={styles.formContainer}>
				<div className={styles.brandHeader}><span className={styles.logoBadge}>FixJá</span></div>
				<div className={styles.welcomeText}>
					<h1 className={styles.title}>{profile ? 'Meu perfil' : 'Conclua seu perfil'}</h1>
					<p className={styles.subtitle}>{profile ? 'Mantenha seus dados atualizados.' : 'Complete seus dados para continuar.'}</p>
				</div>
				<form className={styles.form} onSubmit={handleSubmit}>
					<div className={styles.inputField}>
						<label className={styles.label} htmlFor="profile-name">Nome</label>
						<input id="profile-name" className={styles.input} value={username} onChange={(event) => setUsername(event.target.value)} required />
					</div>
					<div className={styles.inputField}>
						<label className={styles.label} htmlFor="profile-phone">Telefone</label>
						<input id="profile-phone" className={styles.input} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
					</div>
					<div className={styles.inputField}>
						<label className={styles.label} htmlFor="profile-birth-date">Data de nascimento</label>
						<input id="profile-birth-date" className={styles.input} type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
					</div>
					{!profile && (
						<div className={styles.inputField}>
							<label className={styles.label} htmlFor="profile-type">Tipo de conta</label>
							<select id="profile-type" className={styles.input} value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)}>
								<option value="CLIENTE">Cliente</option>
								<option value="PRESTADOR">Prestador</option>
							</select>
						</div>
					)}
					{accountType === 'PRESTADOR' && (
						<div className={styles.inputField}>
							<label className={styles.label} htmlFor="profile-category">Categoria</label>
							<select id="profile-category" className={styles.input} value={category} onChange={(event) => setCategory(event.target.value)}>
								<option value="">Selecione uma categoria</option>
								{categories.map((item) => <option key={item.id} value={item.categoria_name}>{item.categoria_name}</option>)}
							</select>
						</div>
					)}
					<div className={styles.inputField}>
						<label className={styles.label} htmlFor="profile-city">Cidade</label>
						<input id="profile-city" className={styles.input} value={city} onChange={(event) => setCity(event.target.value)} />
					</div>
					<div className={styles.inputField}>
						<label className={styles.label} htmlFor="profile-description">Descrição</label>
						<textarea id="profile-description" className={styles.input} value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
					</div>
					{error && <p className={styles.errorMessage} role="alert">{error}</p>}
					<button type="submit" disabled={loading} className={styles.submitBtn}>{loading ? 'Salvando...' : 'Salvar perfil'}</button>
				</form>
				{profile?.tipo === 'PRESTADOR' && (
					<section className={styles.reviewHistory} aria-labelledby="profile-reviews-title">
						<h2 id="profile-reviews-title" className={styles.reviewHistoryTitle}>Últimas avaliações</h2>
						{reviewsLoading ? <p className={styles.subtitle} role="status">Carregando avaliações...</p> : reviewsError ? (
							<p className={styles.errorMessage} role="alert">{reviewsError}</p>
						) : reviews.length === 0 ? (
							<p className={styles.subtitle}>Este perfil ainda não recebeu avaliações.</p>
						) : reviews.map((review) => (
							<article key={review.id} className={styles.reviewItem}>
								<div className={styles.reviewMeta}>
									<strong>Nota {review.nota} de 5</strong>
									<time dateTime={review.data}>{new Date(review.data).toLocaleDateString('pt-BR')}</time>
								</div>
								<p>{review.comentario || 'Sem comentário.'}</p>
							</article>
						))}
					</section>
				)}
				<div className={styles.footer}>
					<button type="button" className={styles.switchBtnLink} onClick={onLogout}>Sair da conta</button>
				</div>
			</section>
		</div>
	);
};

export default Profile;
