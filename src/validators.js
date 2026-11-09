const { badRequest } = require("./errors");

const STATUSES = ["pending", "confirmed", "cancelled"];

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function requireObject(body) {
  if (body === undefined || body === null) {
    throw badRequest("A JSON object is required in the body.");
  }

  if (Array.isArray(body)) {
    throw badRequest("The JSON body must be an object, not an array.");
  }

  if (!isPlainObject(body)) {
    throw badRequest('The JSON body must be an object, for example { "name": "Books" }.');
  }
}

function assertFields(fields, message) {
  if (Object.keys(fields).length > 0) {
    throw badRequest(message || "Some fields are missing or invalid.", fields);
  }
}

function rejectUnknown(body, allowed, fields) {
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) {
      fields[key] = `Unknown field. Allowed fields: ${allowed.join(", ")}.`;
    }
  }
}

function rejectUnknownQuery(query, allowed, fields) {
  for (const key of Object.keys(query)) {
    if (!allowed.includes(key)) {
      fields[key] = `Unknown query parameter. You can use: ${allowed.join(", ")}.`;
    }
  }
}

function readString(source, key, field, { required = false, min = 0, max = 500 } = {}, fields) {
  const value = source[key];

  if (value === undefined || value === null || value === "") {
    if (required) fields[field] = `${field} is required.`;
    return "";
  }

  if (typeof value !== "string") {
    fields[field] = `${field} must be text.`;
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    if (required) fields[field] = `${field} is required.`;
    return "";
  }

  if (/[\u0000-\u001F]/.test(trimmed)) {
    fields[field] = `${field} cannot contain line breaks or control characters.`;
    return "";
  }

  if (trimmed.length < min) {
    fields[field] = `${field} must be at least ${min} characters.`;
    return "";
  }

  if (trimmed.length > max) {
    fields[field] = `${field} must be at most ${max} characters.`;
    return "";
  }

  return trimmed;
}

function readJsonId(value, field, fields) {
  if (value === undefined || value === null || value === "") {
    fields[field] = `${field} is required.`;
    return undefined;
  }

  if (typeof value === "string") {
    fields[field] = `${field} must be a number, not text. If this value comes from an input, use Number(value) before sending it.`;
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    fields[field] = `${field} must be a positive whole number.`;
    return undefined;
  }

  return value;
}

function readPrice(value, fields) {
  if (value === undefined || value === null || value === "") {
    fields.price = "price is required.";
    return undefined;
  }

  if (typeof value === "string") {
    fields.price = "price must be a number, not text. If this value comes from an input, use Number(value) before sending it.";
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    fields.price = "price must be a number greater than or equal to 0, such as 19.99.";
    return undefined;
  }

  const rounded = Math.round(value * 100) / 100;

  if (Math.abs(value - rounded) > 1e-8) {
    fields.price = "price can have at most 2 decimal places.";
    return undefined;
  }

  if (rounded < 0 || rounded > 99999.99) {
    fields.price = "price must be between 0 and 99999.99.";
    return undefined;
  }

  return rounded;
}

function readStock(value, fields) {
  if (value === undefined || value === null || value === "") {
    fields.stock = "stock is required.";
    return undefined;
  }

  if (typeof value === "string") {
    fields.stock = "stock must be a number, not text. If this value comes from an input, use Number(value) before sending it.";
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100000) {
    fields.stock = "stock must be a whole number from 0 to 100000.";
    return undefined;
  }

  return value;
}

function readQuantity(value, fields, required) {
  if (value === undefined || value === null || value === "") {
    if (required) fields.quantity = "quantity is required.";
    return undefined;
  }

  if (typeof value === "string") {
    fields.quantity = "quantity must be a number, not text. If this value comes from an input, use Number(value) before sending it.";
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 100) {
    fields.quantity = "quantity must be a whole number from 1 to 100.";
    return undefined;
  }

  return value;
}

function readEmail(source, field, fields) {
  const value = source.email;

  if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
    fields[field] = `${field} is required.`;
    return undefined;
  }

  if (typeof value !== "string") {
    fields[field] = `${field} must be text.`;
    return undefined;
  }

  const email = value.trim();

  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fields[field] = `${field} must look like an email address, such as ada@example.com.`;
    return undefined;
  }

  return email;
}

