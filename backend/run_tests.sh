#!/bin/bash

echo "Running tests..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install dependencies
pip install -r requirements.txt

# Run tests with coverage
pytest --cov=app --cov-report=html --cov-report=term-missing -v

echo "Tests completed. Coverage report generated in htmlcov/"
