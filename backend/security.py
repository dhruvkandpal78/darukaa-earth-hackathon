"""Bounds authentication attempts to reduce password guessing on the single-worker service."""

from collections import OrderedDict, deque
from threading import Lock
from time import monotonic

attempts = OrderedDict()
lock = Lock()


def allow_auth_attempt(address: str) -> bool:
    """Allow ten attempts per minute per client; cap memory so random addresses cannot exhaust it."""
    now = monotonic()
    with lock:
        history = attempts.setdefault(address, deque())
        while history and history[0] < now - 60:
            history.popleft()
        attempts.move_to_end(address)
        if len(attempts) > 10000:
            attempts.popitem(last=False)
        if len(history) >= 10:
            return False
        history.append(now)
        return True
