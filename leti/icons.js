const icons={ball:'<circle cx="12" cy="12" r="9"/><path d="m12 7 5 4-2 6H9l-2-6 5-4Zm0-4v4m9 4h-4m-2 6 2 3M9 17l-2 3M3 11h4"/>',pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',cup:'<path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v6m-4 2h8"/>',people:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v2"/>'};
icons.sprout='<path d="M7 20h10M12 20v-7m0 0C6 13 3 10 3 5c6 0 9 3 9 8Zm0-2c0-5 3-8 9-8 0 5-3 8-9 8Z"/>';
icons.theater='<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 7h18M8 7c0 5-2 7-5 8m13-8c0 5 2 7 5 8M8 7v13m8-13v13M2 20h20"/>';
icons.book='<path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15M5 7h4M5 11h4m6-4h4m-4 4h4"/>';
icons.tv='<rect x="3" y="7" width="18" height="14" rx="3"/><path d="m8 2 4 5 4-5M7 17h10"/>';
icons.map='<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>';
icons.chat='<path d="M21 11a8 8 0 0 1-8 8H7l-5 3 2-6a8 8 0 1 1 17-5Z"/><path d="M8 9h7m-7 4h5"/>';
icons.car='<path d="M3 16v-4l2-5h14l2 5v4M3 12h18M7 7l1-3h8l2 3M3 16h18"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/>';
icons.engine='<path d="M4 10h3l2-3h8l2 3h2v7h-3l-2 2H8l-2-2H4v-7Zm6-3V4m-3 0h6M1 12v3m2-1H1"/><circle cx="13" cy="13" r="2"/>';
icons.motorbike='<circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="m5 17 4-7 3 7H5m7 0 3-6h3l1 6m-4-6-2-3h-3m-1 2H7"/>';
icons.tools='<path d="M14 5a4 4 0 0 0-5 5L3 16a3 3 0 0 0 4 4l6-6a4 4 0 0 0 5-5l-3 3-3-3 2-4Z"/>';
icons.bird='<path d="M3 14c3-1 4-4 5-7 2 2 4 2 6 2 2 0 4 1 5 3l3 1-3 1c-1 4-5 6-9 5l-3 2 1-3c-2-1-4-2-5-4Z"/><path d="M9 12c2 3 5 3 7 1"/><circle cx="17" cy="11.5" r=".5"/>';
icons.camera='<path d="M3 7h4l2-3h6l2 3h4v13H3V7Z"/><circle cx="12" cy="13" r="4"/><path d="M18 10h.01"/>';
icons.music='<path d="M10 18V5l9-2v13M10 8l9-2"/><ellipse cx="7" cy="18" rx="3" ry="2"/><ellipse cx="16" cy="16" rx="3" ry="2"/>';
icons.compass='<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 5-4.8 2 2.2-5 4.8-2Z"/>';
icons.taxi='<path d="M4 16v-4l2-4h12l2 4v4H4Zm2-8 1-3h10l1 3M10 5V3h4v2M4 12h16"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/>';
export function icon(type){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[type]}</svg>`;}
