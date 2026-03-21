# Markilius — Design & Development Identity

> *Marcus + Aurelius. Your identity made visible.*

This document is the source of truth for every design and engineering decision in this repo. Before building a component, writing a copy string, or choosing a colour — check here first.

---

## 1. What This App Is

Markilius is a **consistency mirror**. It shows the user who they actually are, not who they think they are.

- **It is not** a to-do app
- **It is not** a productivity tracker
- **It is not** a habit streaker

It is a mirror. The task list is the **input**. The heatmap is the **output**. Everything else is in service of that.

---

## 2. The User (Marcus)

We call our primary user "Marcus" — named after Marcus Aurelius.

| | |
|---|---|
| **He is** | Someone serious about who he's becoming |
| **He is not** | Someone who needs help managing tasks |
| **His question** | Am I actually showing up, or just planning to? |
| **His pain** | Knowing he said he would, and didn't |
| **His reward** | A green month that feels earned |
| **His share moment** | His monthly review — his numbers told back to him plainly |

Marcus does not need encouragement. He does not need gamification. He needs the truth.

---

## 3. The Philosophy

Inspired directly by Marcus Aurelius and the Stoic practice of **prosoche** — unflinching attention to oneself.

The Meditations were not written for an audience. They were a private mirror — a daily confrontation with the gap between who Marcus was and who he intended to be. Markilius is that mirror made digital.

**Core beliefs:**
- A grey week is an honest conversation you need to have with yourself — not a failure state
- No judgment from the app. Just truth.
- The heatmap is not data. It is identity made visible.
- A green month feels like something you earned. That feeling changes behaviour.

---

## 4. The Voice

The app speaks like a **training partner, not a secretary**. It is direct, honest, and calm. It does not motivate. It does not guilt. It reflects.

### Copy Rules

**Never write like a secretary:**
```
❌ You have 3 tasks due today.
✅ 3 things stand between you and a perfect day.
```

**Never write like a cheerleader:**
```
❌ Great job! You completed 5 tasks this week!
✅ You showed up for Fitness every day. You skipped Learning after the 3rd.
```

**Never judge:**
```
❌ You missed 4 days. Try harder next week.
✅ March: 60% consistent. That's your number.
```

**Never add fluff to the monthly review:**
```
❌ What an incredible month of growth and learning!
✅ Best week: March 2nd. Worst week: March 23rd. Most completed: Fitness.
```

### Tone Checklist

Before shipping any copy, ask:
- Does it sound like a training partner or a secretary?
- Does it tell the truth or does it soften it?
- Does it respect Marcus's intelligence?
- Could it be shorter?

---

## 5. The Hero Feature

**The heatmap is the hero. Build every feature in service of it.**

- The year view heatmap is the **first thing Marcus sees** when he opens the app — not today's tasks
- The task list exists to feed the heatmap — it is the input, not the product
- The heatmap breaks down by **day and by arena** — not just overall consistency
- The public profile is a **shareable heatmap** — proof of work, identity made visible

### What "Hero Feature" Means in Practice

- The heatmap gets the most screen real estate
- Loading states prioritise getting heatmap data first
- Navigation defaults to the heatmap view, not the task list
- Marketing screenshots lead with the heatmap

---

## 6. Task Locking

Once a task's deadline passes, **that task is permanently locked**. It cannot be completed, edited, or deleted.

This is not a technical constraint. It is a philosophical one.

### Why It Exists

Marcus Aurelius did not rewrite his past. The Meditations were honest precisely because they could not be revised after the fact. Markilius applies the same principle: your record is your record. You cannot go back and complete something you failed to do. You cannot quietly delete the evidence.

This is the accountability layer. Not from the app — from yourself.

### Rules

- A task locks **the moment its deadline passes** — no grace period
- Locked tasks are **visible in the heatmap** as missed — they contribute to your consistency score
- Locked tasks **cannot be completed, edited, or deleted** — by anyone, including the account owner
- Locked tasks are **permanent in your history** — archived but always present in past data
- The UI makes locked tasks visually distinct — they are not hidden, not faded into nothing

### Copy for Locked State

```
❌ This task has expired. Complete it to keep your streak!
✅ This task is locked. The deadline passed.
```

No explanation needed beyond that. Marcus knows what he set and what he didn't do.

### What This Feature Is Not

- Not a punishment — it is a mirror
- Not designed to make Marcus feel bad — it is designed to make him honest
- Not overridable by an admin setting or premium tier — the lock is absolute

### Design Treatment

- Locked task cards show a subtle lock indicator — not dramatic, not punishing
---

## 7. The Arena System

Arenas are life pillars — the categories that give a task meaning beyond just "done."

### Rules

- **Every task requires an arena tag** — no exceptions, no untagged tasks
- Arenas are **renamable, recolorable, and archivable** at any time
- **Archived arenas keep their historical data** — Marcus can see he was a runner in 2024 even if he's moved on
- Arenas should feel like a discovery, not a commitment
- The user cannot have more than 8 arenas at the same time

### Default Suggested Arenas

```
Miscellaneous · Fitness · Learning · Work · Creativity · Mindfulness
```

These are suggestions only. Marcus can pick any, edit the names, add his.

### Arena Colours

In addition to the brand color: `#f97316`

Arena colours are the **only colour system in the app**. No other decorative colour should exist in the UI. Colour = arena. Always.

---

## 8. Design Principles

### 8.1 Visual Direction

**Clean and minimal.** Reference: Notion, Linear, Vercel.

