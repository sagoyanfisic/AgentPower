# Testing Pyramid — Level Examples

Illustrative examples per testing level.

## Level 1 — Unit Tests

Pure business logic without DB, network, or file system access. Fast and isolated.

```python
def calculate_total(items, discount_pct=0):
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    return subtotal * (1 - discount_pct / 100)

def test_calculate_total_no_discount():
    items = [{"price": 10, "quantity": 2}]
    assert calculate_total(items) == 20

def test_apply_percentage_discount():
    items = [{"price": 100, "quantity": 1}]
    assert calculate_total(items, discount_pct=10) == 90
```

## Level 2 — Integration Tests

Validates interaction across modules, databases, or external services.

```python
def test_book_appointment_saves_to_db(db_session, patient_factory):
    patient = patient_factory()
    result = book_appointment(db_session, patient_id=patient.id, date="2026-09-10T10:00")
    appointment = db_session.query(Appointment).filter_by(id=result.id).first()
    assert appointment is not None
    assert appointment.patient_id == patient.id
```

## Level 3 — E2E Tests

Covers critical business workflows end-to-end.

```python
def test_patient_can_book_appointment(page):
    page.goto("/login")
    page.fill("#email", "patient@test.com")
    page.fill("#password", "****")
    page.click("text=Login")
    page.click("text=Book Appointment")
    assert page.locator("text=Appointment Confirmed").is_visible()
```
