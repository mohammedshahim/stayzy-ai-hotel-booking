"""Everything the widget's model may call.

Only what is listed here reaches the widget's model. No booking, cancel, favorite, or
review tool ever belongs in this folder — the widget can propose and navigate, but it
can never move money or write the user's data.
"""

from src.graphs.chat_widget.tools.propose_tools import (
    ProposeCompare,
    ProposeHotel,
    ProposeSearch,
)
from src.graphs.chat_widget.tools.search_tools import GetHotelDetails, SearchHotels

TOOL_SCHEMAS = [
    SearchHotels,
    GetHotelDetails,
    ProposeSearch,
    ProposeHotel,
    ProposeCompare,
]
