const icons={ball:'<circle cx="12" cy="12" r="9"/><path d="m12 7 5 4-2 6H9l-2-6 5-4Zm0-4v4m9 4h-4m-2 6 2 3M9 17l-2 3M3 11h4"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',cup:'<path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v6m-4 2h8"/>',people:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v2"/>'};
icons.sprout='<path d="M7 20h10M12 20v-7m0 0C6 13 3 10 3 5c6 0 9 3 9 8Zm0-2c0-5 3-8 9-8 0 5-3 8-9 8Z"/>';
icons.theater='<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 7h18M8 7c0 5-2 7-5 8m13-8c0 5 2 7 5 8M8 7v13m8-13v13M2 20h20"/>';
icons.book='<path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15M5 7h4M5 11h4m6-4h4m-4 4h4"/>';
icons.tv='<rect x="3" y="7" width="18" height="14" rx="3"/><path d="m8 2 4 5 4-5M7 17h10"/>';
icons.map='<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>';
icons.chat='<path d="M21 11a8 8 0 0 1-8 8H7l-5 3 2-6a8 8 0 1 1 17-5Z"/><path d="M8 9h7m-7 4h5"/>';
export function icon(type){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[type]}</svg>`;}
