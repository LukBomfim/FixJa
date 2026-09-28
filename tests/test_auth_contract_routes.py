import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault("SUPABASE_URL", "https://unit-test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "unit-test-key")

from app import app


class ProtectedRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    @staticmethod
    def authenticated_user(user_id, email="account@example.test"):
        return SimpleNamespace(user=SimpleNamespace(id=user_id, email=email))

    def test_contract_list_requires_bearer_token(self):
        response = self.client.get("/contratacoes")
        self.assertEqual(response.status_code, 401)

    @patch("auth.middleware.supabase_client.auth.get_user", side_effect=RuntimeError("invalid token"))
    def test_invalid_token_is_rejected(self, get_user):
        response = self.client.get(
            "/contratacoes",
            headers={"Authorization": "Bearer invalid-token"},
        )
        self.assertEqual(response.status_code, 401)

    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.contratacoes_routes.buscar_perfil_por_id")
    @patch("rotas.contratacoes_routes.criar_contratacao_db")
    def test_create_contract_uses_authenticated_user_id(self, create_contract, get_profile, get_user):
        get_user.return_value = self.authenticated_user("client-from-token")
        get_profile.side_effect = [
            {"tipo": "CLIENTE", "username": "Cliente"},
            {"tipo": "PRESTADOR", "username": "Prestador"},
        ]
        create_contract.return_value = {"id": 7, "client_id": "client-from-token", "status": "pendente"}

        response = self.client.post(
            "/contratacoes",
            headers={"Authorization": "Bearer valid-test-token"},
            json={
                "client_id": "attacker-selected-id",
                "prestador_id": "provider-id",
                "descricao": "Reparo de torneira",
                "data_solicitada": "2026-10-10T12:30:00Z",
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(create_contract.call_args.kwargs["client_id"], "client-from-token")

    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.contratacoes_routes.buscar_contratacao_por_id_db")
    def test_contract_access_is_denied_to_nonparticipant(self, get_contract, get_user):
        get_user.return_value = self.authenticated_user("unrelated-user")
        contract_id = "123e4567-e89b-12d3-a456-426614174000"
        get_contract.return_value = {
            "id": contract_id,
            "client_id": "client-id",
            "prestador_id": "provider-id",
            "status": "pendente",
        }

        response = self.client.get(
            f"/contratacoes/{contract_id}",
            headers={"Authorization": "Bearer valid-test-token"},
        )

        self.assertEqual(response.status_code, 403)

    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.contratacoes_routes.buscar_perfil_por_id")
    @patch("rotas.contratacoes_routes.buscar_contratacao_por_id_db")
    @patch("rotas.contratacoes_routes.atualizar_estado_contratacao")
    def test_client_cannot_accept_contract(self, update_contract, get_contract, get_profile, get_user):
        get_user.return_value = self.authenticated_user("client-id")
        get_contract.return_value = {
            "id": 9,
            "client_id": "client-id",
            "prestador_id": "provider-id",
            "status": "pendente",
        }
        get_profile.return_value = {"tipo": "CLIENTE"}

        response = self.client.put(
            "/contratacoes/9",
            headers={"Authorization": "Bearer valid-test-token"},
            json={"status": "aceito"},
        )

        self.assertEqual(response.status_code, 403)
        update_contract.assert_not_called()

        refusal_response = self.client.put(
            "/contratacoes/9",
            headers={"Authorization": "Bearer valid-test-token"},
            json={"status": "recusado"},
        )
        self.assertEqual(refusal_response.status_code, 403)
        update_contract.assert_not_called()

    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.contratacoes_routes.buscar_perfil_por_id")
    @patch("rotas.contratacoes_routes.buscar_contratacao_por_id_db")
    @patch("rotas.contratacoes_routes.atualizar_estado_contratacao")
    @patch("rotas.contratacoes_routes.buscar_nomes_perfis_por_ids", return_value={})
    def test_provider_can_accept_uuid_contract(self, get_names, update_contract, get_contract, get_profile, get_user):
        provider_id = "provider-id"
        contract_id = "123e4567-e89b-12d3-a456-426614174000"
        get_user.return_value = self.authenticated_user(provider_id)
        get_contract.return_value = {
            "id": contract_id,
            "client_id": "client-id",
            "prestador_id": provider_id,
            "status": "pendente",
        }
        get_profile.return_value = {"tipo": "PRESTADOR"}
        update_contract.return_value = {
            "id": contract_id,
            "client_id": "client-id",
            "prestador_id": provider_id,
            "status": "aceito",
        }

        response = self.client.put(
            f"/contratacoes/{contract_id}",
            headers={"Authorization": "Bearer valid-test-token"},
            json={"status": "aceito"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "aceito")
        update_contract.assert_called_once_with(contract_id, "aceito")

    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.contratacoes_routes.buscar_perfil_por_id")
    @patch("rotas.contratacoes_routes.buscar_contratacao_por_id_db")
    @patch("rotas.contratacoes_routes.atualizar_estado_contratacao")
    @patch("rotas.contratacoes_routes.buscar_nomes_perfis_por_ids", return_value={})
    def test_provider_can_refuse_own_pending_contract(self, get_names, update_contract, get_contract, get_profile, get_user):
        provider_id = "provider-id"
        contract_id = "123e4567-e89b-12d3-a456-426614174002"
        get_user.return_value = self.authenticated_user(provider_id)
        get_contract.return_value = {
            "id": contract_id,
            "client_id": "client-id",
            "prestador_id": provider_id,
            "status": "pendente",
        }
        get_profile.return_value = {"tipo": "PRESTADOR"}
        update_contract.return_value = {
            "id": contract_id,
            "client_id": "client-id",
            "prestador_id": provider_id,
            "status": "recusado",
        }

        response = self.client.put(
            f"/contratacoes/{contract_id}",
            headers={"Authorization": "Bearer valid-test-token"},
            json={"status": "recusado"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "recusado")
        self.assertEqual(response.get_json()["mensagem"], "O prestador recusou o seu pedido.")
        update_contract.assert_called_once_with(contract_id, "recusado")

        alias_response = self.client.put(
            f"/contratacoes/{contract_id}",
            headers={"Authorization": "Bearer valid-test-token"},
            json={"status": "REJEITADO"},
        )
        self.assertEqual(alias_response.status_code, 200)
        self.assertEqual(update_contract.call_args.args, (contract_id, "recusado"))

    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.contratacoes_routes.buscar_perfil_por_id")
    @patch("rotas.contratacoes_routes.buscar_contratacao_por_id_db")
    @patch("rotas.contratacoes_routes.atualizar_estado_contratacao")
    @patch("rotas.contratacoes_routes.buscar_nomes_perfis_por_ids", return_value={})
    def test_client_can_confirm_accepted_uuid_contract(self, get_names, update_contract, get_contract, get_profile, get_user):
        client_id = "client-id"
        contract_id = "123e4567-e89b-12d3-a456-426614174000"
        get_user.return_value = self.authenticated_user(client_id)
        get_contract.return_value = {
            "id": contract_id,
            "client_id": client_id,
            "prestador_id": "provider-id",
            "status": "aceito",
        }
        get_profile.return_value = {"tipo": "CLIENTE"}
        update_contract.return_value = {"id": contract_id, "status": "concluido"}

        response = self.client.put(
            f"/contratacoes/{contract_id}",
            headers={"Authorization": "Bearer valid-test-token"},
            json={"status": "concluido"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "concluido")
        update_contract.assert_called_once_with(contract_id, "concluido")

    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.contratacoes_routes.buscar_perfil_por_id")
    @patch("rotas.contratacoes_routes.buscar_contratacao_por_user_id")
    @patch("rotas.contratacoes_routes.buscar_nomes_perfis_por_ids")
    @patch("rotas.contratacoes_routes.buscar_ids_contratacoes_avaliadas", return_value=set())
    def test_contract_list_includes_participant_names(self, get_reviewed_ids, get_names, get_contracts, get_profile, get_user):
        client_id = "client-id"
        get_user.return_value = self.authenticated_user(client_id)
        get_profile.return_value = {"tipo": "CLIENTE"}
        pending_review_id = "123e4567-e89b-12d3-a456-426614174000"
        saved_review_id = "123e4567-e89b-12d3-a456-426614174001"
        get_contracts.return_value = [
            {
                "id": pending_review_id,
                "client_id": client_id,
                "prestador_id": "provider-id",
                "status": "concluido",
            },
            {
                "id": saved_review_id,
                "client_id": client_id,
                "prestador_id": "provider-id",
                "status": "concluido",
            },
            {
                "id": "123e4567-e89b-12d3-a456-426614174003",
                "client_id": client_id,
                "prestador_id": "provider-id",
                "status": "recusado",
            },
        ]
        get_names.return_value = {
            client_id: {"username": "Cliente", "email": "cliente@example.test", "telefone": "11999999999"},
            "provider-id": {"username": "Prestador", "email": "prestador@example.test", "telefone": "11888888888"},
        }
        get_reviewed_ids.return_value = {saved_review_id}

        response = self.client.get(
            "/contratacoes",
            headers={"Authorization": "Bearer valid-test-token"},
        )

        self.assertEqual(response.status_code, 200)
        contracts = response.get_json()
        contract = contracts[0]
        self.assertEqual(contract["cliente_nome"], "Cliente")
        self.assertEqual(contract["cliente_email"], "cliente@example.test")
        self.assertEqual(contract["cliente_telefone"], "11999999999")
        self.assertEqual(contract["prestador_nome"], "Prestador")
        self.assertEqual(contract["prestador_email"], "prestador@example.test")
        self.assertEqual(contract["prestador_telefone"], "11888888888")
        self.assertFalse(contract["avaliada"])
        self.assertTrue(contracts[1]["avaliada"])
        self.assertEqual(contracts[2]["mensagem"], "O prestador recusou o seu pedido.")

    @patch("auth.middleware.supabase_client.auth.get_user")
    @patch("rotas.auth_route.buscar_perfil_por_id", return_value=None)
    @patch("rotas.auth_route.criar_perfil")
    def test_profile_creation_uses_token_identity(self, create_profile, get_profile, get_user):
        get_user.return_value = self.authenticated_user("user-from-token", "token@example.test")
        create_profile.return_value = {"id": "user-from-token", "email": "token@example.test"}

        response = self.client.post(
            "/register/profile",
            headers={"Authorization": "Bearer valid-test-token"},
            json={
                "id": "attacker-selected-id",
                "email": "attacker@example.test",
                "username": "Conta",
                "tipo": "CLIENTE",
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(create_profile.call_args.args[:2], ("user-from-token", "token@example.test"))


if __name__ == "__main__":
    unittest.main()