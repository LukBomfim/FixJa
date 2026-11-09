import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch
from supabase import AuthApiError

os.environ.setdefault("SUPABASE_URL", "https://unit-test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "unit-test-key")

from servicos.auth_service import registrar_usuario, renovar_sessao
from servicos.perfils_service import _prestador_publico, criar_perfil


class SupabaseAuthHashTests(unittest.TestCase):
    @patch("servicos.auth_service.create_client")
    def test_signup_delegates_password_handling_to_supabase_auth(self, create_client):
        auth = Mock()
        auth.sign_up.return_value = SimpleNamespace(
            user=SimpleNamespace(id="auth-user"),
            session=SimpleNamespace(access_token="access-token", refresh_token="refresh-token"),
        )
        create_client.return_value.auth = auth

        result = registrar_usuario("person@example.test", "long-test-password", "Pessoa")

        self.assertIsNotNone(result)
        user, token, refresh_token = result
        self.assertEqual(user.senha, "")
        self.assertEqual(token, "access-token")
        self.assertEqual(refresh_token, "refresh-token")
        auth.sign_up.assert_called_once_with({
            "email": "person@example.test",
            "password": "long-test-password",
        })

    @patch("servicos.auth_service.create_client")
    def test_refresh_rotates_session_tokens(self, create_client):
        auth = Mock()
        auth.refresh_session.return_value = SimpleNamespace(
            session=SimpleNamespace(access_token="next-access", refresh_token="next-refresh"),
        )
        create_client.return_value.auth = auth

        self.assertEqual(renovar_sessao("current-refresh"), ("next-access", "next-refresh"))
        auth.refresh_session.assert_called_once_with("current-refresh")

    @patch("servicos.auth_service.create_client")
    def test_refresh_provider_outage_is_not_treated_as_an_expired_session(self, create_client):
        auth = Mock()
        auth.refresh_session.side_effect = AuthApiError("temporarily unavailable", 500, None)
        create_client.return_value.auth = auth

        with self.assertRaises(AuthApiError):
            renovar_sessao("current-refresh")

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
