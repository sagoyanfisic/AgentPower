# Common Security Antipatterns

## Hardcoded Secrets
```python
# Insecure
API_KEY = "sk_live_12345"

# Secure
import os
API_KEY = os.environ["API_KEY"]
```

## Silent `except` Blocks
```python
# Insecure
try:
    verify_token(token)
except Exception:
    pass

# Secure
try:
    verify_token(token)
except InvalidTokenError:
    raise PermissionDeniedError("Invalid token signature")
```

## SQL Concatenation
```python
# Insecure
query = f"SELECT * FROM users WHERE email = '{email}'"

# Secure
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
```

## Shell Command Injection
```python
# Insecure
subprocess.run(f"convert {filename} output.png", shell=True)

# Secure
subprocess.run(["convert", filename, "output.png"], shell=False)
```
