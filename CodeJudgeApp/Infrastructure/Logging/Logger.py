import logging
import sys

class Logger:
    _instance = None

    def __init__(self):
        self.logger = logging.getLogger("CodeJudge")
        if not self.logger.handlers:
            self.logger.setLevel(logging.DEBUG)
            handler = logging.StreamHandler(sys.stdout)
            handler.setLevel(logging.DEBUG)
            formatter = logging.Formatter(
                "[%(asctime)s] [%(levelname)s] [CodeJudge] %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S"
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    @classmethod
    def get(cls) -> "Logger":
        if cls._instance is None:
            cls._instance = Logger()
        return cls._instance

    def debug(self, message: str):
        self.logger.debug(message)

    def info(self, message: str):
        self.logger.info(message)

    def warning(self, message: str):
        self.logger.warning(message)

    def error(self, message: str, exc: Exception = None):
        if exc:
            self.logger.error(f"{message} | Exception: {str(exc)}", exc_info=True)
        else:
            self.logger.error(message)
