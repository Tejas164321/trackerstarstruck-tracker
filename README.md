# Starstruck Tracker

Track how close your GitHub repositories are to the **Starstruck** achievement.

GitHub awards Starstruck when a repository you created reaches 16 stars, and upgrades the badge at 128, 512 and 4,096. This tool reads any public profile and shows the exact star gap for every repository you own.

**[Live demo →](https://tejas164321.github.io/trackerstarstruck-tracker//)**

`![Screenshot](docs/screenshot.png)` 

## Features

- Star gap for every owned repository, sorted highest first
- Progress bar toward the next tier, with all four tiers tracked
- Forks excluded, since they do not count toward the achievement
- Language colours and last-updated dates, matching GitHub conventions
- Light and dark themes using Primer colour tokens, following your system setting
- Accepts a bare username, an `@handle`, or a pasted profile URL
- No build step, no dependencies, no backend

## How the achievement works

| Tier | Stars required | Badge |
|------|---------------|-------|
| Base | 16 | Starstruck |
| x2 | 128 | Bronze |
| x3 | 512 | Silver |
| x4 | 4,096 | Gold |

Only repositories you created count. Stars on repositories you forked do not.

## Running locally

```bash
git clone https://github.com/Tejas164321/starstruck-tracker.git
cd starstruck-tracker
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Opening `index.html` directly from the filesystem also works in most browsers, but a local server avoids any `file://` restrictions.

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Select branch `main` and folder `/ (root)`, then **Save**.
5. The site goes live at `https://<username>.github.io/starstruck-tracker/` within a minute or two.

## Project structure

```
starstruck-tracker/
├── index.html          Page markup
├── assets/
│   ├── style.css       Primer-based theming, layout, components
│   └── app.js          API calls, rendering, error states
├── LICENSE
└── README.md
```

## API and rate limits

The tool calls two public endpoints:

```
GET https://api.github.com/users/{username}
GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated
```

No token is required and no data is stored or transmitted anywhere else. Unauthenticated requests are limited to **60 per hour per IP address**. If you hit the limit, wait an hour or run the tool from a different network.

## Troubleshooting

| Symptom | Cause |
|---------|-------|
| Nothing happens when you click Track | The page is open in a sandboxed preview that blocks scripts. Open it in a browser or deploy it. |
| "Could not reach api.github.com" | Network is offline, or an ad blocker is blocking the request. Try an incognito window. |
| "Rate limit reached" | More than 60 requests from your IP in the last hour. |
| A repository is missing | It is a fork, or it is private. Neither counts toward Starstruck. |

## Contributing

Issues and pull requests are welcome. If you are adding a language colour, keep it consistent with [github/linguist](https://github.com/github/linguist).

## License

MIT — see [LICENSE](LICENSE).

---

Not affiliated with GitHub. Built with the public GitHub REST API.
