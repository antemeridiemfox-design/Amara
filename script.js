/**
 * AMARA AESTHETICA - ENGINE (BUILD 3.5)
 */
const API_KEY = "AIzaSyCe5vrQox20KS4a-DcIBAdS6fHznrZDpcs";
const VIEWS = { HOME: 'HOME', FACE_MAP: 'FACE_MAP', CLINICS: 'CLINICS', BRANDS: 'BRANDS', ALTERNATIVES: 'ALTERNATIVES' };

// Replace this with your actual Google Form sharable link
const LOGIN_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe8tcbr3H3493wgv9tC4bLl-KAvI0pdAtXEMwZ9s1dx0ZjiSg/viewform?usp=publish-editor"; 

const BRAND_DATABASE = [
    { name: "Juvederm", manufacturer: "Allergan", logo: "https://logo.clearbit.com/allergan.com", fda: "Approved", longevity: "12-18 Months", description: "HA collection for volume and smoothing." },
    { name: "Restylane", manufacturer: "Galderma", logo: "https://logo.clearbit.com/galderma.com", fda: "Approved", longevity: "6-12 Months", description: "Natural-looking HA correction." }
];

const ZONES = [
    { 
        id: 'forehead', name: 'Forehead', risk: 'Moderate Risk Area', colorClass: 'risk-moderate',
        path: "M260,60 Q350,20 440,60 L430,120 Q350,140 270,120 Z", 
        risksFactor: "Supratrochlear and supraorbital arteries.", procedure: "Horizontal line correction and volume.", 
        risks: "Vascular compromise leading to skin necrosis.", saferAlternatives: "Micro-tox, specialized skin boosters." 
    },
    { 
        id: 'glabella', name: 'Glabella', risk: 'Severe Risk Area', colorClass: 'risk-severe',
        path: "M335,130 L365,130 L360,180 L340,180 Z",
        risksFactor: "Vascular occlusion, skin necrosis.", procedure: "Filler injection for frown lines.", 
        risks: "Blindness, severe permanent scarring.", saferAlternatives: "Botox, neurotoxin treatments." 
    },
    { 
        id: 'nose', name: 'Nose', risk: 'Severe Risk Area', colorClass: 'risk-severe',
        path: "M340,190 L360,190 L375,280 Q350,310 325,280 Z", 
        risksFactor: "High vascularity, terminal end-arteries.", procedure: "Non-surgical rhinoplasty.", 
        risks: "Blindness, extensive tissue death.", saferAlternatives: "Thread lifting, surgical rhinoplasty." 
    },
    { 
        id: 'lips', name: 'Lips', risk: 'Moderate Risk Area', colorClass: 'risk-moderate',
        path: "M280,420 Q350,400 420,420 Q420,440 350,460 Q280,440 280,420 Z", 
        risksFactor: "Superior and Inferior labial artery path.", procedure: "Lip augmentation and contouring.", 
        risks: "Swelling, asymmetry, bruising.", saferAlternatives: "Lip lift, lip blush, fat grafting." 
    }
];

let state = { view: VIEWS.HOME, selectedZone: null, selectedBrand: null, selectedClinic: null, clinicResults: [], isLoading: false, zoom: 1, map: null };

window.navTo = (v) => { state.view = v; state.selectedZone = null; state.selectedBrand = null; render(); };
window.onZoneClick = (id) => { state.selectedZone = ZONES.find(z => z.id === id); render(); };

// Redirect function for Google Form Login
window.handleLogin = () => {
    window.open(LOGIN_FORM_URL, '_blank');
};

window.getLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (p) => {
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude };
        state.isLoading = true; render();
        if (!state.map) {
            state.map = new google.maps.Map(document.getElementById("map-canvas"), { center: pos, zoom: 14, disableDefaultUI: true, gestureHandling: "greedy" });
            new google.maps.Marker({ position: pos, map: state.map, title: "You" });
        }
        const service = new google.maps.places.PlacesService(state.map);
        service.nearbySearch({ location: pos, radius: 5000, keyword: 'beauty clinic' }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                state.clinicResults = results;
                results.forEach(place => {
                    const marker = new google.maps.Marker({ position: place.geometry.location, map: state.map });
                    marker.addListener("click", () => { state.selectedClinic = place; render(); });
                });
            }
            state.isLoading = false; render();
        });
    });
};

