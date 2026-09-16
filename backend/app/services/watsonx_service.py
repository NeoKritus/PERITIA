"""
PERITIA - IBM watsonx.ai Integration Service
Handles all communication with the IBM watsonx.ai foundation model API.
Credentials are loaded from environment variables only — never hardcoded.
"""
import logging
import requests
from typing import Optional
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class WatsonxService:
    """
    Modular IBM watsonx.ai client.
    The model_id can be changed via IBM_MODEL_ID environment variable.
    """

    def __init__(self):
        self.settings = get_settings()
        self._access_token: Optional[str] = None
        self._token_expiry: float = 0

    def _get_iam_token(self) -> str:
        """
        Obtain an IAM Bearer token from the IBM Identity service using the API key.
        Tokens are valid for 60 minutes; refresh when needed.
        """
        import time
        if self._access_token and time.time() < self._token_expiry - 60:
            return self._access_token

        url = "https://iam.cloud.ibm.com/identity/token"
        data = {
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": self.settings.IBM_API_KEY,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        try:
            response = requests.post(url, data=data, headers=headers, timeout=30)
            response.raise_for_status()
            token_data = response.json()
            self._access_token = token_data["access_token"]
            import time as _time
            self._token_expiry = _time.time() + token_data.get("expires_in", 3600)
            return self._access_token
        except requests.HTTPError as e:
            logger.error(f"IBM IAM token request failed: {e} - {response.text}")
            raise RuntimeError(f"IBM authentication failed: {response.status_code} {response.text}")
        except Exception as e:
            logger.error(f"IBM IAM token error: {e}")
            raise RuntimeError(f"IBM authentication error: {str(e)}")

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 2000,
        temperature: float = 0.3,
    ) -> str:
        """
        Call the watsonx.ai chat completions endpoint.
        Returns the model's text response.
        """
        if not self.settings.is_watsonx_configured:
            raise RuntimeError(
                "IBM watsonx.ai is not configured. "
                "Set IBM_API_KEY and IBM_PROJECT_ID environment variables."
            )

        access_token = self._get_iam_token()

        url = (
            f"{self.settings.IBM_URL}/ml/v1/text/chat"
            f"?version={self.settings.IBM_API_VERSION}"
        )

        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "project_id": self.settings.IBM_PROJECT_ID,
            "model_id": self.settings.IBM_MODEL_ID,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0,
        }

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
            data = response.json()

            # Extract text from response
            choices = data.get("choices", [])
            if not choices:
                raise RuntimeError("IBM watsonx.ai returned empty choices")

            content = choices[0].get("message", {}).get("content", "")
            if not content:
                raise RuntimeError("IBM watsonx.ai returned empty content")

            return content.strip()

        except requests.HTTPError as e:
            status = response.status_code
            body = response.text[:500]
            logger.error(f"watsonx.ai HTTP error {status}: {body}")
            if status == 401:
                raise RuntimeError("IBM watsonx.ai authentication failed. Check your API key.")
            elif status == 403:
                raise RuntimeError("IBM watsonx.ai access denied. Check project ID and permissions.")
            elif status == 429:
                raise RuntimeError("IBM watsonx.ai rate limit exceeded. Please retry in a moment.")
            else:
                raise RuntimeError(f"IBM watsonx.ai error {status}: {body}")
        except requests.Timeout:
            raise RuntimeError("IBM watsonx.ai request timed out. Please retry.")
        except requests.ConnectionError:
            raise RuntimeError("Cannot connect to IBM watsonx.ai. Check your network connection.")


# Singleton
_watsonx_service: WatsonxService | None = None


def get_watsonx_service() -> WatsonxService:
    global _watsonx_service
    if _watsonx_service is None:
        _watsonx_service = WatsonxService()
    return _watsonx_service
