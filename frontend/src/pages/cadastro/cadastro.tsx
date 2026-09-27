import React, { useState } from 'react';
import styles from './Cadastro.module.css';

interface RegisterProps {
  onRegisterSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

const SERVICE_OPTIONS = [
  'Encanador', 'Eletricista', 'Pintor', 'Montador de Móveis',
  'Jardineiro', 'Limpeza/Diarista', 'Ar Condicionado', 'Chaveiro'
];

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProvider, setIsProvider] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleService = (service: string) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter((s) => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isProvider && selectedServices.length === 0) {
      alert('Por favor, selecione pelo menos um serviço prestado!');
      return;
    }

    setLoading(true);
    const payload = {
      name,
      email,
      password,
      role: isProvider ? 'PROVIDER' : 'CLIENT',
      services: isProvider ? selectedServices : [],
    };

    try {
      console.log('Enviando dados do Cadastro:', payload);
      setTimeout(() => {
        setLoading(false);
        alert('Conta criada com sucesso!');
        if (onRegisterSuccess) onRegisterSuccess();
      }, 1200);
    } catch (error) {
      setLoading(false);
      alert('Erro ao realizar cadastro.');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.brandHeader}>
            <span className={styles.logoBadge}>🔧 FixJá</span>
          </div>

          <div className={styles.welcomeText}>
            <h1 className={styles.title}>Crie sua conta</h1>
            <p className={styles.subtitle}>
              Junte-se ao FixJá como cliente ou prestador de serviços.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputField}>
              <label htmlFor="name" className={styles.label}>Nome Completo</label>
              <input
                id="name"
                type="text"
                required
                placeholder="Ex: Maria Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputField}>
              <label htmlFor="reg-email" className={styles.label}>E-mail</label>
              <input
                id="reg-email"
                type="email"
                required
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.inputField}>
              <label htmlFor="reg-password" className={styles.label}>Senha</label>
              <input
                id="reg-password"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />
            </div>

            {/* seleção do tipo de conta */}
            <div className={styles.accountTypeBox}>
              <label className={styles.accountTypeLabel}>Tipo de Conta</label>
              <div className={styles.typeSelector}>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${!isProvider ? styles.typeBtnActive : ''}`}
                  onClick={() => setIsProvider(false)}
                >
                  👤 Cliente
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${isProvider ? styles.typeBtnActive : ''}`}
                  onClick={() => setIsProvider(true)}
                >
                  🛠️ Prestador
                </button>
              </div>
            </div>

            {/* aparece apenas se for Prestador */}
            {isProvider && (
              <div className={styles.servicesContainer}>
                <label className={styles.label}>
                  Selecione seus serviços (Conta Profissional):
                </label>
                <div className={styles.servicesGrid}>
                  {SERVICE_OPTIONS.map((service) => {
                    const isSelected = selectedServices.includes(service);
                    return (
                      <button
                        type="button"
                        key={service}
                        onClick={() => toggleService(service)}
                        className={`${styles.serviceTag} ${isSelected ? styles.serviceTagActive : ''}`}
                      >
                        {service} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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

      {/* banner direito */}
      <div className={styles.bannerSection}>
        <div className={styles.bannerOverlay}>
          <div className={styles.bannerCard}>
            <h3>Trabalhe conosco ou resolva seu problema.</h3>
            <p>Milhares de profissionais qualificados prontos para te atender.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;