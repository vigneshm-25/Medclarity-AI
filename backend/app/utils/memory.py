import sys

def get_memory_usage_mb() -> float:
    """
    Returns current process RSS memory usage in megabytes (MB).
    Supports Linux (Render), macOS, and Windows.
    """
    try:
        import psutil
        process = psutil.Process()
        return process.memory_info().rss / (1024 * 1024)
    except Exception:
        try:
            import resource
            rusage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
            if sys.platform == "darwin":
                return rusage / (1024 * 1024)
            # On Linux ru_maxrss is returned in Kilobytes (KiB)
            return rusage / 1024.0
        except Exception:
            return 0.0
