"""Builder registry — add new parsers here to make them discoverable.

Each entry is a class that inherits ``BaseLayoutParser`` and implements
``can_handle(page_info)`` and ``parse(table, division, config)``.

The registry is ordered: most-specific first, fallback (SingleRow) last.
"""

from .continuation import ContinuationParser
from .three_row import ThreeRowParser
from .mixed import MixedLayoutParser
from .single_row import SingleRowParser

REGISTRY = [
    ContinuationParser,
    ThreeRowParser,
    MixedLayoutParser,
    SingleRowParser,
]
