from os import getenv


def usuario_pode_acessar_dev(user_id):
    autorizados = {
        item.strip()
        for item in getenv("DEV_MODE_USER_IDS", "").split(",")
        if item.strip()
    }
    return bool(user_id) and str(user_id) in autorizados
