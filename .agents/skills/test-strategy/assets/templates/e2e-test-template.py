# E2E Test Template (Critical Workflows Only)

def test_critical_business_flow(page):  # covers: REQ-XX (critical flow)
    # 1. Login / Initial State
    page.goto("/login")
    page.fill("#email", "user@test.com")
    page.fill("#password", "****")
    page.click("text=Login")

    # 2. Critical Action Steps
    page.click("text=<primary action>")

    # 3. User Observable Outcome
    assert page.locator("text=<expected confirmation>").is_visible()
