// Featured work (the horizontal rail). `gallery` is optional: when present the
// browser frame cycles through the screens, each with its own address-bar label.
export const projects = [
  {
    title: 'Ads Acceleration', category: 'Website + client dashboard / Full stack', year: '2025',
    description: 'The site and the console behind an Amazon PPC agency. Clients and staff sign in to read campaign performance, change budgets and bids, and launch new campaigns, without opening Amazon Ads.',
    tags: ['React', 'Cloudflare Workers', 'D1', 'Node.js'], image: '/projects/ads%20acceleration.jpg',
    gallery: [
      { src: '/projects/ads%20acceleration.jpg', label: 'adsacceleration.com', alt: 'Ads Acceleration agency website' },
      { src: '/projects/ads-dashboard-campaign.jpg', label: 'dashboard · campaign detail', alt: 'Ads Acceleration dashboard: campaign detail with a sales and spend chart' },
      { src: '/projects/ads-dashboard-campaigns.jpg', label: 'dashboard · campaigns', alt: 'Ads Acceleration dashboard: campaign list with spend, sales and ACOS' },
      { src: '/projects/ads-dashboard-controls.jpg', label: 'dashboard · budget & bids', alt: 'Ads Acceleration dashboard: campaign with budget and pause controls' },
      { src: '/projects/ads-dashboard-builder.jpg', label: 'dashboard · new campaign', alt: 'Ads Acceleration dashboard: new campaign builder, review step' },
    ],
    url: 'https://adsacceleration.com', color: 'var(--exp-card-1)', name: 'ads acceleration', mark: '↗',
  },
  {
    title: 'Paper Vault', category: 'Digital product / Full stack', year: '2025',
    description: 'Good knowledge deserves to be shared. A student-built library for discovering, uploading, and passing on academic material.',
    tags: ['React', 'Supabase', 'Cloudflare R2'], image: '/projects/Paper%20Vault.jpg',
    url: 'https://paper-vault-ivory.vercel.app/', color: 'var(--exp-card-2)', name: 'Paper Vault', mark: '¶',
  },
  {
    title: 'Notely — 10Pearls Shine', category: 'Internship project / MERN', year: '2026',
    description: 'Built for the 10Pearls Shine internship, Cohort 9. A note-taking app with rich text, live search, pinning and a 7-day trash. Plain SQL, 116 tests, and a passed SonarQube quality gate.',
    tags: ['React 19', 'Express 5', 'PostgreSQL'], image: '/projects/notely-dashboard.jpg',
    gallery: [
      { src: '/projects/notely-dashboard.jpg', label: 'notely · notes', alt: 'Notely dashboard with colourful note cards, pinned notes first' },
      { src: '/projects/notely-editor.jpg', label: 'notely · editor', alt: 'Notely rich-text note editor' },
    ],
    url: 'https://github.com/wasiqtanveer/10Pearls-Shine-Internship-Project-Cohort-9', color: 'var(--exp-card-3)', name: 'Notely / 10Pearls', mark: '✎',
  },
];

// Everything else. `words` is the typographic fallback shown when there is no image.
export const experiments = [
  { title: 'Graft', type: 'Product redesign / Full stack', description: 'A study of an AI image generator, rebuilt around one idea: the prompt is the artifact. Prompts fork like code and keep their lineage, with a real database and API behind them.', image: '/projects/graft.jpg', url: 'https://higgsfield-rebuild.vercel.app', words: ['WRITE', 'FORK', 'TRACE'] },
  { title: 'CR Attendance', type: 'Web application / Full stack', description: 'From a personal fix to a daily tool. An attendance app that makes life a little easier for class representatives.', image: '/projects/CR%20attendance%20app.jpg', url: 'https://crattendanceapp.vercel.app/login', words: ['MARK', 'COUNT', 'REPORT'] },
  { title: 'coldstart', type: 'Python / Automation', description: 'Brand name in, verified work email out. Finds the company, the person and the address format from public sources only, with no paid data vendor and no API key.', image: '/projects/coldstart.svg', url: 'https://github.com/wasiqtanveer/coldstart', words: ['FIND', 'LEARN', 'VERIFY'] },
  { title: 'Full Scale', type: 'Design concept / 3D', description: 'A furniture showroom drawn as an architect’s floor plan, one you walk through rather than scroll past.', image: '/projects/fullscale.jpg', url: 'https://wasiqtanveer.github.io/FullScale-Showroom/', words: ['DRAW', 'WALK', 'BUILD'] },
  { title: 'WhatsApp Moderation Bot', type: 'Automation', description: 'A pluggable rule engine that keeps group conversations in order.', image: '/projects/whats%20app%20bot.jpeg', url: 'https://github.com/wasiqtanveer/whatsapp-ai-moderator', words: ['MODERATE', 'AUTOMATE', 'SIMPLIFY'] },
  { title: 'Amazon Organic Rank Tracker', type: 'Python / GitHub Actions', description: 'Daily organic and sponsored positions for every keyword and ASIN, scraped on a schedule and logged straight into Google Sheets.', words: ['SEARCH', 'RANK', 'LOG'] },
  { title: 'Amazon BSR Tracker — Slack', type: 'Python / Slack', description: 'Daily product-rank updates that arrive in Slack, automatically.', image: '/projects/slack%20bsr.png', url: 'https://github.com/wasiqtanveer/bsr-tracker', words: ['RANK', 'TRACK', 'NOTIFY'] },
  { title: 'Amazon BSR Tracker — Sheets', type: 'Python / Google Sheets', description: 'A hands-free ranking dashboard, powered by Keepa, Python, and scheduled updates.', url: 'https://github.com/wasiqtanveer/bsr-tracker-sheets', words: ['TRACK', 'SYNC', 'REPEAT'] },
  { title: 'SQP Intelligence Dashboard', type: 'Browser tooling', description: 'Turning Amazon search reports into an interactive view of market share.', words: ['SEARCH', 'ANALYZE', 'COMPARE'] },
  { title: 'Ad Group History Chart', type: 'Data visualization', description: 'Performance history and change events, right inside Amazon Ads.', image: '/projects/Adgroup%20chart.jpg', words: ['CHART', 'TRACK', 'UNDERSTAND'] },
  { title: 'Library Management System', type: 'Web application', description: 'A React application for organizing library records and everyday library operations.', url: 'https://wasiqtanveer.github.io/Library-Management-System-V-1.0/', words: ['BORROW', 'RETURN', 'ORGANIZE'] },
];

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
/** "fourteen" for 14; falls back to digits past twenty. */
export const numberWord = (n) => NUMBER_WORDS[n] ?? String(n);
/** Zero-padded two-digit index: 4 -> "04", 14 -> "14". */
export const pad2 = (n) => String(n).padStart(2, '0');
