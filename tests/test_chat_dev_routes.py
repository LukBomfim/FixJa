import os
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch
from supabase import AuthApiError

os.environ.setdefault("SUPABASE_URL", "https://unit-test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "unit-test-key")

from app import app


class ChatRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    @patch("auth.middleware.create_client")
    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.chat_routes.buscar_conversa_participante", return_value=None)
    @patch("rotas.chat_routes.marcar_conversa_como_lida")
    @patch("rotas.chat_routes.buscar_mensagens")
    def test_nonparticipant_cannot_read_or_mark_conversation(
        self, get_messages, mark_read, find_conversation, get_user, create_client
    ):
        get_user.return_value = SimpleNamespace(user=SimpleNamespace(id="unrelated-user"))
        create_client.return_value.postgrest.auth = Mock()

        response = self.client.get(
            "/conversas/conversation-id/mensagens",
            headers={"Authorization": "Bearer test-token"},
        )

        self.assertEqual(response.status_code, 404)
        find_conversation.assert_called_once_with("conversation-id", "unrelated-user")
        mark_read.assert_not_called()
        get_messages.assert_not_called()

    @patch("auth.middleware.create_client")
    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.chat_routes.enviar_mensagem")
    @patch("rotas.chat_routes.buscar_conversa_participante")
    def test_participant_can_send_a_valid_message(
        self, find_conversation, send_message, get_user, create_client
    ):
        user_id = "client-user"
        find_conversation.return_value = {
            "id": "conversation-id",
            "client_id": user_id,
            "provider_id": "provider-user",
        }
        send_message.return_value = {
            "id": 1,
            "conversation_id": "conversation-id",
            "sender_id": user_id,
            "body": "Olá",
        }
        get_user.return_value = SimpleNamespace(user=SimpleNamespace(id=user_id))
        create_client.return_value.postgrest.auth = Mock()

        response = self.client.post(
            "/conversas/conversation-id/mensagens",
            headers={"Authorization": "Bearer test-token"},
            json={"body": " Olá "},
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["body"], "Olá")
        send_message.assert_called_once_with("conversation-id", user_id, "Olá")

    @patch("auth.middleware.create_client")
    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.chat_routes.buscar_mensagens", return_value=[{"id": 1, "body": "Olá"}])
    @patch("rotas.chat_routes.marcar_conversa_como_lida")
    @patch("rotas.chat_routes.buscar_conversa_participante")
    def test_participant_can_read_and_mark_messages_as_read(
        self, find_conversation, mark_read, get_messages, get_user, create_client
    ):
        user_id = "provider-user"
        find_conversation.return_value = {
            "id": "conversation-id",
            "client_id": "client-user",
            "provider_id": user_id,
        }
        get_user.return_value = SimpleNamespace(user=SimpleNamespace(id=user_id))
        create_client.return_value.postgrest.auth = Mock()

        response = self.client.get(
            "/conversas/conversation-id/mensagens",
            headers={"Authorization": "Bearer test-token"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [{"id": 1, "body": "Olá"}])
        mark_read.assert_called_once_with("conversation-id", user_id)
        get_messages.assert_called_once_with("conversation-id")

    @patch("auth.middleware.create_client")
    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.chat_routes.buscar_conversas", side_effect=RuntimeError("database detail"))
    def test_unexpected_chat_errors_are_logged_without_leaking_to_client(
        self, find_conversations, get_user, create_client
    ):
        get_user.return_value = SimpleNamespace(user=SimpleNamespace(id="client-user"))
        create_client.return_value.postgrest.auth = Mock()

        with self.assertLogs("app", level="ERROR") as captured:
            response = self.client.get(
                "/conversas",
                headers={"Authorization": "Bearer test-token"},
            )

        self.assertEqual(response.status_code, 500)
        self.assertNotIn("database detail", response.get_data(as_text=True))
        self.assertTrue(any("database detail" in entry for entry in captured.output))
        find_conversations.assert_called_once_with("client-user")


class DeveloperRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    @patch("auth.middleware.create_client")
    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.dev_routes.usuario_pode_acessar_dev", return_value=False)
    @patch("rotas.dev_routes.buscar_perfil_prestador")
    def test_authenticated_non_developer_cannot_run_benchmark(
        self, get_providers, can_access, get_user, create_client
    ):
        get_user.return_value = SimpleNamespace(user=SimpleNamespace(id="regular-user"))
        create_client.return_value.postgrest.auth = Mock()

        response = self.client.get(
            "/dev/benchmark",
            headers={"Authorization": "Bearer test-token"},
        )

        self.assertEqual(response.status_code, 403)
        can_access.assert_called_once_with("regular-user")
        get_providers.assert_not_called()


class SessionRefreshRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    @patch("rotas.auth_route.renovar_sessao", return_value=("new-access", "new-refresh"))
    def test_refresh_returns_rotated_tokens(self, refresh_session):
        response = self.client.post("/session/refresh", json={"refresh_token": "old-refresh"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {
            "token": "new-access",
            "refresh_token": "new-refresh",
        })
        refresh_session.assert_called_once_with("old-refresh")

    @patch("rotas.auth_route.renovar_sessao", return_value=None)
    def test_invalid_refresh_token_requires_login(self, refresh_session):
        response = self.client.post("/session/refresh", json={"refresh_token": "expired"})
        self.assertEqual(response.status_code, 401)
        refresh_session.assert_called_once_with("expired")

    @patch("rotas.auth_route.renovar_sessao", side_effect=AuthApiError("temporarily unavailable", 500, None))
    def test_auth_provider_outage_does_not_expire_session(self, refresh_session):
        response = self.client.post("/session/refresh", json={"refresh_token": "current-refresh"})
        self.assertEqual(response.status_code, 503)
        refresh_session.assert_called_once_with("current-refresh")


if __name__ == "__main__":
    unittest.main()