function readPhone(source, fields) {
  const field = "customer.phone";

  if (!Object.prototype.hasOwnProperty.call(source, "phone") || source.phone === null || source.phone === "") {
    return null;
  }

  if (typeof source.phone !== "string") {
    fields[field] = `${field} must be text, such as "+33 6 12 34 56 78".`;
    return undefined;
  }

  const phone = source.phone.trim();

  if (!phone) return null;

  if (!/^[0-9+().\-\s]{6,20}$/.test(phone)) {
    fields[field] = `${field} must be 6 to 20 characters and can contain digits, spaces, and + ( ) . - only.`;
    return undefined;
  }

  return phone;
}

function readPostalCode(source, fields) {
  const field = "customer.postalCode";

  if (!Object.prototype.hasOwnProperty.call(source, "postalCode") || source.postalCode === null || source.postalCode === "") {
    return null;
  }

  if (typeof source.postalCode !== "string") {
    fields[field] = `${field} must be text, such as "69001".`;
    return undefined;
  }

  const postalCode = source.postalCode.trim();

  if (!postalCode) return null;

  if (!/^[A-Za-z0-9 -]{2,12}$/.test(postalCode)) {
    fields[field] = `${field} must be 2 to 12 letters, digits, spaces, or hyphens.`;
    return undefined;
  }

  return postalCode;
}

function readNotes(value, fields) {
  if (value === undefined || value === null) return "";

  if (typeof value !== "string") {
    fields.notes = "notes must be text.";
    return "";
  }

  const notes = value.trim();

  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(notes)) {
    fields.notes = "notes cannot contain control characters.";
    return "";
  }

  if (notes.length > 300) {
    fields.notes = "notes must be at most 300 characters.";
    return "";
  }

  return notes;
}

function readStatus(value, fields) {
  if (typeof value !== "string" || !STATUSES.includes(value)) {
    fields.status = "status must be pending, confirmed, or cancelled.";
    return undefined;
  }

  return value;
}

function readCustomer(input, fields, mode, current) {
  if (!isPlainObject(input)) {
    fields.customer = "customer must be an object with name, email, address, and city.";
    return null;
  }

  const allowed = ["name", "email", "phone", "address", "city", "postalCode"];

  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) {
      fields[`customer.${key}`] = `Unknown field. Allowed customer fields: ${allowed.join(", ")}.`;
    }
  }

  if (mode === "patch" && Object.keys(input).length === 0) {
    fields.customer = "Send at least one customer field to change: name, email, phone, address, city, or postalCode.";
    return null;
  }

  const result = mode === "patch"
    ? { ...current }
    : { name: "", email: "", phone: null, address: "", city: "", postalCode: null };

  const present = (key) => Object.prototype.hasOwnProperty.call(input, key);

  if (mode === "create" || present("name")) {
    const name = readString(input, "name", "customer.name", { required: true, min: 2, max: 80 }, fields);
    if (!fields["customer.name"]) result.name = name;
  }

  if (mode === "create" || present("email")) {
    const email = readEmail(input, "customer.email", fields);
    if (!fields["customer.email"]) result.email = email;
  }

  if (mode === "create" || present("phone")) {
    const phone = readPhone(input, fields);
    if (!fields["customer.phone"]) result.phone = phone;
  }

  if (mode === "create" || present("address")) {
    const address = readString(input, "address", "customer.address", { required: true, min: 5, max: 200 }, fields);
    if (!fields["customer.address"]) result.address = address;
  }

  if (mode === "create" || present("city")) {
    const city = readString(input, "city", "customer.city", { required: true, min: 2, max: 80 }, fields);
    if (!fields["customer.city"]) result.city = city;
  }

  if (mode === "create" || present("postalCode")) {
    const postalCode = readPostalCode(input, fields);
    if (!fields["customer.postalCode"]) result.postalCode = postalCode;
  }

  return result;
}

function parseRouteId(raw) {
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) {
    throw badRequest(`The id in the URL must be a positive whole number. Received: "${String(raw)}".`);
  }

  const id = Number(raw);

  if (!Number.isSafeInteger(id)) {
    throw badRequest("The id in the URL is too large.");
  }

  return id;
}

function parseCategoryBody(body) {
  requireObject(body);
  const fields = {};
  rejectUnknown(body, ["name", "description"], fields);

  const name = readString(body, "name", "name", { required: true, min: 2, max: 60 }, fields);
  const description = readString(body, "description", "description", { max: 300 }, fields);

  assertFields(fields);
  return { name, description };
}

function parseProductBody(body) {
  requireObject(body);
  const fields = {};
  rejectUnknown(body, ["name", "description", "price", "stock", "categoryId"], fields);

  const name = readString(body, "name", "name", { required: true, min: 2, max: 80 }, fields);
  const description = readString(body, "description", "description", { max: 500 }, fields);
  const price = readPrice(body.price, fields);
  const stock = readStock(body.stock, fields);
  const categoryId = readJsonId(body.categoryId, "categoryId", fields);

  assertFields(fields);
  return { name, description, price, stock, categoryId };
}

