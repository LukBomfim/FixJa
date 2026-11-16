import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Login.module.css';
import { ApiError, api, errorMessage, session } from '../../services/api';
import type { UserProfile } from '../../services/api';
import Logo from '../../components/ui/Logo';

interface LoginProps {
  onLoginSuccess?: (profile: UserProfile | null) => void;
  onNavigateToRegister?: () => void;
  onNavigateToProviderRegister?: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onNavigateToRegister, onNavigateToProviderRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Preencha o e-mail.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-mail em formato inválido.';
    }

    if (!password) {
      newErrors.password = 'Preencha a senha.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await api.login(email, password);
      session.setCredentials(result.token, result.refresh_token);
      let profile = result.usuario;
      if (!profile) {
        try {
          profile = await api.profile();
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 404) throw error;
        }
      }
      onLoginSuccess?.(profile);
    } catch (error) {
      setErrors({ general: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <header className={styles.hero}>
          <Logo size="lg" />
          <p className={styles.tagline}>
            Contrate profissionais autônomos<br />de confiança, rápido e sem complicação.
          </p>
        </header>

        <form onSubmit={handleSubmit} className={`fx-card ${styles.card}`} noValidate>
          <div className="fx-field">
            <label htmlFor="login-email" className="fx-label">E-mail</label>
            <input
              id="login-email"
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
              aria-describedby={errors.email ? 'login-email-error' : undefined}
            />
            {errors.email && <span id="login-email-error" className="fx-field-error">{errors.email}</span>}
          </div>

          <div className="fx-field">
            <label htmlFor="login-password" className="fx-label">Senha</label>
            <div className="fx-password">
              <input
                id="login-password"
                type={passwordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`fx-input ${errors.password ? 'fx-input--error' : ''}`}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
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
            {errors.password && <span id="login-password-error" className="fx-field-error">{errors.password}</span>}
          </div>

          {errors.general && <p className="fx-alert fx-alert--error" role="alert">{errors.general}</p>}

          <button type="submit" disabled={loading} className="fx-btn fx-btn--primary fx-btn--block fx-btn--lg">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className={styles.switchLine}>
            Ainda não tem conta?{' '}
            <button type="button" onClick={onNavigateToRegister} className="fx-link">Criar conta</button>
          </p>
        </form>
      </div>

      <footer className={styles.footer}>
        <span>Sou prestador de serviço</span>
        <span aria-hidden="true">·</span>
        <button type="button" className={styles.footerLink} onClick={onNavigateToProviderRegister || onNavigateToRegister}>
          Quero me cadastrar
        </button>
      </footer>
    </div>
  );
};

export default Login;
