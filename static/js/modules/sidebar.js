// ── Sidebar Module ──
import { escapeHtml } from './utils.js';

export function initSidebar({ sidebar, sidebarOverlay, sidebarToggle, sidebarClose, sidebarNewChat, onNewChat, onSwitchChat, onDeleteChat }) {
    function openSidebar() {
        sidebar.style.display = "flex";
        sidebarOverlay.style.display = "block";
    }
    function closeSidebar() {
        sidebar.style.display = "none";
        sidebarOverlay.style.display = "none";
    }

    sidebarToggle.addEventListener("click", (e) => { e.stopPropagation(); openSidebar(); });
    sidebarClose.addEventListener("click", closeSidebar);
    sidebarOverlay.addEventListener("click", closeSidebar);
    sidebarNewChat.addEventListener("click", () => { onNewChat(); closeSidebar(); });

    return { openSidebar, closeSidebar };
}

export function renderSidebarTabs(sidebarTabs, chats, activeChatId, onSwitch, onDelete, closeSidebar) {
    sidebarTabs.innerHTML = "";
    if (chats.length === 0) {
        sidebarTabs.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#555;font-size:0.82rem;text-align:center;padding:2rem;gap:0.3rem;"><span style="font-size:1.4rem;opacity:0.5;">💬</span><span>No chats yet</span></div>';
        return;
    }
    chats.forEach(chat => {
        const tab = document.createElement("button");
        tab.style.cssText = "display:flex;align-items:center;gap:0.5rem;padding:0.55rem 0.7rem;border-radius:8px;cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:inherit;color:#8e8e8e;font-size:0.82rem;transition:background 0.15s;";
        if (chat.id === activeChatId) tab.style.cssText += "background:#1a1a1a;color:#ececec;border:1px solid #2a2a2a;";
        tab.innerHTML = '<span>💬</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(chat.title) + '</span><span class="del-btn" style="opacity:0;background:none;border:none;color:#555;cursor:pointer;font-size:0.8rem;padding:2px 6px;">✕</span>';

        tab.addEventListener("mouseenter", () => { tab.style.background = "#222"; tab.querySelector(".del-btn").style.opacity = "1"; });
        tab.addEventListener("mouseleave", () => { tab.style.background = chat.id === activeChatId ? "#1a1a1a" : "none"; tab.querySelector(".del-btn").style.opacity = "0"; });

        tab.addEventListener("click", (e) => {
            if (e.target.classList.contains("del-btn")) { onDelete(chat.id); return; }
            onSwitch(chat.id);
            closeSidebar();
        });
        sidebarTabs.appendChild(tab);
    });
}
