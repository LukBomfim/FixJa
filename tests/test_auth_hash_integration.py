import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

os.environ.setdefault("SUPABASE_URL", "https://unit-test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "unit-test-key")

from servicos.auth_service import registrar_usuario
from servicos.perfils_service import _prestador_publico, criar_perfil


class SupabaseAuthHashTests(unittest.TestCase):
    @patch("servicos.auth_service.create_client")
    def test_signup_delegates_password_handling_to_supabase_auth(self, create_client):
        auth = Mock()
        auth.sign_up.return_value = SimpleNamespace(
            user=SimpleNamespace(id="auth-user"),
            session=None,
        )
        create_client.return_value.auth = auth

        result = registrar_usuario("person@example.test", "long-test-password", "Pessoa")

        self.assertIsNotNone(result)
        user, token = result
        self.assertEqual(user.senha, "")
        self.assertIsNone(token)
        auth.sign_up.assert_called_once_with({
            "email": "person@example.test",
            "password": "long-test-password",
        })

    @patch("servicos.perfils_service.get_request_supabase_client")
    def test_profile_table_never_receives_password(self, get_client):
        query = Mock()
        query.insert.return_value = query
        query.execute.return_value = SimpleNamespace(data=[{"id": "user-1", "tipo": "CLIENTE"}])
        get_client.return_value.table.return_value = query

        criar_perfil("user-1", "person@example.test", {
            "username": "Pessoa",
            "tipo": "CLIENTE",
        })

        saved_profile = query.insert.call_args.args[0]
        self.assertNotIn("senha", saved_profile)

    @patch("servicos.perfils_service.get_request_supabase_client")
    def test_provider_creation_requires_valid_location_before_database_write(self, get_client):
        with self.assertRaisesRegex(ValueError, "latitude e longitude"):
            criar_perfil("provider-1", "provider@example.test", {
                "username": "Prestador",
                "tipo": "PRESTADOR",
                "cidade": "São Paulo",
                "estado": "SP",
                "endereco": "Centro",
                "latitude": None,
                "longitude": None,
            })
        get_client.assert_not_called()

    def test_public_provider_profile_does_not_expose_exact_location(self):
        provider = _prestador_publico({
            "id": "provider-1",
            "username": "Prestador",
            "data_nascimento": "1990-01-01",
            "endereco": "Rua privada",
            "latitude": -23.5,
            "longitude": -46.6,
            "senha": "must-not-leak",
            "cidade": "São Paulo",
            "estado": "SP",
        })

        self.assertNotIn("senha", provider)
        self.assertNotIn("endereco", provider)
        self.assertNotIn("latitude", provider)
        self.assertNotIn("longitude", provider)
        self.assertEqual(provider["estado"], "SP")


if __name__ == "__main__":
    unittest.main()
