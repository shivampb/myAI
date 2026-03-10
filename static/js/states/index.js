// ── States Index — imports all state configs and exports combined data ──
import andhraPradesh from './andhra-pradesh.js';
import arunachalPradesh from './arunachal-pradesh.js';
import assam from './assam.js';
import bihar from './bihar.js';
import chhattisgarh from './chhattisgarh.js';
import goa from './goa.js';
import gujarat from './gujarat.js';
import haryana from './haryana.js';
import himachalPradesh from './himachal-pradesh.js';
import jharkhand from './jharkhand.js';
import karnataka from './karnataka.js';
import kerala from './kerala.js';
import madhyaPradesh from './madhya-pradesh.js';
import maharashtra from './maharashtra.js';
import manipur from './manipur.js';
import meghalaya from './meghalaya.js';
import mizoram from './mizoram.js';
import nagaland from './nagaland.js';
import odisha from './odisha.js';
import punjab from './punjab.js';
import rajasthan from './rajasthan.js';
import sikkim from './sikkim.js';
import tamilNadu from './tamil-nadu.js';
import telangana from './telangana.js';
import tripura from './tripura.js';
import uttarPradesh from './uttar-pradesh.js';
import uttarakhand from './uttarakhand.js';
import westBengal from './west-bengal.js';
// Union Territories
import andamanNicobar from './andaman-nicobar.js';
import chandigarh from './chandigarh.js';
import dadraNagarHaveli from './dadra-nagar-haveli.js';
import damanDiu from './daman-diu.js';
import delhi from './delhi.js';
import jammuKashmir from './jammu-kashmir.js';
import ladakh from './ladakh.js';
import lakshadweep from './lakshadweep.js';
import puducherry from './puducherry.js';

// Combined array of all states
export const INDIAN_STATES = [
    andhraPradesh, arunachalPradesh, assam, bihar, chhattisgarh,
    goa, gujarat, haryana, himachalPradesh, jharkhand,
    karnataka, kerala, madhyaPradesh, maharashtra, manipur,
    meghalaya, mizoram, nagaland, odisha, punjab,
    rajasthan, sikkim, tamilNadu, telangana, tripura,
    uttarPradesh, uttarakhand, westBengal,
    // Union Territories
    andamanNicobar, chandigarh, dadraNagarHaveli, damanDiu,
    delhi, jammuKashmir, ladakh, lakshadweep, puducherry,
];

// Build suggestions lookup from states that have them
export const STATE_SUGGESTIONS = {};
INDIAN_STATES.forEach(s => {
    if (s.suggestions) STATE_SUGGESTIONS[s.name] = s.suggestions;
});

// Build subtitles lookup
export const STATE_SUBTITLES = {};
INDIAN_STATES.forEach(s => {
    if (s.subtitle) STATE_SUBTITLES[s.name] = s.subtitle;
});

// Default fallback suggestions (Hindi/Devanagari)
export const DEFAULT_SUGGESTIONS = [
    { icon: "🧠", text: "Machine Learning समझाओ भाई", prompt: "What is machine learning and how does it work?" },
    { icon: "💻", text: "RAM vs ROM — समझाओ भाई", prompt: "Explain the difference between RAM and ROM simply." },
    { icon: "📚", text: "Best study techniques बताओ?", prompt: "What are the best study techniques for students?" },
    { icon: "🌐", text: "Internet कैसे काम करता है?", prompt: "How does the internet work in simple terms?" },
];

export const DEFAULT_SUBTITLE = "कुछ भी पूछो — research, study, ya general doubts 😊";

// ── Helpers ──
export function getSelectedState() { return localStorage.getItem("aapka_ai_state") || ""; }
export function setSelectedState(s) { localStorage.setItem("aapka_ai_state", s); }
export function getSelectedMode() { return localStorage.getItem("aapka_ai_mode") || "nativelish"; }
export function setSelectedMode(m) { localStorage.setItem("aapka_ai_mode", m); }
export function getWelcomeData() {
    try { return JSON.parse(localStorage.getItem("aapka_ai_welcome_data")); }
    catch (e) { return null; }
}
export function setWelcomeData(data) { localStorage.setItem("aapka_ai_welcome_data", JSON.stringify(data)); }
export function getSelectedLevel() { return localStorage.getItem("aapka_ai_level") || "simple"; }
export function setSelectedLevel(l) { localStorage.setItem("aapka_ai_level", l); }
export function getStateConfig(name) { return INDIAN_STATES.find(s => s.name === name) || null; }

// List of UT names for section headers
export const UT_NAMES = [
    "Andaman and Nicobar", "Chandigarh", "Dadra Nagar Haveli",
    "Daman and Diu", "Delhi", "Jammu and Kashmir",
    "Ladakh", "Lakshadweep", "Puducherry"
];
