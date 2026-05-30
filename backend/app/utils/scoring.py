def clamp_score(score: float) -> float:
    return round(max(0.0, min(1.0, score)), 4)


def risk_band(score: float) -> str:
    if score >= 0.75:
        return "high"
    if score >= 0.45:
        return "medium"
    return "low"