- Generous whitespace
- No decorative elements that don't carry meaning
- Typography does the heavy lifting
- The heatmap grid is the only complex visual element — everything else is simple

### 8.2 Colour

| Use | Rule |
|---|---|
| Arena colours | The only source of colour in the UI |
| Background | Near-black or off-white — no pure #000 or #fff |
| Text | High contrast, minimal hierarchy levels |
| Accent | Derived from arena colour of the active context |
| Status (success/error) | green/red |

**Do not** introduce colours outside the arena system for decorative purposes.

### 8.3 Typography

- One typeface family throughout
- Weight variation over size variation for hierarchy
- No decorative or display fonts in the app UI (landing page is a separate context)
- Copy is always left-aligned — never centered in data views

### 8.4 Layout
- **4 main pages** — Dashboard page (today page), week page, month page, and
year page
- **Year heatmap view** — full width, dominant, above the fold
- **Arena breakdown** — supports the heatmap, never competes with it

### 8.5 Components

#### Heatmap Cell
- Size consistent across all views
- Intensity = consistency level for that day
- Empty cells are visible — grey is not invisible, it is meaningful

### 8.6 Motion & Interaction

- **No celebration animations** — no confetti, no streak flames, no level-up sounds
- **Subtle transitions only** — the app is calm and honest
- Heatmap loads with a quiet fade — not a dramatic entrance
- Form interactions are instant — no loading spinners for local state

---

## 9. Onboarding

### The One Question

Onboarding asks one question:

> **"What are you working on becoming?"**

Not "what's your first task." Not "set up your profile." The question anchors Marcus in his identity before he touches a task.

### Flow

1. Name + email
2. **"What are you working on becoming?"** — free text, optional but encouraged
3. Arena selection — suggested defaults, fully optional, skippable
4. First task — optional, skippable
5. Land on the heatmap view — empty but present

The empty heatmap is not a failure state. It is a blank canvas. The copy here matters:

```
❌ You haven't logged anything yet. Add your first task!
✅ This is your record. It starts today.
```

## 10. The Monthly Review

The monthly review is Marcus's record for the month — delivered by email on the 1st of every month, and always available as a shareable card inside the app.

It is not a notification. It is not a nudge. It is a delivery of his own data.

### Delivery

- **Delivered by email** on the 1st of every month — not a push notification, not an in-app alert
- **Also accessible in-app** as a shareable card — designed to be screenshotted and shared
- **Sent from** `noreply@markilius.com` via Resend
- **Subject line:** `Your Month — March 2026` — no emoji, no exclamation marks
- **Opt-out available** — Marcus can turn it off, but it is on by default
- **Not sent** if the user logged zero activity that month — silence is more honest than an empty report

### Rules

- **Auto-generated** — no manual input required
- **Stats-only** — no AI-generated insight, no motivational language
- **Honest** — if March was bad, say so plainly
- **One CTA only** — link back to the full heatmap, no upsells

### Data Points to Surface

- Overall consistency % for the month
- Best week (date range + %) based on percentage completion then highest time spent on tasks
- Worst week (date range + %) based on percentage completion then highest time spent on tasks
- Most completed arena
- Most neglected arena
- Total tasks completed
- Time logged overall and per arena
- One plain sentence — derived from the data, not written by AI


## 11. The Weekly Review

The weekly review is Marcus's record for the week — delivered by email every Sunday morning, before the new week begins.

It is not a notification. It is not a nudge. It is a delivery of his own data.

### Delivery

- **Delivered by email** every Sunday morning — not a push notification, not an in-app alert
- **Sent from** `noreply@markilius.com` via Resend
- **Subject line:** `Your Week — Mar 17–23` — no emoji, no exclamation marks
- **Opt-out available** — Marcus can turn it off, but it is on by default
- **Not sent** if the user logged zero activity that week — silence is more honest than an empty report

### Rules

- **Auto-generated** — no manual input required
- **Stats-only** — no AI-generated insight, no motivational language
- **Honest** — if the week was bad, say so plainly
- **One CTA only** — link back to the full heatmap, no upsells

### Data Points to Surface

- Overall consistency % for the week
- Tasks completed vs tasks created
- Arenas shown up for
- Arenas missed entirely
- Best day, worst day. based on percentage completion then highest time spent on tasks
- Time logged
- One plain sentence — derived from the data, not written by AI


## 12. Public Profile

- Optional shareable link: `markilius.com/u/uuid`
- Shows the user's heatmap — year view, read-only
- Arena breakdown visible if user opts in
- No follower counts, no social mechanics
- It is a **proof of work page**, not a social profile

---

## 13. What We Do Not Build

These are explicit non-goals. If a feature request touches one of these, return to this document first.

| We do not build | Why |
|---|---|
| Streak counters with flames or badges | Gamification undermines honest reflection |
| Push notifications that guilt | The app does not chase Marcus |
| Social feed or follower system | This is a mirror, not a network |
| AI-generated motivational copy | Truth only — no fluff |
| Daily reminders by default | Marcus decides when he shows up |
| Points, levels, or rewards | The green heatmap is the only reward |
| "You're on a 7-day streak!" banners | The heatmap shows this without celebrating it |

---

## 14. The Name

**Markilius** = Marcus + Aurelius, compressed into one word.

The name is not explained in the UI. It does not need to be. The product tells the story.

- Domain: `markilius.com`
- GitHub: `github.com/markiliusapp`
- Email: `support@markilius.com`


---

*Last updated: March 2026*
*This document lives in the repo root. Update it before updating the product.*
