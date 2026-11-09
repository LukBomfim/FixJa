from datetime import datetime, timezone

from auth.middleware import get_request_supabase_client

MAX_MESSAGE_LENGTH = 5000


def _client():
    return get_request_supabase_client()


def buscar_conversas(user_id):
    client = _client()
    como_cliente = (
        client.table("conversations").select("*").eq("client_id", user_id).execute().data
    )
    como_prestador = (
        client.table("conversations").select("*").eq("provider_id", user_id).execute().data
    )
    conversas = {str(item["id"]): item for item in [*como_cliente, *como_prestador]}
    if not conversas:
        return []

    ids = list(conversas)
    mensagens = (
        client.table("conversation_messages")
        .select("*")
        .in_("conversation_id", ids)
        .order("sent_at", desc=True)
        .execute()
        .data
    )
    resumo: dict[str, dict] = {}
    for mensagem in mensagens or []:
        conversation_id = str(mensagem["conversation_id"])
        entry = resumo.setdefault(conversation_id, {"ultima_mensagem": mensagem, "nao_lidas": 0})
        if mensagem.get("sender_id") != str(user_id) and not mensagem.get("read_at"):
            entry["nao_lidas"] += 1

    outros_ids = list({
        str(item["provider_id"] if str(item["client_id"]) == str(user_id) else item["client_id"])
        for item in conversas.values()
    })
    perfis = (
        client.table("profiles")
        .select("id, username, tipo")
        .in_("id", outros_ids)
        .execute()
        .data
    ) if outros_ids else []
    perfis_por_id = {str(perfil["id"]): perfil for perfil in perfis}

    resultado = []
    for conversation_id, conversa in conversas.items():
        outro_id = str(
            conversa["provider_id"]
            if str(conversa["client_id"]) == str(user_id)
            else conversa["client_id"]
        )
        resultado.append({
            "id": conversation_id,
            "participante": perfis_por_id.get(outro_id, {"id": outro_id, "username": "Usuário"}),
            "ultima_mensagem": resumo.get(conversation_id, {}).get("ultima_mensagem"),
            "nao_lidas": resumo.get(conversation_id, {}).get("nao_lidas", 0),
        })
    return sorted(
        resultado,
        key=lambda item: (
            (item["ultima_mensagem"] or {}).get("sent_at") or "",
            item["id"],
        ),
        reverse=True,
    )


def criar_conversa_cliente(client_id, provider_id):
    client = _client()
    prestador = (
        client.table("profiles")
        .select("id, tipo")
        .eq("id", provider_id)
        .eq("tipo", "PRESTADOR")
        .limit(1)
        .execute()
        .data
    )
    if not prestador:
        return None
    existing = (
        client.table("conversations")
        .select("*")
        .eq("client_id", client_id)
        .eq("provider_id", provider_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]
    response = client.table("conversations").insert({
        "client_id": client_id,
        "provider_id": provider_id,
    }).execute()
    return response.data[0] if response.data else None


def buscar_conversa_participante(conversation_id, user_id):
    client = _client()
    response = (
        client.table("conversations")
        .select("*")
        .eq("id", conversation_id)
        .execute()
    )
    for conversa in response.data or []:
        if str(user_id) in (str(conversa["client_id"]), str(conversa["provider_id"])):
            return conversa
    return None


def buscar_mensagens(conversation_id):
    mensagens = (
        _client()
        .table("conversation_messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("sent_at", desc=True)
        .limit(200)
        .execute()
        .data
    ) or []
    return mensagens[::-1]


def marcar_conversa_como_lida(conversation_id, user_id):
    return (
        _client()
        .table("conversation_messages")
        .update({"read_at": datetime.now(timezone.utc).isoformat()})
        .eq("conversation_id", conversation_id)
        .neq("sender_id", user_id)
        .is_("read_at", "null")
        .execute()
    )


def enviar_mensagem(conversation_id, sender_id, body):
    response = (
        _client()
        .table("conversation_messages")
        .insert({
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "body": body.strip(),
        })
        .execute()
    )
    return response.data[0] if response.data else None
