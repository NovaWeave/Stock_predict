#!/usr/bin/env python3
"""
Test Runner for Stock Sentiment Analyzer

Discovers and runs all unit tests with proper configuration
and comprehensive reporting.
"""

import unittest
import sys
import os
from io import StringIO

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

def run_tests(verbosity=2, pattern='test_*.py'):
    """
    Run all tests with the specified pattern and verbosity.
    
    Args:
        verbosity: Level of detail in test output (0-2)
        pattern: Pattern to match test files
        
    Returns:
        TestResult object
    """
    # Discover tests
    loader = unittest.TestLoader()
    start_dir = os.path.dirname(__file__)
    suite = loader.discover(start_dir, pattern=pattern)
    
    # Configure test runner
    stream = StringIO()
    runner = unittest.TextTestRunner(
        stream=stream,
        verbosity=verbosity,
        buffer=True,
        warnings='ignore'
    )
    
    # Run tests
    print(f"Running tests from {start_dir}")
    print(f"Test pattern: {pattern}")
    print("-" * 70)
    
    result = runner.run(suite)
    
    # Print results
    print(stream.getvalue())
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped) if hasattr(result, 'skipped') else 0}")
    
    if result.failures:
        print(f"\nFAILURES ({len(result.failures)}):")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback.split('AssertionError:')[-1].strip()}")
    
    if result.errors:
        print(f"\nERRORS ({len(result.errors)}):")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback.split('Exception:')[-1].strip()}")
    
    success = len(result.failures) == 0 and len(result.errors) == 0
    status = "PASSED" if success else "FAILED"
    print(f"\nOverall result: {status}")
    
    return result


def run_specific_test(test_module):
    """
    Run a specific test module.
    
    Args:
        test_module: Name of the test module (e.g., 'test_sentiment_service')
    """
    try:
        suite = unittest.TestLoader().loadTestsFromName(test_module)
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        return result
    except Exception as e:
        print(f"Error running test module {test_module}: {e}")
        return None


def check_test_dependencies():
    """
    Check if all required dependencies for testing are available.
    
    Returns:
        List of missing dependencies
    """
    missing = []
    
    # Check core dependencies
    try:
        import unittest
    except ImportError:
        missing.append('unittest')
    
    try:
        from unittest.mock import Mock, patch
    except ImportError:
        missing.append('unittest.mock')
    
    # Check pandas (used in tests)
    try:
        import pandas
    except ImportError:
        missing.append('pandas')
    
    return missing


def main():
    """Main entry point for test runner"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Run Stock Sentiment Analyzer tests')
    parser.add_argument('--verbosity', '-v', type=int, default=2, choices=[0, 1, 2],
                       help='Test output verbosity (0=quiet, 1=normal, 2=verbose)')
    parser.add_argument('--pattern', '-p', default='test_*.py',
                       help='Pattern to match test files')
    parser.add_argument('--module', '-m', type=str,
                       help='Run specific test module (e.g., test_sentiment_service)')
    parser.add_argument('--check-deps', action='store_true',
                       help='Check test dependencies')
    
    args = parser.parse_args()
    
    # Check dependencies if requested
    if args.check_deps:
        print("Checking test dependencies...")
        missing = check_test_dependencies()
        if missing:
            print(f"Missing dependencies: {', '.join(missing)}")
            sys.exit(1)
        else:
            print("All dependencies are available.")
            return
    
    # Run specific module if specified
    if args.module:
        print(f"Running specific test module: {args.module}")
        result = run_specific_test(args.module)
        if result is None:
            sys.exit(1)
        sys.exit(0 if result.wasSuccessful() else 1)
    
    # Run all tests
    result = run_tests(verbosity=args.verbosity, pattern=args.pattern)
    
    # Exit with appropriate code
    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == '__main__':
    main()