const INIT_ATTR = "data-hs-dropdown-initialized";

function enhanceDropdown(root) {
  const field = root.querySelector(".hs_area_de_interes.hs-fieldtype-checkbox");
  if (!field || field.hasAttribute(INIT_ATTR)) return;

  const inputWrap = field.querySelector(".input");
  const list = inputWrap?.querySelector("ul.inputs-list");
  const labelEl = field.querySelector("label");
  const labelId = labelEl?.id || "";
  if (!inputWrap || !list) return;

  const uid = "hsopts-" + Math.random().toString(36).slice(2);

  // Botón (placeholder fijo)
  const button = document.createElement("button");
  button.type = "button";
  button.className = "hs-dropdown hs-dropdown--placeholder";
  button.id = uid + "-button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", uid);
  const placeholder = "Selecciona";
  button.textContent = placeholder;

  // Panel listbox accesible
  const panel = document.createElement("div");
  panel.className = "hs-options";
  panel.id = uid;
  panel.setAttribute("role", "listbox");
  panel.setAttribute("aria-multiselectable", "true");
  if (labelId) panel.setAttribute("aria-labelledby", labelId);

  // Inserción y movimiento del UL original (preserva inputs)
  inputWrap.insertBefore(button, list);
  inputWrap.insertBefore(panel, list);
  panel.appendChild(list);

  list.style.display = "block";
  list.style.margin = "0";

  // Opciones: usamos roving tabindex en <label> (el input está oculto por CSS)
  const optionLis = Array.from(list.querySelectorAll(".hs-form-checkbox"));
  const optionEls = optionLis.map((li, idx) => {
    const label = li.querySelector("label") || li;
    const input = li.querySelector('input[type="checkbox"]');
    label.setAttribute("role", "option");
    label.setAttribute("tabindex", idx === 0 ? "0" : "-1");
    if (input) {
      label.setAttribute("aria-selected", input.checked ? "true" : "false");
      input.tabIndex = -1; // evitamos tab al input oculto
    }
    return { label, input };
  });

  const updateButtonText = () => {
    const checked = panel.querySelectorAll('input[type="checkbox"]:checked');
    if (checked.length === 0) {
      button.textContent = placeholder;
      button.classList.add("hs-dropdown--placeholder");
    } else {
      const values = Array.from(checked).map((i) => i.value);
      button.textContent = values.join(", ");
      button.classList.remove("hs-dropdown--placeholder");
    }
  };

  const setActive = (el) => {
    optionEls.forEach(({ label }) => (label.tabIndex = -1));
    el.tabIndex = 0;
    el.focus();
  };

  const getActiveIndex = () =>
    optionEls.findIndex(({ label }) => label.tabIndex === 0);

  const open = () => {
    button.classList.add("open");
    button.setAttribute("aria-expanded", "true");
    // Enfoca la primera marcada o la primera opción
    const firstChecked = optionEls.find(({ input }) => input?.checked)?.label;
    setActive(firstChecked || optionEls[0]?.label);
  };

  const close = ({ returnFocus = true } = {}) => {
    button.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    if (returnFocus) button.focus();
    // Dispara validación al cerrar
    triggerValidation();
  };

  const toggle = () =>
    button.classList.contains("open") ? close({ returnFocus: true }) : open();

  const triggerValidation = () => {
    // Dispara validación de HubSpot cuando se sale del campo
    const firstCheckbox = panel.querySelector('input[type="checkbox"]');
    if (firstCheckbox) {
      // Dispara blur para que HubSpot valide
      firstCheckbox.dispatchEvent(new Event("blur", { bubbles: true }));
      // También dispara en el contenedor por si HubSpot escucha ahí
      inputWrap.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  };

  // Botón
  button.addEventListener("click", toggle);
  button.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      open();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
    // Tab: cierra y valida el campo
    if (e.key === "Tab") {
      close();
      triggerValidation();
    }
  });

  // Click en opción
  panel.addEventListener("click", (e) => {
    const label = e.target.closest('[role="option"]');
    if (!label) return;
    const pair = optionEls.find((p) => p.label === label);
    if (pair?.input) {
      // El navegador ya habrá togglado por el label; sincronizamos aria y texto
      label.setAttribute(
        "aria-selected",
        pair.input.checked ? "true" : "false"
      );
      updateButtonText();
    }
  });

  // Teclado dentro del listbox (incluye TAB dentro del panel)
  panel.addEventListener("keydown", (e) => {
    const idx = getActiveIndex();
    const lastIdx = optionEls.length - 1;
    const move = (nextIdx) => {
      const clamped = Math.max(0, Math.min(lastIdx, nextIdx));
      setActive(optionEls[clamped].label);
    };

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(idx + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(idx - 1);
        break;
      case "Home":
        e.preventDefault();
        move(0);
        break;
      case "End":
        e.preventDefault();
        move(lastIdx);
        break;
      case " ":
      case "Enter": {
        e.preventDefault();
        const { input, label } = optionEls[idx] || {};
        if (input) {
          input.checked = !input.checked;
          label.setAttribute("aria-selected", input.checked ? "true" : "false");
          input.dispatchEvent(new Event("change", { bubbles: true }));
          updateButtonText();
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        close({ returnFocus: true });
        break;
      case "Tab": {
        // Navegación por Tab dentro del panel
        const goingBack = e.shiftKey;
        const atFirst = idx <= 0;
        const atLast = idx >= lastIdx;

        if ((goingBack && atFirst) || (!goingBack && atLast)) {
          // Salimos naturalmente (cierra y deja seguir el tab)
          close({ returnFocus: false });
          triggerValidation(); // Valida al salir con Tab
          return; // no preventDefault
        }

        e.preventDefault();
        move(goingBack ? idx - 1 : idx + 1);
        break;
      }
    }
  });

  // Cerrar al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!field.contains(e.target)) close({ returnFocus: false });
  });

  // Cambios desde los inputs (por si hay validación o lógica externa)
  panel.addEventListener("change", updateButtonText);

  updateButtonText();
  field.setAttribute(INIT_ATTR, "true");

  // Marca el formulario como listo (para mostrar con transición)
  const formContainer = field.closest(".hbspt-form");
  if (formContainer) {
    formContainer.setAttribute("data-ready", "");
  }
}

// 1) Intento inmediato
enhanceDropdown(document);

// 2) Observa DOM (HubSpot async)
const obs = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (
        node.querySelector?.(".hs_area_de_interes.hs-fieldtype-checkbox") ||
        node.matches?.(".hs_area_de_interes.hs-fieldtype-checkbox")
      ) {
        enhanceDropdown(document);
      }
      // Si aparece un formulario sin el campo personalizado, mostrarlo igual
      if (
        (node.querySelector?.(".hbspt-form") ||
          node.matches?.(".hbspt-form")) &&
        !node.querySelector?.(".hs_area_de_interes.hs-fieldtype-checkbox")
      ) {
        const form = node.matches?.(".hbspt-form")
          ? node
          : node.querySelector(".hbspt-form");
        if (form) form.setAttribute("data-ready", "");
      }
    }
  }
});
obs.observe(document.documentElement, { childList: true, subtree: true });
