import React, { useEffect, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, Eye, EyeOff, UserRound } from 'lucide-react';
import styles from '../login/Login.module.css';
import { api, errorMessage, session } from '../../services/api';
import type { AccountType, Category } from '../../services/api';
import Logo from '../../components/ui/Logo';

export interface RegistrationDraft {
  username: string;
  tipo: AccountType;
  categoria: string | null;
}

interface RegisterProps {
  onRegisterSuccess?: (token: string, refreshToken: string, draft: RegistrationDraft) => void;
  onNavigateToLogin?: () => void;
  initialProvider?: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  selectedService?: string;
  general?: string;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onNavigateToLogin, initialProvider = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isProvider, setIsProvider] = useState(initialProvider);
  const [selectedService, setSelectedService] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  // erros por campo específico
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    api.categories()
      .then(setCategories)
      .catch((error: unknown) => setErrors({ general: errorMessage(error) }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Preencha seu nome completo.';
    }

    if (!email.trim()) {
      newErrors.email = 'Preencha o e-mail.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-mail em formato inválido.';
    }

    if (!password) {
      newErrors.password = 'Preencha a senha.';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres.';
    }

    if (isProvider && !selectedService) {
      newErrors.selectedService = 'Selecione uma área de atuação.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await api.register(email.trim(), password, name.trim());
      if (!result.token) {
        setConfirmationMessage('Conta criada. Confirme seu e-mail e entre para concluir o perfil.');
        return;
      }
      if (!result.refresh_token) {
        setConfirmationMessage('Conta criada. Confirme seu e-mail e entre para concluir o perfil.');
        return;
      }
      session.setCredentials(result.token, result.refresh_token);
      onRegisterSuccess?.(result.token, result.refresh_token, {
        username: name.trim(),
        tipo: isProvider ? 'PRESTADOR' : 'CLIENTE',
        categoria: isProvider ? selectedService : null,
      });
    } catch (error) {
      setErrors({ general: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.column} ${styles.columnTop}`}>
        <div className={styles.registerTop}>
          <button type="button" className={styles.back} onClick={onNavigateToLogin} aria-label="Voltar para o login">
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
          <div className={styles.registerBrand}>
            <Logo size="sm" />
            <h1 className={styles.registerTitle}>Criar conta</h1>
          </div>
          <span />
        </div>

        <form onSubmit={handleSubmit} className={`fx-card ${styles.card}`} noValidate>
          {confirmationMessage && <p className="fx-alert fx-alert--success" role="status">{confirmationMessage}</p>}

          <div className="fx-field">
            <label htmlFor="name" className="fx-label">Nome</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Ex.: Maria Silva"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={`fx-input ${errors.name ? 'fx-input--error' : ''}`}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <span className="fx-field-error">{errors.name}</span>}
          </div>

          <div className="fx-field">
            <label htmlFor="reg-email" className="fx-label">E-mail</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nome@exemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`fx-input ${errors.email ? 'fx-input--error' : ''}`}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <span className="fx-field-error">{errors.email}</span>}
          </div>

          <div className="fx-field">
            <label htmlFor="reg-password" className="fx-label">Senha</label>
            <div className="fx-password">
              <input
                id="reg-password"
                type={passwordVisible ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`fx-input ${errors.password ? 'fx-input--error' : ''}`}
                aria-invalid={Boolean(errors.password)}
              />
              <button
                type="button"
                className="fx-password__toggle"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={passwordVisible}
              >
                {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            {errors.password && <span className="fx-field-error">{errors.password}</span>}
          </div>

          <div className="fx-field" role="radiogroup" aria-labelledby="account-type-label">
            <span id="account-type-label" className="fx-label">Tipo de conta</span>
            <div className={styles.typeSelector}>
              <button
                type="button"
                role="radio"
                aria-checked={!isProvider}
                className={`${styles.typeOption} ${!isProvider ? styles.typeOptionActive : ''}`}
                onClick={() => setIsProvider(false)}
              >
                <UserRound size={20} aria-hidden="true" />
                <strong>Cliente</strong>
                <small>Quero contratar</small>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={isProvider}
                className={`${styles.typeOption} ${isProvider ? styles.typeOptionActive : ''}`}
                onClick={() => setIsProvider(true)}
              >
                <BriefcaseBusiness size={20} aria-hidden="true" />
                <strong>Prestador</strong>
                <small>Quero oferecer serviços</small>
              </button>
            </div>
          </div>

          {isProvider && (
            <div className={`fx-field ${styles.reveal}`}>
              <label htmlFor="service-select" className="fx-label">Área principal de atuação</label>
              <select
                id="service-select"
                value={selectedService}
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  if (errors.selectedService) setErrors((prev) => ({ ...prev, selectedService: undefined }));
                }}
                className={`fx-input ${errors.selectedService ? 'fx-input--error' : ''}`}
              >
                <option value="" disabled>Selecione um serviço</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.categoria_name}>
                    {item.categoria_name}
                  </option>
                ))}
              </select>
              {errors.selectedService && <span className="fx-field-error">{errors.selectedService}</span>}
            </div>
          )}

          {errors.general && <p className="fx-alert fx-alert--error" role="alert">{errors.general}</p>}

          <button type="submit" disabled={loading} className="fx-btn fx-btn--primary fx-btn--block fx-btn--lg">
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>

          <p className={styles.switchLine}>
            Já tem uma conta?{' '}
            <button type="button" onClick={onNavigateToLogin} className="fx-link">Entrar</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
