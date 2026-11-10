# Klyro Supabase Email Templates

Authentic, production-grade email templates designed to mirror Klyro's home page aesthetic and UI design system.

## Highlights
- **True Klyro Brand Styling**: Official logo (`https://klyro.live/klyro-logo-new.png`), authentic brand header with no artificial labels or badges, exact font hierarchy (`Space Grotesk`, `Inter`, sans-serif), and matching button styles (`#4F6EF7`).
- **Dynamic Light & Dark Theme in Gmail / Email Clients**:
  - **Light mode**: Clean `#F5F6FA` background, `#FFFFFF` card, `#D9DCE6` borders, `#14161C` text.
  - **Dark mode** (`@media (prefers-color-scheme: dark)` and `[data-ogsc]`): Automatically switches to Klyro dark mode (`#000000` background, `#1A1A1A` card, `#2E3148` borders, `#E8EAF0` text).
- **Direct & Human**: No generic AI fluff, no artificial emojis or glowing neon borders. Straightforward, professional developer workbench feel (similar to Linear, Vercel, Supabase).
- **Supabase Go Template Tags**: Fully wired with variables like `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}`, and `{{ .NewEmail }}`.

---

## Templates Directory

### Authentication (Excluding Invite User & Reauthentication)

| Topic | File | Recommended Subject | Variables Used |
| :--- | :--- | :--- | :--- |
| **Confirm sign up** | [`confirm-signup.html`](./confirm-signup.html) | `Confirm your email address` | `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}` |
| **Magic link or OTP** | [`magic-link.html`](./magic-link.html) | `Sign in to Klyro` | `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}` |
| **Change email address** | [`change-email.html`](./change-email.html) | `Confirm email address change` | `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .SiteURL }}` |
| **Reset password** | [`reset-password.html`](./reset-password.html) | `Reset your password` | `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}` |

### Security

| Topic | File | Recommended Subject | Variables Used |
| :--- | :--- | :--- | :--- |
| **Password changed** | [`password-changed.html`](./password-changed.html) | `Security alert: Password changed` | `{{ .Email }}`, `{{ .SiteURL }}` |
| **Email address changed** | [`email-changed.html`](./email-changed.html) | `Security alert: Email address changed` | `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .SiteURL }}` |
| **Phone number changed** | [`phone-changed.html`](./phone-changed.html) | `Security alert: Phone number changed` | `{{ .Email }}`, `{{ .SiteURL }}` |

---

## How to Apply in Supabase

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** &rarr; **Email Templates**.
3. Select each template tab from the list.
4. Copy the recommended **Subject** and paste the contents of the matching `.html` file into the **Message Body** editor.
5. Click **Save changes**.
