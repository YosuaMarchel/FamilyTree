"use strict";

/** Dialog & notifikasi ringan yang dipakai bersama oleh editor dan menu. */
const Components = (() => {
  function dismissAllAlerts() {
    document.querySelectorAll(".custom-alert-overlay").forEach(el => el.remove());
  }

  function buildDialog(title, message, role) {
    const overlay = Utils.el("div", "custom-alert-overlay");
    overlay.setAttribute("role", role);
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", title);

    const box = Utils.el("div", "custom-alert");
    box.append(Utils.el("h3", null, title), Utils.el("p", null, message));

    const actions = Utils.el("div", "alert-actions");
    box.appendChild(actions);
    overlay.appendChild(box);
    return { overlay, actions };
  }

  function showAlert(title, message) {
    dismissAllAlerts();
    const { overlay, actions } = buildDialog(title, message, "dialog");

    const btn = Utils.el("button", "btn btn-primary", "OK");
    btn.type = "button";
    btn.addEventListener("click", () => overlay.remove());
    actions.appendChild(btn);

    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    btn.focus();
  }

  function showConfirm(title, message, onYes, options) {
    dismissAllAlerts();
    const opts = options || {};
    const { overlay, actions } = buildDialog(title, message, "alertdialog");

    const btnNo = Utils.el("button", "btn", opts.cancelText || "Batal");
    btnNo.type = "button";
    btnNo.addEventListener("click", () => overlay.remove());

    const btnYes = Utils.el("button", `btn ${opts.danger ? "btn-danger" : "btn-primary"}`,
      opts.confirmText || "Ya");
    btnYes.type = "button";
    btnYes.addEventListener("click", () => { overlay.remove(); onYes(); });

    actions.append(btnNo, btnYes);
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    btnNo.focus();
  }

  let toastTimer = null;

  function showToast(message, variant) {
    let toast = document.getElementById("app-toast");
    if (!toast) {
      toast = Utils.el("div", "toast");
      toast.id = "app-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast is-visible${variant ? ` toast-${variant}` : ""}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), CONFIG.TOAST_DURATION_MS);
  }

  /** Esc menutup dialog paling atas. */
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const overlays = document.querySelectorAll(".custom-alert-overlay");
    if (overlays.length) {
      e.stopPropagation();
      overlays[overlays.length - 1].remove();
    }
  }, true);

  return Object.freeze({ showAlert, showConfirm, showToast, dismissAllAlerts });
})();
