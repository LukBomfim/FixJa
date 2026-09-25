// Login de malandro
document.querySelector('.form-login').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Login efetuado com sucesso:', data);
        } else {
            console.error('Erro no login:', data);
        }
    } catch (error) {
        console.error('Erro na requisição de login:', error);
    }
});

// Cadastro top 100

const formRegister = document.querySelector('.form-register');

if (formRegister) {
    formRegister.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const name = document.getElementById('reg-name')?.value;
        const email = document.getElementById('reg-email')?.value;
        const password = document.getElementById('reg-password')?.value;
        
        const userTypeElement = document.querySelector('input[name="user_type"]:checked');
        if (!userTypeElement) {
            alert('Por favor, selecione se você é Cliente ou Prestador.');
            return;
        }
        
        const userType = userTypeElement.value;
        const category = document.getElementById('reg-category')?.value || null;
        const bio = document.getElementById('reg-bio')?.value || null;

        const payload = {
            username: name,
            email: email,
            senha: password,
            tipo: userType.toUpperCase(), 
            categoria: userType.toLowerCase() === 'prestador' ? category : null,
            descricao: userType.toLowerCase() === 'prestador' ? bio : null
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                alert('Cadastro realizado com sucesso!');
                console.log('Utilizador criado:', data);
                
                const tabLogin = document.getElementById('tab-login-check');
                if (tabLogin) tabLogin.checked = true;
            } else {
                alert(`Erro no cadastro: ${data.erro || 'Verifique os dados informados'}`);
            }

        } catch (error) {
            console.error('Erro na requisição de cadastro:', error);
            alert('Não foi possível conectar ao servidor. Verifique se o Flask (python app.py) está ativo no terminal!');
        }
    });
}