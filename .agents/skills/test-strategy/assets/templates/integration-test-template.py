# Integration Test Template

import pytest


@pytest.fixture
def setup_dependencies():
    # Setup test DB or external stubs
    resources = ...
    yield resources
    # Teardown resources


def test_requirements_flow(setup_dependencies):  # covers: REQ-XX
    # Arrange
    ...

    # Act
    result = execute_workflow(...)

    # Assert
    assert result == expected
