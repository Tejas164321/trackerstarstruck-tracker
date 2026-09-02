/* Starstruck Tracker
 * Reads public repository data from the GitHub REST API and shows how far
 * each repository is from the Starstruck achievement tiers.
 */

(function () {
  'use strict';

  var TIERS = [
    { stars: 16,   label: 'Starstruck' },
    { stars: 128,  label: 'Bronze' },
    { stars: 512,  label: 'Silver' },
    { stars: 4096, label: 'Gold' }
  ];

  var LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
    Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
    HTML: '#e34c26', CSS: '#563d7c', SCSS: '#c6538c', PHP: '#4F5D95',
    Ruby: '#701516', Go: '#00ADD8', Rust: '#dea584', Swift: '#F05138',
    Kotlin: '#A97BFF', Dart: '#00B4AB', Shell: '#89e051', Vue: '#41b883',
    Jupyter: '#DA5B0B', 'Jupyter Notebook': '#DA5B0B'
  };

  var form    = document.getElementById('search-form');
  var input   = document.getElementById('username');
  var results = document.getElementById('results');
  var toggle  = document.getElementById('theme-toggle');

  /* ----------------------------------------------------------- theming -- */

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('starstruck-theme', theme); } catch (e) { /* ignore */ }
  }

  var stored = null;
  try { stored = localStorage.getItem('starstruck-theme'); } catch (e) { /* ignore */ }

  if (stored) {
    applyTheme(stored);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }

  toggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  /* ---------------------------------------------------------- fetching -- */

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var raw = input.value.trim();
    // Accept a pasted profile URL or an @handle as well as a bare username.
    var user = raw.replace(/^@/, '').replace(/^https?:\/\/(www\.)?github\.com\//i, '').split('/')[0];

    if (!user) { return; }
    loadUser(user);
  });

  function loadUser(user) {
    showSkeleton();

    var profileUrl = 'https://api.github.com/users/' + encodeURIComponent(user);
    var reposUrl   = profileUrl + '/repos?per_page=100&sort=updated';

    Promise.all([request(profileUrl), request(reposUrl)])
      .then(function (data) {
        var profile = data[0];
        var repos = data[1]
          .filter(function (r) { return !r.fork; })
          .sort(function (a, b) { return b.stargazers_count - a.stargazers_count; });

        if (!repos.length) {
          showMessage('No original public repositories found for ' + escapeHtml(user) +
                      '. Forks are excluded because they do not count toward Starstruck.');
          return;
        }
        render(profile, repos);
      })
      .catch(function (error) {
        showError(error.message);
      });
  }

  function request(url) {
    return fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (res) {
        if (res.status === 404) {
          throw new Error('No GitHub account matches that username. Check the spelling and try again.');
        }
        if (res.status === 403 || res.status === 429) {
          throw new Error('GitHub rate limit reached. Unauthenticated requests are capped at 60 per hour — wait a while, then try again.');
        }
        if (!res.ok) {
          throw new Error('GitHub returned status ' + res.status + '. Try again in a moment.');
        }
        return res.json();
      })
      .catch(function (error) {
        if (error instanceof TypeError) {
          throw new Error('Could not reach api.github.com. Check your connection, or disable any extension blocking the request.');
        }
        throw error;
      });
  }

  /* --------------------------------------------------------- rendering -- */

  function render(profile, repos) {
    var best = repos[0].stargazers_count;
    var earned = TIERS.filter(function (t) { return best >= t.stars; });
    var next = TIERS.find(function (t) { return best < t.stars; });

    var line = next
      ? formatNumber(next.stars - best) + ' more ' + plural(next.stars - best, 'star') +
        ' on ' + escapeHtml(repos[0].name) + ' unlocks the ' + next.label + ' tier.'
      : 'Every Starstruck tier is unlocked.';

    var steps = TIERS.map(function (t) {
      return '<div class="tier-step' + (best >= t.stars ? ' reached' : '') + '">' +
             t.label + ' · ' + formatNumber(t.stars) + '</div>';
    }).join('');

    var summary =
      '<div class="summary">' +
        '<div class="summary-head">' +
          '<img class="summary-avatar" src="' + profile.avatar_url + '&s=64" alt="" width="32" height="32">' +
          '<span class="summary-name">' + escapeHtml(profile.name || profile.login) + '</span>' +
        '</div>' +
        '<span class="summary-count">' + formatNumber(best) +
          ' <span class="unit">stars on the best repository</span></span>' +
        '<p class="summary-line">' + earned.length + ' of 4 tiers earned. ' + line + '</p>' +
        '<div class="tier-track">' + steps + '</div>' +
      '</div>';

    var listHead =
      '<div class="list-head">' +
        '<h2>Repositories</h2>' +
        '<span>' + repos.length + ' owned, sorted by stars</span>' +
      '</div>';

    results.innerHTML = summary + listHead + repos.slice(0, 40).map(repoRow).join('');
  }

  function repoRow(repo) {
    var stars = repo.stargazers_count;
    var earned = stars >= 16;
    var target = TIERS.find(function (t) { return stars < t.stars; });
    var goal = target ? target.stars : TIERS[3].stars;
    var percent = Math.min(100, (stars / goal) * 100);

    var status = earned
      ? (target
          ? 'Starstruck earned. ' + formatNumber(goal - stars) + ' more ' +
            plural(goal - stars, 'star') + ' for ' + target.label + '.'
          : 'Every Starstruck tier is unlocked.')
      : (16 - stars) + ' more ' + plural(16 - stars, 'star') + ' to earn Starstruck.';

    var meta = [];
    if (repo.language) {
      var color = LANG_COLORS[repo.language] || null;
      meta.push('<span class="lang"><span class="lang-dot"' +
        (color ? ' style="background-color:' + color + '"' : '') + '></span>' +
        escapeHtml(repo.language) + '</span>');
    }
    meta.push('<span>Updated ' + relativeDate(repo.updated_at) + '</span>');

    return '' +
      '<article class="repo">' +
        '<div class="repo-head">' +
          '<a class="repo-name" href="' + repo.html_url + '" target="_blank" rel="noopener">' +
            escapeHtml(repo.name) + '</a>' +
          '<span class="repo-stars">' + starIcon() + formatNumber(stars) + '</span>' +
        '</div>' +
        (repo.description ? '<p class="repo-desc">' + escapeHtml(repo.description) + '</p>' : '') +
        '<div class="repo-meta">' + meta.join('') + '</div>' +
        '<div class="progress"><div class="progress-bar' + (earned ? ' is-earned' : '') +
          '" style="width:' + percent + '%"></div></div>' +
        '<p class="repo-status' + (earned ? ' is-earned' : '') + '">' + status + '</p>' +
      '</article>';
  }

  /* ------------------------------------------------------------ states -- */

  function showSkeleton() {
    var block =
      '<div class="skeleton">' +
        '<div class="skeleton-line w-40"></div>' +
        '<div class="skeleton-line w-70"></div>' +
        '<div class="skeleton-line w-100"></div>' +
      '</div>';
    results.innerHTML = block + block + block;
  }

  function showMessage(html) {
    results.innerHTML = '<div class="flash">' + html + '</div>';
  }

  function showError(message) {
    results.innerHTML = '<div class="flash flash-error">' + escapeHtml(message) + '</div>';
  }

  /* ----------------------------------------------------------- helpers -- */

  function starIcon() {
    return '<svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
      '<path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>';
  }

  function formatNumber(n) { return Number(n).toLocaleString('en-US'); }

  function plural(n, word) { return n === 1 ? word : word + 's'; }

  function relativeDate(iso) {
    var days = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (days < 1)   { return 'today'; }
    if (days === 1) { return 'yesterday'; }
    if (days < 30)  { return days + ' days ago'; }
    if (days < 365) { return Math.floor(days / 30) + ' months ago'; }
    var years = Math.floor(days / 365);
    return years + ' ' + plural(years, 'year') + ' ago';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
