<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Live Matches Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:ital,wght@0,400..700;1,400..700&amp;family=Inter:wght@100..900&amp;family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "inverse-primary": "#4ae176",
                      "on-primary-container": "#004b1e",
                      "on-tertiary": "#ffffff",
                      "tertiary-container": "#9dadc6",
                      "surface": "#f7f9fb",
                      "inverse-on-surface": "#eff1f3",
                      "primary-fixed": "#6bff8f",
                      "surface-container-lowest": "#ffffff",
                      "surface-tint": "#006e2f",
                      "on-primary-fixed": "#002109",
                      "on-secondary-fixed": "#131b2e",
                      "surface-variant": "#e0e3e5",
                      "on-primary-fixed-variant": "#005321",
                      "surface-container": "#eceef0",
                      "primary": "#006e2f",
                      "background": "#f7f9fb",
                      "inverse-surface": "#2d3133",
                      "on-secondary": "#ffffff",
                      "secondary": "#565e74",
                      "secondary-fixed": "#dae2fd",
                      "on-surface-variant": "#3d4a3d",
                      "on-secondary-fixed-variant": "#3f465c",
                      "outline": "#6d7b6c",
                      "tertiary": "#505f76",
                      "on-tertiary-fixed-variant": "#38485d",
                      "on-secondary-container": "#5c647a",
                      "secondary-fixed-dim": "#bec6e0",
                      "primary-container": "#22c55e",
                      "surface-dim": "#d8dadc",
                      "on-tertiary-fixed": "#0b1c30",
                      "on-background": "#191c1e",
                      "surface-container-highest": "#e0e3e5",
                      "primary-fixed-dim": "#4ae176",
                      "secondary-container": "#dae2fd",
                      "on-tertiary-container": "#314156",
                      "surface-bright": "#f7f9fb",
                      "on-surface": "#191c1e",
                      "error": "#ba1a1a",
                      "error-container": "#ffdad6",
                      "tertiary-fixed": "#d3e4fe",
                      "surface-container-low": "#f2f4f6",
                      "on-primary": "#ffffff",
                      "surface-container-high": "#e6e8ea",
                      "outline-variant": "#bccbb9",
                      "on-error-container": "#93000a",
                      "tertiary-fixed-dim": "#b7c8e1",
                      "on-error": "#ffffff"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "md": "16px",
                      "margin-desktop": "32px",
                      "xl": "40px",
                      "lg": "24px",
                      "margin-mobile": "16px",
                      "gutter": "20px",
                      "base": "4px",
                      "sm": "8px",
                      "xs": "4px"
              },
              "fontFamily": {
                      "body-md": [
                              "Inter"
                      ],
                      "status-badge": [
                              "Inter"
                      ],
                      "headline-lg-mobile": [
                              "Archivo Narrow"
                      ],
                      "headline-md": [
                              "Archivo Narrow"
                      ],
                      "label-caps": [
                              "JetBrains Mono"
                      ],
                      "display-score-mobile": [
                              "Archivo Narrow"
                      ],
                      "display-score": [
                              "Archivo Narrow"
                      ],
                      "body-lg": [
                              "Inter"
                      ],
                      "headline-lg": [
                              "Archivo Narrow"
                      ]
              },
              "fontSize": {
                      "body-md": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "400"
                              }
                      ],
                      "status-badge": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "600"
                              }
                      ],
                      "headline-lg-mobile": [
                              "24px",
                              {
                                      "lineHeight": "32px",
                                      "fontWeight": "700"
                              }
                      ],
                      "headline-md": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ],
                      "label-caps": [
                              "12px",
                              {
                                      "lineHeight": "16px",
                                      "letterSpacing": "0.05em",
                                      "fontWeight": "600"
                              }
                      ],
                      "display-score-mobile": [
                              "36px",
                              {
                                      "lineHeight": "36px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "700"
                              }
                      ],
                      "display-score": [
                              "48px",
                              {
                                      "lineHeight": "48px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "700"
                              }
                      ],
                      "body-lg": [
                              "18px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "400"
                              }
                      ],
                      "headline-lg": [
                              "32px",
                              {
                                      "lineHeight": "40px",
                                      "letterSpacing": "-0.01em",
                                      "fontWeight": "700"
                              }
                      ]
              }
      },
          },
        }
    </script>