function render() {
    const root = document.getElementById('app');
    const mapCanvas = document.getElementById('map-canvas');
    const vault = document.getElementById('persistent-map-vault');

    root.innerHTML = `
        <nav class="fixed top-0 left-0 right-0 z-50 bg-white border-b h-20 flex items-center px-6">
            <div class="max-w-7xl mx-auto w-full flex justify-between items-center">
                <div class="flex items-center gap-4 cursor-pointer" onclick="navTo('HOME')">
                    <img src="AMARA_Aesthetics.png" class="h-10 w-auto" alt="AMARA Logo">
                    <span class="font-serif text-2xl font-bold text-slate-900">AMARA Aesthetics</span>
                </div>
                <div class="flex gap-2">
                    ${['HOME', 'FACE_MAP', 'CLINICS', 'BRANDS', 'ALTERNATIVES'].map(v => `
                        <button onclick="navTo('${v}')" class="nav-link px-5 py-2 rounded-full text-[0.65rem] font-black uppercase tracking-widest ${state.view===v?'bg-rose-50 text-rose-700':'text-slate-400'}">${v.replace('_', ' ')}</button>
                    `).join('')}
                </div>
                <button onclick="handleLogin()" class="text-xs font-bold text-rose-600 border border-rose-100 px-6 py-2.5 rounded-full hover:bg-rose-50">Login</button>
            </div>
        </nav>
        <main class="pt-32 pb-20 px-6 min-h-screen animate-in">${renderView()}</main>
    `;

    if (state.view === VIEWS.CLINICS) {
        document.getElementById('map-mount-point').appendChild(mapCanvas);
    } else if (mapCanvas) {
        vault.appendChild(mapCanvas);
    }
    lucide.createIcons();
}

function renderView() {
    if (state.view === 'HOME') return `
        <div class="max-w-5xl mx-auto text-center py-20">
            <h1 class="text-8xl font-serif mb-8 leading-tight">Beauty should never <br>come at a <span class="text-rose-500 italic">cost.</span></h1>
            <p class="text-xl text-slate-500 mb-14 max-w-2xl mx-auto font-light leading-relaxed">The world's first clinical safety engine for facial aesthetics.</p>
            <div class="grid md:grid-cols-3 gap-8 text-left mb-20">
                <div class="p-10 bg-white border rounded-[3rem] shadow-sm"><i data-lucide="activity" class="text-rose-400 mb-6"></i><h3 class="text-xl font-bold mb-3">Risk Mapping</h3><p class="text-slate-400">Map arterial danger zones.</p></div>
                <div class="p-10 bg-white border rounded-[3rem] shadow-sm"><i data-lucide="search" class="text-medical-500 mb-6"></i><h3 class="text-xl font-bold mb-3">Verification</h3><p class="text-slate-400">Verify brand safety status.</p></div>
                <div class="p-10 bg-white border rounded-[3rem] shadow-sm"><i data-lucide="leaf" class="text-emerald-500 mb-6"></i><h3 class="text-xl font-bold mb-3">Alternatives</h3><p class="text-slate-400">Natural rejuvenation.</p></div>
            </div>
            <button onclick="navTo('FACE_MAP')" class="btn-primary px-16 py-5 rounded-full font-bold uppercase tracking-widest text-xs">Start Analysis</button>
        </div>`;

    if (state.view === 'FACE_MAP') return `
        <div class="flex flex-col lg:flex-row gap-12">
            <div class="lg:w-1/2 bg-white rounded-[3.5rem] p-10 border h-[700px] flex items-center justify-center relative overflow-hidden shadow-sm">
                <div class="face-map-viewport" style="transform: scale(${state.zoom})">
                    <svg viewBox="0 0 700 700" class="w-[700px] h-[700px]">
                        <image href="face_map.png" x="0" y="0" width="700" height="700" />
                        ${ZONES.map(z => `<path id="${z.id}" class="face-path ${state.selectedZone?.id===z.id?'active':z.colorClass}" d="${z.path}" onclick="onZoneClick('${z.id}')" />`).join('')}
                    </svg>
                </div>
            </div>
            <div class="lg:w-1/2">${state.selectedZone ? renderZonePanel() : `<div class="p-20 text-center glass-panel rounded-[3rem] text-slate-300 italic">Tap an anatomical zone to see clinical data.</div>`}</div>
        </div>`;

    if (state.view === 'CLINICS') return `
        <div class="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 min-h-[600px]">
            <div id="map-mount-point" class="lg:w-1/2 rounded-[3.5rem] border overflow-hidden shadow-sm bg-white p-2">
                ${!state.map ? '<div class="h-full bg-slate-50 flex items-center justify-center text-slate-300 italic">Enable Location to see Clinic Map</div>' : ''}
            </div>
            <div class="lg:w-1/2 flex flex-col items-center justify-center text-center">
                <div class="mb-12">
                    <h2 class="text-7xl font-serif mb-8 text-slate-800 text-center">Clinic Finder</h2>
                    <button onclick="getLocation()" class="btn-primary px-16 py-5 rounded-full uppercase tracking-widest text-xs shadow-xl transition-all hover:scale-105 active:scale-95">Find Near Me</button>
                </div>
                <div id="clinic-info-panel" class="w-full text-left">
                    ${state.selectedClinic ? renderClinicDetails() : `<div class="p-12 border-2 border-dashed border-slate-200 rounded-[3.5rem] text-slate-300 italic text-center">Tap a marker on the map to see safety data.</div>`}
                </div>
            </div>
        </div>`;
    
    return '';
}

