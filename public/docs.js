const API_PLACEHOLDER = "http://localhost:3000";

function dedent(raw) {
  const text = raw.replace(/^\n/, "").replace(/\s+$/, "");
  const lines = text.split("\n");
  let min = Infinity;

  for (const line of lines) {
    if (!line.trim()) continue;
    const width = line.match(/^[ \t]*/)[0].length;
    if (width < min) min = width;
  }

  if (!Number.isFinite(min) || min === 0) return text;
  return lines.map((line) => line.slice(min)).join("\n");
}

function pageOrigin() {
  if (location.protocol === "http:" || location.protocol === "https:") {
    return location.origin;
  }
  return API_PLACEHOLDER;
}

function formatArg(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) {
    return String(value);
  }
  return JSON.stringify(value, null, 2);
}

function prepareExamples(origin) {
  for (const block of document.querySelectorAll("pre code[id]")) {
    const clean = dedent(block.textContent).replaceAll(API_PLACEHOLDER, origin);
    block.textContent = clean;
  }

  const baseUrl = document.querySelector("#base-url");
  if (baseUrl) baseUrl.textContent = origin;
}

async function copyCode(button) {
  const block = document.getElementById(button.dataset.copy);
  if (!block) return;

  const text = block.textContent;

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  const previous = button.textContent;
  button.textContent = "Copied";
  window.setTimeout(() => {
    button.textContent = previous;
  }, 1200);
}

async function runExample(button) {
  const block = document.getElementById(button.dataset.run);
  const output = document.getElementById(`out-${button.dataset.run}`);
  if (!block || !output) return;

  const logs = [];
  const fakeConsole = {
    log(...args) {
      logs.push(args.map(formatArg).join("\n"));
    },
  };

  const previous = button.textContent;
  button.disabled = true;
  button.textContent = "Running...";
  output.className = "output";
  output.textContent = "Running...";

  try {
    const source = block.textContent;
    const runner = new Function(
      "fetch",
      "console",
      "document",
      `"use strict"; return (async () => {\n${source}\n})();`
    );
    await runner(window.fetch, fakeConsole, document);
    output.textContent = logs.join("\n\n") || "The example finished without printing anything.";

    const statusLine = logs.find((line) => /^[1-5]\d\d$/.test(line.trim()));
    if (statusLine) {
      const status = Number(statusLine.trim());
      output.classList.add(status >= 200 && status < 300 ? "ok" : "bad");
    }
  } catch (error) {
    output.className = "output bad";
    output.textContent = `The example stopped: ${error.message}`;
  } finally {
    button.disabled = false;
    button.textContent = previous;
    refreshProductSelect();
  }
}

function productOptionLabel(product) {
  const stock = product.stock === 0 ? "out of stock" : `${product.stock} in stock`;
  return `${product.name} (${product.categoryName}) — ${stock}`;
}

async function refreshProductSelect() {
  const select = document.querySelector("#productId");
  if (!select) return;

  const previous = select.value;

  try {
    const response = await fetch("/api/products");
    if (!response.ok) {
      const problem = await response.json();
      select.innerHTML = "";
      const option = document.createElement("option");
      option.textContent = problem.message;
      select.appendChild(option);
      return;
    }

    const products = await response.json();
    select.innerHTML = "";

    for (const product of products) {
      const option = document.createElement("option");
      option.value = String(product.id);
      option.textContent = productOptionLabel(product);
      select.appendChild(option);
    }

    if (previous && [...select.options].some((option) => option.value === previous)) {
      select.value = previous;
    }
  } catch (error) {
    select.innerHTML = "";
    const option = document.createElement("option");
    option.textContent = "Could not load products";
    select.appendChild(option);
  }
}

function wireReservationForm() {
  const form = document.querySelector("#reserve-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = document.querySelector("#reserve-result");
    const submit = form.querySelector("button[type='submit']");
    const origin = pageOrigin();

    const payload = {
      productId: Number(form.elements.productId.value),
      quantity: Number(form.elements.quantity.value),
      customer: {
        name: form.elements.customerName.value,
        email: form.elements.email.value,
        address: form.elements.address.value,
        city: form.elements.city.value,
      },
    };

    const phone = form.elements.phone.value.trim();
    const postalCode = form.elements.postalCode.value.trim();
    const notes = form.elements.notes.value.trim();

    if (phone) payload.customer.phone = phone;
    if (postalCode) payload.customer.postalCode = postalCode;
    if (notes) payload.notes = notes;

    submit.disabled = true;
    result.className = "output";
    result.textContent = "Sending...";

    try {
      const response = await fetch(`${origin}/api/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      result.className = response.ok ? "output ok" : "output bad";
      result.textContent = `HTTP ${response.status}\n\n${JSON.stringify(body, null, 2)}`;
      refreshProductSelect();
    } catch (error) {
      result.className = "output bad";
      result.textContent = "Could not reach the API. Is the server running?";
    } finally {
      submit.disabled = false;
    }
  });
}

function wireReset() {
  const button = document.querySelector("#reset-data");
  const message = document.querySelector("#reset-message");
  if (!button || !message) return;

  button.addEventListener("click", async () => {
    const ok = window.confirm(
      "This puts the original categories, products, and reservations back. Items you created will disappear."
    );
    if (!ok) return;

    button.disabled = true;
    message.textContent = "Resetting...";

    try {
      const response = await fetch("/api/reset", { method: "POST" });
      const body = await response.json();
      message.textContent = response.ok
        ? `${body.message} Categories: ${body.categories}. Products: ${body.products}. Reservations: ${body.reservations}.`
        : body.message;
      refreshProductSelect();
    } catch (error) {
      message.textContent = "Could not reach the API. Is the server running?";
    } finally {
      button.disabled = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const origin = pageOrigin();
  prepareExamples(origin);

  for (const button of document.querySelectorAll("[data-copy]")) {
    button.addEventListener("click", () => copyCode(button));
  }

  for (const button of document.querySelectorAll("[data-run]")) {
    button.addEventListener("click", () => runExample(button));
  }

  wireReservationForm();
  wireReset();
  refreshProductSelect();
  document.body.dataset.docsReady = "true";
});
