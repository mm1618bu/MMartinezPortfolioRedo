.PHONY: install install-dev format lint test test-cov clean help

help:
	@echo "Available commands:"
	@echo "  make install      - Install production dependencies"
	@echo "  make install-dev  - Install development dependencies"
	@echo "  make format       - Format code with black"
	@echo "  make lint         - Lint code with ruff"
	@echo "  make test         - Run tests with pytest"
	@echo "  make test-cov     - Run tests with coverage"
	@echo "  make clean        - Clean up cache and build files"

install:
	pip install -r requirements.txt

install-dev:
	pip install -r requirements-dev.txt

format:
	black python tests

lint:
	ruff check python tests

lint-fix:
	ruff check --fix python tests

test:
	pytest

test-cov:
	pytest --cov=python --cov-report=html --cov-report=term

clean:
	rm -rf .pytest_cache
	rm -rf .ruff_cache
	rm -rf htmlcov
	rm -rf .coverage
	rm -rf dist
	rm -rf build
	rm -rf *.egg-info
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
