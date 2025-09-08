# Blog development notes

Posts live in content/posts as Markdown (.md) with frontmatter.

Use the admin editor at /admin to create posts with a WYSIWYG (TipTap). The editor content is saved as Markdown on the server.

Authentication: basic credentials via iron-session. Set environment variables in .env.local:

ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
IRON_SESSION_PASSWORD=generate_a_random_32+_chars_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000

---
Redeploy note: Triggered redeploy at 2025-09-08T00:08Z to pick up Blob config.

