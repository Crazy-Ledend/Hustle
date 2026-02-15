let editor;

// Monaco setup
require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs" } });

require(["vs/editor/editor.main"], function () {
    editor = monaco.editor.create(document.getElementById("editor"), {
        value: 'print("Hello from Hustle 🚀")',
        language: "python",
        theme: "vs-dark",
        automaticLayout: true
    });
});

// Toggle editor
document.getElementById("toggleEditor").onclick = () => {
    document.getElementById("editorSection").classList.toggle("hidden");
};

// Language switch
document.getElementById("lang").addEventListener("change", e => {
    monaco.editor.setModelLanguage(editor.getModel(), e.target.value);
});

const langSelect = document.getElementById("lang");

const templates = {
  python: `print("Hello from Hustle!")`,
  java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Hustle!");
    }
}`
};

langSelect.addEventListener("change", () => {
  const lang = langSelect.value;

  editor.setValue(templates[lang]);
  monaco.editor.setModelLanguage(editor.getModel(), lang);
});

// Run code
function runCode() {
    const output = document.getElementById("output");
    output.textContent = "Running...";

    fetch("/run/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code: editor.getValue(),
            lang: document.getElementById("lang").value
        })
    })
    .then(res => res.json())
    .then(data => {
        output.textContent = data.output || "No output";
    })
    .catch(() => {
        output.textContent = "Execution error";
    });
}

// Toast reminders
function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = "⏰ " + msg;

    document.getElementById("toast-container").appendChild(toast);

    setTimeout(() => toast.remove(), 5000);
}

// Trigger reminders on load
window.onload = () => {
    if (typeof REMINDERS !== "undefined") {
        REMINDERS.forEach(showToast);
    }
};

function toggleTask(id, completed) {
  fetch(`/complete/${id}/`, {
    method: "POST",
    headers: {
      "X-CSRFToken": getCSRFToken()
    }
  }).then(() => {
    const row = document.getElementById(`task-${id}`);
    row.classList.toggle("done", completed);
  });
}

function deleteTask(id) {
  const el = document.getElementById(`task-${id}`);
  el.classList.add("disintegrate");

  setTimeout(() => {
    fetch(`/delete/${id}/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": getCSRFToken()
      }
    }).then(() => el.remove());
  }, 400);
}

function getCSRFToken() {
  return document.querySelector("[name=csrfmiddlewaretoken]").value;
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    document.cookie.split(";").forEach(cookie => {
      const c = cookie.trim();
      if (c.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(c.slice(name.length + 1));
      }
    });
  }
  return cookieValue;
}

// Toggle when clicking the row (except buttons)
document.addEventListener("click", (e) => {
  const main = e.target.closest(".todo-main");
  if (!main) return;

  const checkbox = main.querySelector(".todo-checkbox");
  checkbox.checked = !checkbox.checked;

  toggleTask(checkbox.dataset.id, checkbox.checked);
});

// Toggle when clicking checkbox directly
// Checkbox click → stop bubbling
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("todo-checkbox")) return;

  e.stopPropagation(); // 🔥 THIS is the missing piece
});

// Checkbox change → sync backend only
document.addEventListener("change", (e) => {
  if (!e.target.classList.contains("todo-checkbox")) return;
  
  toggleTask(e.target.dataset.id, e.target.checked);
});

// Delete button
document.addEventListener("click", (e) => {
  const deleteBtn = e.target.closest(".delete-btn");

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    deleteTask(id);
  }
});

// NEW
// document.addEventListener("click", (e) => {
//   const btn = e.target.closest(".delete-btn");
//   if (!btn) return;

//   deleteTask(btn.dataset.id);
// });

// OLD
// document.addEventListener("change", (e) => {
//   const toggle = e.target.closest(".todo-toggle");
//   if (!toggle) return;

//   const id = toggle.dataset.id;
//   const completed = toggle.checked;

//   toggleTask(id, completed);
// });