function renderZonePanel() {
    const z = state.selectedZone;
    return `<div class="bg-white rounded-[3rem] p-12 border shadow-2xl animate-in">
        <h2 class="text-4xl font-serif mb-2 leading-tight">${z.name} Clinical Analysis</h2>
        <span class="text-[0.65rem] font-black uppercase ${z.colorClass==='risk-severe'?'text-red-500 bg-red-50':z.colorClass==='risk-high'?'text-orange-500 bg-orange-50':'text-amber-500 bg-amber-50'} px-4 py-1.5 rounded-full">${z.risk}</span>
        <div class="mt-12 space-y-6">
            <div class="bg-slate-50 p-8 rounded-[2rem] border text-sm font-medium"><div class="flex items-center gap-3 mb-4 text-slate-900"><i data-lucide="alert-triangle"></i><strong>Risks Factor:</strong></div><p class="text-slate-600">${z.risksFactor}</p></div>
            <div class="bg-medical-50 p-8 rounded-[2rem] border border-medical-100 text-sm font-medium"><div class="flex items-center gap-3 mb-4 text-medical-900"><i data-lucide="syringe"></i><strong>Procedure:</strong></div><p class="text-medical-600">${z.procedure}</p></div>
            <div class="bg-red-50 p-8 rounded-[2rem] border border-red-100 text-sm font-medium"><div class="flex items-center gap-3 mb-4 text-red-900"><i data-lucide="zap"></i><strong>Risks:</strong></div><p class="text-red-600">${z.risks}</p></div>
            <div class="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 text-sm font-medium"><div class="flex items-center gap-3 mb-4 text-emerald-900"><i data-lucide="leaf"></i><strong>Safer Alternatives:</strong></div><p class="text-emerald-600">${z.saferAlternatives}</p></div>
        </div>
    </div>`;
}

function renderClinicDetails() {
    const c = state.selectedClinic;
    return `<div class="bg-white p-12 rounded-[3.5rem] shadow-2xl border animate-in">
        <div class="flex items-center gap-6 mb-10"><div class="w-16 h-16 bg-medical-50 text-medical-500 rounded-2xl flex items-center justify-center"><i data-lucide="map-pin"></i></div>
        <div><h3 class="text-4xl font-serif text-slate-800 leading-tight">${c.name}</h3><p class="text-[0.6rem] font-black uppercase text-slate-400">Verified Facility</p></div></div>
        <p class="text-sm text-slate-500"><strong>Address:</strong><br>${c.vicinity || c.formatted_address}</p>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => { render(); });


