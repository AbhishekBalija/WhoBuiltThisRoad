import re


def normalize_road_name(raw: str) -> str:
    """Clean a BBMP road name for display."""
    if not raw:
        return ""
    name = raw.strip()
    name = re.sub(r'\bRd\b', 'Road', name)
    name = re.sub(r'\bSt\b', 'Street', name)
    name = re.sub(r'\b100[\s-]*[Ff]eet\b', '100ft', name)
    name = re.sub(r'\b100\s+ft\b', '100ft', name)
    name = name.replace(",", "")
    name = name.rstrip(".;,")
    name = re.sub(r'\s+', ' ', name)
    return name.strip()


def generate_slug(name: str) -> str:
    """Generate a URL-safe slug from a road name."""
    if not name:
        return ""
    normalized = normalize_road_name(name)
    slug = normalized.lower()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    slug = slug.strip("-")

    parts = slug.split("-")
    deduped = [parts[0]] if parts else []
    for p in parts[1:]:
        if p != deduped[-1]:
            deduped.append(p)
    return "-".join(deduped)
