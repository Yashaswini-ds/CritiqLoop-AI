import re


def sanitize_error_message(err: Exception) -> str:
    """Sanitizes error messages by redacting API keys and mapping common API failures to clean diagnostics."""
    err_str = str(err)

    # Redact any Groq API Key pattern (gsk_...) or Authorization headers
    sanitized = re.sub(r"gsk_[A-Za-z0-9_-]+", "[REDACTED_API_KEY]", err_str)
    sanitized = re.sub(r"Bearer\s+[A-Za-z0-9._-]+", "Bearer [REDACTED_TOKEN]", sanitized, flags=re.IGNORECASE)

    # Map known error codes to clear user-facing diagnostics
    lower_err = sanitized.lower()

    if "401" in lower_err or "invalid_api_key" in lower_err or "authentication" in lower_err:
        return "Groq API Authentication failed. Please check your GROQ_API_KEY in the .env file."

    if "model_decommissioned" in lower_err or "decommissioned" in lower_err:
        return "Configured Groq model has been decommissioned. Update GROQ_MODEL in .env to a supported model (e.g., llama-3.3-70b-versatile or llama-3.1-8b-instant)."

    if "404" in lower_err or "model_not_found" in lower_err or "does not exist" in lower_err:
        return "Groq model is unavailable or not accessible. Please verify GROQ_MODEL in .env or select a supported model (e.g., llama-3.3-70b-versatile or llama-3.1-8b-instant)."

    if "429" in lower_err or "rate_limit" in lower_err or "rate limit" in lower_err:
        return "Groq API rate limit reached. Please try again later."

    if "tool call validation failed" in lower_err or "structured output" in lower_err:
        return "Failed to parse structured review output from LLM."

    if "connection" in lower_err or "timeout" in lower_err or "connecterror" in lower_err:
        return "Network or connection error while contacting Groq API."

    return sanitized
