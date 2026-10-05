# Unit Test Template — Arrange / Act / Assert

def test_descriptive_case_name():  # covers: REQ-XX
    # Arrange: prepare minimal input data
    input_data = ...

    # Act: execute unit under test
    result = function_under_test(input_data)

    # Assert: verify expected result
    assert result == expected


def test_edge_case():  # covers: REQ-XX
    # Edge cases: empty, zero, boundary max values
    ...
