from fastapi import Response


class CookieManager:
    def __init__(self, payload: dict):
        self.payload = payload

    def set_cookie(self, response: Response, token: str):
        response.set_cookie("authToken", token, **self.payload)

    def clear_auth_cookie(self, response: Response):
        response.delete_cookie("authToken", path="/")
