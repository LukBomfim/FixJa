import React, { useEffect, useState } from 'react';
import styles from './cadastro.module.css';
import { api, errorMessage, session } from '../../services/api';
import type { AccountType, Category } from '../../services/api';

export interface RegistrationDraft {
  username: string;
  tipo: AccountType;
  categoria: string | null;
}

interface RegisterProps {
  onRegisterSuccess?: (token: string, draft: RegistrationDraft) => void;
  onNavigateToLogin?: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  selectedService?: string;
  general?: string;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProvider, setIsProvider] = useState(false);
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
      session.setToken(result.token);
      onRegisterSuccess?.(result.token, {
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
    <div className={styles.pageWrapper}>
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.brandHeader}>
            <span className={styles.logoBadge}>FixJá</span>
          </div>

          <div className={styles.welcomeText}>
            <h1 className={styles.title}>Crie sua conta</h1>
            <p className={styles.subtitle}>
              Junte-se ao FixJá como cliente ou prestador de serviços.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {confirmationMessage && <p className={styles.successMessage} role="status">{confirmationMessage}</p>}
            {/* Nome */}
            <div className={styles.inputField}>
              <label htmlFor="name" className={styles.label}>Nome Completo</label>
              <input
                id="name"
                type="text"
                placeholder="Ex: Maria Silva"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              />
              {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
            </div>

            {/* E-mail */}
            <div className={styles.inputField}>
              <label htmlFor="reg-email" className={styles.label}>E-mail</label>
              <input
                id="reg-email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              />
              {errors.email && <span className={styles.errorMessage}> {errors.email}</span>}
            </div>

            {/* Senha */}
            <div className={styles.inputField}>
              <label htmlFor="reg-password" className={styles.label}>Senha</label>
              <input
                id="reg-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              />
              {errors.password && <span className={styles.errorMessage}> {errors.password}</span>}
            </div>

            {/* Tipo de Conta */}
            <div className={styles.accountTypeBox}>
              <label className={styles.accountTypeLabel}>Tipo de Conta</label>
              <div className={styles.typeSelector}>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${!isProvider ? styles.typeBtnActive : ''}`}
                  onClick={() => setIsProvider(false)}
                >
                  Cliente
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${isProvider ? styles.typeBtnActive : ''}`}
                  onClick={() => setIsProvider(true)}
                >
                  Prestador
                </button>
              </div>
            </div>

            {/* Serviços */}
            {isProvider && (
              <div className={styles.inputField}>
                <label htmlFor="service-select" className={styles.label}>
                  Área Principal de Atuação:
                </label>
                <select
                  id="service-select"
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    if (errors.selectedService) setErrors((prev) => ({ ...prev, selectedService: undefined }));
                  }}
                  className={`${styles.input} ${errors.selectedService ? styles.inputError : ''}`}
                >
                  <option value="" disabled>
                    -- Selecione um serviço --
                  </option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.categoria_name}>
                      {item.categoria_name}
                    </option>
                  ))}
                </select>
                {errors.selectedService && (
                  <span className={styles.errorMessage}>{errors.selectedService}</span>
                )}
              </div>
            )}

            {errors.general && <span className={styles.errorMessage}>{errors.general}</span>}

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
            </button>
          </form>

          <div className={styles.footer}>
            <span>Já tem uma conta?</span>{' '}
            <button 
              type="button" 
              onClick={onNavigateToLogin} 
              className={styles.loginBtnLink}
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>

      <div className={styles.bannerSection}>
        <img 
          src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop" 
          alt="Trabalhador de Serviços FixJá" 
          className={styles.bannerImage}
        />
        <div className={styles.bannerOverlay} />
      </div>
    </div>
  );
};

export default Register;