<style>
        .score-update {
            animation: pulse-score 1.5s ease-out;
        }
        @keyframes pulse-score {
            0% { color: theme('colors.primary-container'); text-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }
            100% { color: inherit; text-shadow: none; }
        }
        .live-dot {
            animation: blink 1.5s infinite;
        }
        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }
        /* Custom scrollbar for subtle appearance */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: theme('colors.surface-variant');
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: theme('colors.outline');
        }
    </style>
</head>
<body class="bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col pt-16 pb-16 md:pb-0 md:pl-64">
<!-- TopNavBar -->
<header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 bg-surface border-b border-outline-variant shadow-sm transition-all duration-300">
<div class="flex items-center gap-md">
<!-- Mobile Menu Toggle (simulated) -->
<button class="md:hidden text-on-surface-variant hover:text-primary transition-colors duration-200">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">menu</span>
</button>
<h1 class="text-headline-md font-headline-md font-bold text-primary tracking-tight md:ml-0 ml-sm">COURTSIDE LIVE</h1>
</div>
<div class="flex-1 max-w-md mx-md hidden md:block">
<div class="relative">
<span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" style="font-variation-settings: 'FILL' 0;">search</span>
<input class="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-xl py-sm pr-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all duration-200 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant" placeholder="Search by team..." type="text"/>
</div>
</div>
<div class="flex items-center gap-md text-primary">
<button class="text-primary hover:text-primary-fixed transition-colors duration-200">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">notifications</span>
</button>
<button class="text-primary hover:text-primary-fixed transition-colors duration-200">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">account_circle</span>
</button>
</div>
</header>
<!-- SideNavBar (Desktop) -->
<nav class="h-screen w-64 hidden md:flex flex-col bg-surface-container-low border-r border-outline-variant fixed top-0 left-0 pt-16 z-40">
<div class="flex flex-col gap-sm p-md">
<!-- Profile Summary -->
<div class="flex items-center gap-md mb-lg p-sm rounded-lg hover:bg-surface-variant transition-colors cursor-pointer">
<div class="w-10 h-10 rounded-full bg-surface-variant overflow-hidden border border-outline-variant flex items-center justify-center">
<span class="material-symbols-outlined text-on-surface-variant" style="font-variation-settings: 'FILL' 1;">person</span>
</div>
<div>
<div class="font-body-md text-body-md font-bold text-on-surface">Premium Member</div>
<div class="font-label-caps text-label-caps text-on-surface-variant">Pro Observer</div>
</div>
</div>
<!-- Nav Items -->
<a class="bg-secondary-container text-on-secondary-container rounded-lg font-bold flex items-center gap-md p-sm scale-[0.98] transition-transform" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">dashboard</span>
<span class="font-label-caps text-label-caps">Dashboard</span>
</a>
<a class="text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all flex items-center gap-md p-sm" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">workspace_premium</span>
<span class="font-label-caps text-label-caps">Leagues</span>
</a>
<a class="text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all flex items-center gap-md p-sm" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">groups</span>
<span class="font-label-caps text-label-caps">Teams</span>
</a>
<a class="text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all flex items-center gap-md p-sm" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">leaderboard</span>
<span class="font-label-caps text-label-caps">Statistics</span>
</a>
<a class="text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all flex items-center gap-md p-sm" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">settings</span>
<span class="font-label-caps text-label-caps">Settings</span>
</a>
<div class="mt-auto pt-lg border-t border-outline-variant">
<button class="w-full py-sm bg-on-secondary-fixed text-on-primary font-label-caps text-label-caps rounded-lg hover:bg-tertiary transition-colors">Upgrade to Pro</button>
</div>
</div>
</nav>
<!-- Main Content Canvas -->
<main class="flex-1 w-full max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg overflow-y-auto">
<!-- Mobile Search (Visible only on small screens) -->
<div class="mb-lg md:hidden relative">
<span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" style="font-variation-settings: 'FILL' 0;">search</span>
<input class="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-xl py-sm pr-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all duration-200 font-body-md text-body-md text-on-surface" placeholder="Search by team..." type="text"/>
</div>
<!-- Filter Chips -->
<div class="flex items-center gap-sm overflow-x-auto pb-sm mb-xl no-scrollbar border-b border-outline-variant">
<button class="px-md py-sm bg-surface-variant text-on-surface rounded-full font-label-caps text-label-caps hover:bg-on-secondary-fixed hover:text-on-primary transition-colors whitespace-nowrap">
                All Matches
            </button>
