# SKILL: Monorepo Shared Core vs App Ownership Decision

## Purpose

Help decide **what to extract into shared packages** vs **what stays in the app**  
when working with **Electron + React** (or similar platforms) where ~90–95% of code is shared.

This skill optimizes for:

- Learning system design
- Minimizing long-term regret
- Safe experimentation
- Reversible decisions

---

## Default Philosophy

> **Extract early, unshare aggressively.**

Assume sharing is correct **until proven otherwise**,  
but make unsharing cheap and explicit.

---

## Core Assumptions

- Multiple apps already exist (≥2)
- Platforms are highly similar (Electron + Web)
- Differences are feature-level, not platform-level
- Developer wants to learn system design, not just ship

If any assumption is false → bias toward app ownership instead.

---

## Architecture Model

```txt
apps/
  web/
  desktop/
packages/
  core/        # domain + logic
  ui/          # shared UI primitives
  platform/    # thin adapters
```
