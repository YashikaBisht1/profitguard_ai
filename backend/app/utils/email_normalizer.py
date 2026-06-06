import re

def normalize_email(email_str: str) -> tuple[str, str]:
    """
    Standardize an email address for fraud linkage checking.
    Returns:
        tuple[str, str]: (normalized_email, domain)
        
    Rules:
    - Trim whitespace and convert to lowercase.
    - Split local part and domain.
    - If domain is gmail.com or googlemail.com, remove all dots from the local part,
      and strip any subaddressing suffix starting with '+'.
    - For other domains, strip any subaddressing suffix starting with '+'.
    """
    if not email_str:
        return "", ""
        
    cleaned = email_str.strip().lower()
    
    # Check if format is roughly correct (must contain @)
    if "@" not in cleaned:
        return cleaned, ""
        
    local, domain = cleaned.rsplit("@", 1)
    
    # Subaddressing is generally indicated by a '+' character
    if "+" in local:
        local = local.split("+", 1)[0]
        
    # Gmail-specific rules
    if domain in ("gmail.com", "googlemail.com"):
        local = local.replace(".", "")
        domain = "gmail.com"  # standardize googlemail to gmail
        
    normalized = f"{local}@{domain}"
    return normalized, domain