<button class="px-md py-sm bg-on-secondary-fixed text-on-primary rounded-full font-label-caps text-label-caps shadow-sm whitespace-nowrap flex items-center gap-xs">
<span class="w-2 h-2 rounded-full bg-primary-container live-dot"></span>
                Live Matches
            </button>
<button class="px-md py-sm bg-surface-variant text-on-surface rounded-full font-label-caps text-label-caps hover:bg-on-secondary-fixed hover:text-on-primary transition-colors whitespace-nowrap">
                Finished Matches
            </button>
</div>
<!-- Dashboard Grid (Matches) -->
<div class="grid grid-cols-1 xl:grid-cols-2 gap-xl">
<!-- Live Match Card 1 -->
<div class="bg-surface-container-lowest rounded-lg shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-outline-variant overflow-hidden hover:shadow-[0px_8px_30px_rgba(15,23,42,0.08)] transition-shadow duration-300"><div class="p-md flex flex-col gap-md"><div class="flex justify-between items-center border-b border-surface-variant pb-sm"><div class="flex items-center gap-sm bg-primary-container text-on-primary px-sm py-xs rounded font-status-badge text-status-badge"><span class="w-1.5 h-1.5 rounded-full bg-on-primary live-dot"></span>LIVE</div><div class="flex flex-col items-end"><div class="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-xs"><span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 0;">schedule</span>Q4 02:14</div><div class="text-label-caps font-label-caps text-on-surface-variant opacity-70">Tip-off: 7:30 PM</div></div></div><div class="flex justify-between items-center py-md"><div class="flex flex-col items-center gap-sm flex-1"><div class="w-16 h-16 rounded-full bg-surface-variant overflow-hidden border border-outline-variant flex items-center justify-center"><span class="material-symbols-outlined text-tertiary text-2xl" style="font-variation-settings: 'FILL' 0;">sports_basketball</span></div><span class="font-body-md text-body-md font-bold text-on-surface text-center">Golden State Warriors</span><span class="font-label-caps text-label-caps text-on-surface-variant">GSW</span></div><div class="flex flex-col items-center px-lg"><div class="flex items-baseline gap-md"><span class="font-display-score text-display-score md:text-display-score text-display-score-mobile font-display-score-mobile text-on-surface score-update">112</span><span class="text-on-surface-variant text-body-md">-</span><span class="font-display-score text-display-score md:text-display-score text-display-score-mobile font-display-score-mobile text-on-surface">108</span></div></div><div class="flex flex-col items-center gap-sm flex-1"><div class="w-16 h-16 rounded-full bg-surface-variant overflow-hidden border border-outline-variant flex items-center justify-center"><span class="material-symbols-outlined text-tertiary text-2xl" style="font-variation-settings: 'FILL' 0;">sports_basketball</span></div><span class="font-body-md text-body-md font-bold text-on-surface text-center">Los Angeles Lakers</span><span class="font-label-caps text-label-caps text-on-surface-variant">LAL</span></div></div><div class="bg-surface-container-low rounded-md p-sm border border-outline-variant overflow-x-auto"><table class="w-full text-center text-label-caps font-label-caps text-on-surface"><thead><tr class="text-on-surface-variant border-b border-surface-variant"><th class="py-1 font-normal text-left pl-2">Team</th><th class="py-1 font-normal w-10">Q1</th><th class="py-1 font-normal w-10">Q2</th><th class="py-1 font-normal w-10">Q3</th><th class="py-1 font-normal w-10">Q4</th><th class="py-1 font-normal w-10 font-bold text-on-surface">T</th></tr></thead><tbody><tr class="border-b border-surface-variant"><td class="py-1 text-left pl-2 font-bold">GSW</td><td class="py-1">28</td><td class="py-1">32</td><td class="py-1">26</td><td class="py-1 font-bold text-primary-container">26</td><td class="py-1 font-bold">112</td></tr><tr><td class="py-1 text-left pl-2 font-bold">LAL</td><td class="py-1">24</td><td class="py-1">30</td><td class="py-1">34</td><td class="py-1 font-bold text-primary-container">20</td><td class="py-1 font-bold">108</td></tr></tbody></table></div></div></div>
<!-- Live Match Card 2 -->
<div class="bg-surface-container-lowest rounded-lg shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-outline-variant overflow-hidden hover:shadow-[0px_8px_30px_rgba(15,23,42,0.08)] transition-shadow duration-300"><div class="p-md flex flex-col gap-md"><div class="flex justify-between items-center border-b border-surface-variant pb-sm"><div class="flex items-center gap-sm bg-primary-container text-on-primary px-sm py-xs rounded font-status-badge text-status-badge"><span class="w-1.5 h-1.5 rounded-full bg-on-primary live-dot"></span>LIVE</div><div class="flex flex-col items-end"><div class="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-xs"><span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 0;">schedule</span>Q2 05:42</div><div class="text-label-caps font-label-caps text-on-surface-variant opacity-70">Tip-off: 7:00 PM</div></div></div><div class="flex justify-between items-center py-md"><div class="flex flex-col items-center gap-sm flex-1"><div class="w-16 h-16 rounded-full bg-surface-variant overflow-hidden border border-outline-variant flex items-center justify-center"><span class="material-symbols-outlined text-tertiary text-2xl" style="font-variation-settings: 'FILL' 0;">sports_basketball</span></div><span class="font-body-md text-body-md font-bold text-on-surface text-center">Miami Heat</span><span class="font-label-caps text-label-caps text-on-surface-variant">MIA</span></div><div class="flex flex-col items-center px-lg"><div class="flex items-baseline gap-md"><span class="font-display-score text-display-score md:text-display-score text-display-score-mobile font-display-score-mobile text-on-surface">45</span><span class="text-on-surface-variant text-body-md">-</span><span class="font-display-score text-display-score md:text-display-score text-display-score-mobile font-display-score-mobile text-on-surface score-update">52</span></div></div><div class="flex flex-col items-center gap-sm flex-1"><div class="w-16 h-16 rounded-full bg-surface-variant overflow-hidden border border-outline-variant flex items-center justify-center"><span class="material-symbols-outlined text-tertiary text-2xl" style="font-variation-settings: 'FILL' 0;">sports_basketball</span></div><span class="font-body-md text-body-md font-bold text-on-surface text-center">Boston Celtics</span><span class="font-label-caps text-label-caps text-on-surface-variant">BOS</span></div></div><div class="bg-surface-container-low rounded-md p-sm border border-outline-variant overflow-x-auto"><table class="w-full text-center text-label-caps font-label-caps text-on-surface"><thead><tr class="text-on-surface-variant border-b border-surface-variant"><th class="py-1 font-normal text-left pl-2">Team</th><th class="py-1 font-normal w-10">Q1</th><th class="py-1 font-normal w-10">Q2</th><th class="py-1 font-normal w-10">Q3</th><th class="py-1 font-normal w-10">Q4</th><th class="py-1 font-normal w-10 font-bold text-on-surface">T</th></tr></thead><tbody><tr class="border-b border-surface-variant"><td class="py-1 text-left pl-2 font-bold">MIA</td><td class="py-1">25</td><td class="py-1 font-bold text-primary-container">20</td><td class="py-1 text-on-surface-variant">-</td><td class="py-1 text-on-surface-variant">-</td><td class="py-1 font-bold">45</td></tr><tr><td class="py-1 text-left pl-2 font-bold">BOS</td><td class="py-1">30</td><td class="py-1 font-bold text-primary-container">22</td><td class="py-1 text-on-surface-variant">-</td><td class="py-1 text-on-surface-variant">-</td><td class="py-1 font-bold">52</td></tr></tbody></table></div></div></div>
<!-- Finished Match Card -->
<div class="bg-surface-container-lowest rounded-lg shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-outline-variant overflow-hidden hover:shadow-[0px_8px_30px_rgba(15,23,42,0.08)] transition-shadow duration-300 opacity-80 hover:opacity-100"><div class="p-md flex flex-col gap-md"><div class="flex justify-between items-center border-b border-surface-variant pb-sm"><div class="flex items-center gap-sm bg-surface-variant text-tertiary px-sm py-xs rounded font-status-badge text-status-badge">FINISHED</div><div class="flex flex-col items-end"><div class="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-xs"><span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 0;">done</span>Final</div><div class="text-label-caps font-label-caps text-on-surface-variant opacity-70">Tip-off: 4:00 PM</div></div></div><div class="flex justify-between items-center py-md"><div class="flex flex-col items-center gap-sm flex-1 opacity-70"><div class="w-16 h-16 rounded-full bg-surface-variant overflow-hidden border border-outline-variant flex items-center justify-center"><span class="material-symbols-outlined text-tertiary text-2xl" style="font-variation-settings: 'FILL' 0;">sports_basketball</span></div><span class="font-body-md text-body-md font-bold text-on-surface text-center">Chicago Bulls</span><span class="font-label-caps text-label-caps text-on-surface-variant">CHI</span></div><div class="flex flex-col items-center px-lg"><div class="flex items-baseline gap-md"><span class="font-display-score text-display-score md:text-display-score text-display-score-mobile font-display-score-mobile text-on-surface-variant">98</span><span class="text-on-surface-variant text-body-md">-</span><span class="font-display-score text-display-score md:text-display-score text-display-score-mobile font-display-score-mobile text-on-surface font-bold">105</span></div><span class="font-label-caps text-label-caps text-tertiary mt-xs">PHI Wins</span></div><div class="flex flex-col items-center gap-sm flex-1"><div class="w-16 h-16 rounded-full bg-surface-variant overflow-hidden border border-outline-variant flex items-center justify-center border-primary-container border-2"><span class="material-symbols-outlined text-tertiary text-2xl" style="font-variation-settings: 'FILL' 0;">sports_basketball</span></div><span class="font-body-md text-body-md font-bold text-on-surface text-center">Philadelphia 76ers</span><span class="font-label-caps text-label-caps text-on-surface-variant">PHI</span></div></div><div class="bg-surface-container-low rounded-md p-sm border border-outline-variant overflow-x-auto"><table class="w-full text-center text-label-caps font-label-caps text-on-surface-variant"><thead><tr class="border-b border-surface-variant"><th class="py-1 font-normal text-left pl-2">Team</th><th class="py-1 font-normal w-10">Q1</th><th class="py-1 font-normal w-10">Q2</th><th class="py-1 font-normal w-10">Q3</th><th class="py-1 font-normal w-10">Q4</th><th class="py-1 font-normal w-10 font-bold text-on-surface">T</th></tr></thead><tbody><tr class="border-b border-surface-variant"><td class="py-1 text-left pl-2 font-bold">CHI</td><td class="py-1">22</td><td class="py-1">28</td><td class="py-1">25</td><td class="py-1">23</td><td class="py-1 font-bold">98</td></tr><tr><td class="py-1 text-left pl-2 font-bold text-on-surface">PHI</td><td class="py-1 text-on-surface">26</td><td class="py-1 text-on-surface">24</td><td class="py-1 text-on-surface">30</td><td class="py-1 text-on-surface">25</td><td class="py-1 font-bold text-on-surface">105</td></tr></tbody></table></div></div></div>
</div>
</main>
<!-- BottomNavBar (Mobile) -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 pb-safe bg-surface border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-xl md:hidden">
<a class="flex flex-col items-center justify-center text-primary font-bold scale-90 transition-transform duration-150 w-1/4 h-full hover:bg-surface-container" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">sensors</span>
<span class="font-label-caps text-label-caps mt-1">Live</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant w-1/4 h-full hover:bg-surface-container" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">scoreboard</span>
<span class="font-label-caps text-label-caps mt-1">Scores</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant w-1/4 h-full hover:bg-surface-container" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">format_list_numbered</span>
<span class="font-label-caps text-label-caps mt-1">Standings</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant w-1/4 h-full hover:bg-surface-container" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">person</span>
<span class="font-label-caps text-label-caps mt-1">Profile</span>
</a>
</nav>
</body></html>