function parseProductQuery(query) {
  const fields = {};
  const filters = {};
  const allowed = ["categoryId", "search", "maxPrice", "inStock"];
  rejectUnknownQuery(query, allowed, fields);

  if (query.categoryId !== undefined) {
    if (typeof query.categoryId !== "string" || !/^[1-9]\d*$/.test(query.categoryId)) {
      fields.categoryId = "categoryId must be a positive whole number, such as 2.";
    } else {
      filters.categoryId = Number(query.categoryId);
    }
  }

  if (query.search !== undefined) {
    if (typeof query.search !== "string") {
      fields.search = "search must be text.";
    } else if (query.search.trim().length > 80) {
      fields.search = "search must be at most 80 characters.";
    } else {
      filters.search = query.search.trim();
    }
  }

  if (query.maxPrice !== undefined) {
    if (typeof query.maxPrice !== "string" || !/^\d+(\.\d{1,2})?$/.test(query.maxPrice)) {
      fields.maxPrice = "maxPrice must be a number greater than or equal to 0, such as 20 or 19.99.";
    } else {
      filters.maxPrice = Number(query.maxPrice);
    }
  }

  if (query.inStock !== undefined) {
    if (query.inStock !== "true" && query.inStock !== "false") {
      fields.inStock = 'inStock must be true or false, for example ?inStock=true.';
    } else {
      filters.inStock = query.inStock === "true";
    }
  }

  assertFields(fields, "The query string has a problem.");
  return filters;
}

function parseReservationQuery(query) {
  const fields = {};
  const filters = {};
  const allowed = ["status", "productId"];
  rejectUnknownQuery(query, allowed, fields);

  if (query.status !== undefined) {
    if (typeof query.status !== "string" || !STATUSES.includes(query.status)) {
      fields.status = "status must be pending, confirmed, or cancelled.";
    } else {
      filters.status = query.status;
    }
  }

  if (query.productId !== undefined) {
    if (typeof query.productId !== "string" || !/^[1-9]\d*$/.test(query.productId)) {
      fields.productId = "productId must be a positive whole number, such as 3.";
    } else {
      filters.productId = Number(query.productId);
    }
  }

  assertFields(fields, "The query string has a problem.");
  return filters;
}

function parseReservationCreate(body) {
  requireObject(body);
  const fields = {};
  const allowed = ["productId", "quantity", "customer", "notes"];

  for (const key of Object.keys(body)) {
    if (key === "status") {
      fields.status = "Do not send status when creating a reservation. It starts as pending. Change it later with PATCH.";
    } else if (!allowed.includes(key)) {
      fields[key] = `Unknown field. Allowed fields: ${allowed.join(", ")}.`;
    }
  }

  const productId = readJsonId(body.productId, "productId", fields);
  const quantity = readQuantity(body.quantity, fields, true);
  let customer = null;

  if (body.customer === undefined) {
    fields.customer = "customer is required. Include name, email, address, and city.";
  } else {
    customer = readCustomer(body.customer, fields, "create");
  }

  const notes = body.notes === undefined ? "" : readNotes(body.notes, fields);

  assertFields(fields);
  return { productId, quantity, customer, notes };
}

function parseReservationPatch(body, current) {
  requireObject(body);
  const fields = {};
  const allowed = ["status", "quantity", "customer", "notes"];
  rejectUnknown(body, allowed, fields);

  const patch = {};

  if (Object.prototype.hasOwnProperty.call(body, "status")) {
    patch.status = readStatus(body.status, fields);
  }

  if (Object.prototype.hasOwnProperty.call(body, "quantity")) {
    patch.quantity = readQuantity(body.quantity, fields, true);
  }

  if (Object.prototype.hasOwnProperty.call(body, "notes")) {
    patch.notes = readNotes(body.notes, fields);
  }

  if (Object.prototype.hasOwnProperty.call(body, "customer")) {
    patch.customer = readCustomer(body.customer, fields, "patch", current.customer);
  }

  if (Object.keys(patch).length === 0 && Object.keys(fields).length === 0) {
    throw badRequest("Send at least one field to update: status, quantity, customer, or notes.");
  }

  assertFields(fields);
  return patch;
}

module.exports = {
  STATUSES,
  parseRouteId,
  parseCategoryBody,
  parseProductBody,
  parseProductQuery,
  parseReservationQuery,
  parseReservationCreate,
  parseReservationPatch,
};
