---
trigger: always_on
alwaysApply: true
---

# Clean Code Principles (Always Apply)

The AI must **always** follow these rules to produce clean, readable, maintainable, and consistent code.

---

## 1. Naming Conventions
- Use **descriptive, meaningful names** that reveal intent.
- Variables/functions → `camelCase`
- Classes/Components → `PascalCase`
- Constants → `UPPER_SNAKE_CASE`
- Booleans → start with `is`, `has`, `should`, `can`.

✅ Good:
```javascript
const isUserAuthenticated = true;
class PaymentProcessor {}
```

❌ Bad:
```javascript
const flag = true;
class PP {}
```

---

## 2. Functions & Methods
- A function must do **one thing only**.
- Keep functions short (<20 lines ideally).
- Avoid side effects; keep them pure if possible.
- Max 3–4 parameters (use objects/structs if more needed).

✅ Good:
```python
def calculate_discount(price, discount_rate):
    return price * (1 - discount_rate)
```

❌ Bad:
```python
def cd(p, d, t, l, x):
    return p * (1 - d)
```

---

## 3. Classes & Modules
- **Single Responsibility Principle (SRP):** one reason to change.
- Keep classes small and cohesive.
- Group related functions logically.

✅ Good:
```java
class InvoicePrinter {
    void print(Invoice invoice) { ... }
}
```

❌ Bad:
```java
class InvoiceManager {
    void calculateTotals() { ... }
    void printInvoice() { ... }
    void sendOverEmail() { ... }
}
```

---

## 4. Code Formatting & Style
- Consistent indentation (2 or 4 spaces).
- Use trailing commas in multiline structures.
- Place `{}` braces consistently.
- Maximum line length: 100 characters.
- Remove unused imports/variables.

---

## 5. Comments
- Prefer **self-explanatory code** over comments.
- Comments must explain *why*, not *what*.
- Delete outdated, misleading, or redundant comments.

✅ Good:
```typescript
// Retry once because of transient network failures
await fetchWithRetry(url, { retries: 1 })
```

❌ Bad:
```typescript
// Call fetch
await fetch(url)
```

---

## 6. Error Handling
- Fail fast with clear error messages.
- Never swallow exceptions silently.
- Use typed/custom errors where possible.

✅ Good:
```go
if err != nil {
    return fmt.Errorf("failed to parse config: %w", err)
}
```

❌ Bad:
```go
if err != nil {
    return nil
}
```

---

## 7. Testing
- Always write **unit tests** for functions and modules.
- Follow Arrange → Act → Assert pattern.
- Include both **positive** and **negative** test cases.
- Avoid mocking too much—test real behavior where possible.

✅ Good:
```javascript
test("adds two numbers", () => {
  const result = add(2, 3);
  expect(result).toBe(5);
});
```

---

## 8. Documentation
- Each public class/module must have a **docstring or JSDoc**.
- Keep docs short, clear, and aligned with code.
- Update docs when code changes.

✅ Good:
```python
def fetch_user(user_id: str) -> User:
    """
    Fetch a user by ID from the database.
    Raises ValueError if the user does not exist.
    """
```

---

## 9. Performance & Efficiency
- Avoid unnecessary computations in loops.
- Prefer O(n) over O(n²) algorithms.
- Use caching/memoization for expensive operations.
- Don't prematurely optimize — keep clarity first.

✅ Good:
```javascript
const names = users.map(user => user.name);
```

❌ Bad:
```javascript
let names = [];
for (let i = 0; i < users.length; i++) {
  names.push(users[i].name);
}
```

---

## 10. Security
- Never log sensitive data (passwords, tokens).
- Use prepared statements / parameterized queries.
- Validate and sanitize all external input.
- Follow **principle of least privilege**.

✅ Good:
```python
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```

❌ Bad:
```python
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
```

---

## 11. Architectural Principles
- Apply **SOLID** principles.
- Follow DRY (Don't Repeat Yourself).
- Follow KISS (Keep It Simple, Stupid).
- Follow YAGNI (You Aren't Gonna Need It).
- Modularize code into reusable components.

---

## 12. General Practices
- Avoid "magic numbers" → use named constants.
- Keep dependencies minimal and up to date.
- Refactor code continuously; don't let debt accumulate.
- Always prefer clarity over clever tricks.

✅ Good:
```c
#define MAX_USERS 100
for (int i = 0; i < MAX_USERS; i++) { ... }
```

❌ Bad:
```c
for (int i = 0; i < 100; i++) { ... }
```

---

# Summary

All generated code must be:

- **Readable**: clear naming, proper formatting, minimal comments.
- **Maintainable**: modular, DRY, well-tested.
- **Robust**: error-handled, secure, and scalable.
- **Simple**: avoid unnecessary complexity.
```
