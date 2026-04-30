---
name: refactoring
category: code
description: "Prompt template for restructuring existing code while preserving behavior"
recommended-techniques:
  - xml-structuring
  - constraint-specification
  - anti-hallucination
---

# Refactoring

## When to use

When you need an AI to restructure existing code without changing its external behavior. Works for improving readability, extracting abstractions, reducing duplication, migrating patterns, and improving testability.

## Structure

```
Refactor the following code.

<current-code>
{{current_code}}
</current-code>

<target-pattern>
{{target_pattern}}
</target-pattern>

<preserve>
{{must_preserve}}
</preserve>

<can-change>
{{allowed_changes}}
</can-change>

<verification>
{{verification_criteria}}
</verification>

<context>
{{context}}
</context>

{{refactoring_instruction}}
```

## Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| {{current_code}} | The code to refactor | The existing module or function |
| {{target_pattern}} | Desired structure or pattern after refactoring | "Extract strategy pattern for discount calculation" |
| {{must_preserve}} | Behavior and interfaces that must not change | "Public API signatures, error types, HTTP status codes" |
| {{allowed_changes}} | What is explicitly permitted to change | "Internal function names, file structure, private helpers" |
| {{verification_criteria}} | How to confirm the refactor is correct | "All existing tests must pass unchanged" |
| {{context}} | Why this refactoring is needed | "We need to add new discount types without modifying existing logic" |
| {{refactoring_instruction}} | Final directive with constraints | "Refactor the code. Do not add new features or fix bugs." |

## Example

```
Refactor the following code.

<current-code>
// pricing.go
func CalculatePrice(order Order) (Money, error) {
    base := order.BasePrice()
    
    var discount Money
    switch order.CustomerType {
    case "employee":
        discount = base.Multiply(0.30)
        if order.Total().GreaterThan(Money{Amount: 10000}) {
            discount = base.Multiply(0.35)
        }
    case "vip":
        discount = base.Multiply(0.20)
        if order.HasCoupon("VIP_EXTRA") {
            discount = discount.Add(base.Multiply(0.05))
        }
    case "wholesale":
        if order.Quantity() < 100 {
            discount = base.Multiply(0.10)
        } else if order.Quantity() < 1000 {
            discount = base.Multiply(0.15)
        } else {
            discount = base.Multiply(0.25)
        }
    case "regular":
        if order.HasCoupon("WELCOME10") {
            discount = base.Multiply(0.10)
        }
    default:
        return Money{}, fmt.Errorf("unknown customer type: %s", order.CustomerType)
    }
    
    final := base.Subtract(discount)
    if final.IsNegative() {
        final = Money{Amount: 0}
    }
    return final, nil
}
</current-code>

<target-pattern>
Extract a strategy pattern so each customer type's discount logic is an independent,
testable unit. New customer types should be addable without modifying CalculatePrice.
Use a registry map rather than a switch statement.
</target-pattern>

<preserve>
- The CalculatePrice function signature: func CalculatePrice(order Order) (Money, error)
- All current discount calculations produce identical results
- The error for unknown customer types
- The floor at zero (no negative prices)
</preserve>

<can-change>
- Internal structure, new types, new files
- Private function and type names
- The switch statement can be replaced entirely
</can-change>

<verification>
- These existing test cases must produce identical results:
  employee order $500 -> $350, employee order $15000 -> $9750
  vip order $200 no coupon -> $160, vip order $200 with VIP_EXTRA -> $150
  wholesale 50 units $1000 -> $900, wholesale 500 units $1000 -> $850
  regular with WELCOME10 $100 -> $90, regular no coupon $100 -> $100
  unknown type -> error
- New DiscountStrategy implementations must be unit-testable in isolation
</verification>

<context>
We are adding "partner" and "seasonal" customer types next quarter.
The current switch statement is already hard to review and test.
This refactor prepares the code for those additions.
</context>

Refactor the code. Do not add the new customer types — only restructure existing logic. Do not fix bugs or change behavior. Return the complete refactored file.
```
