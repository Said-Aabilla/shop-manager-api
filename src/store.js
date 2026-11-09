const { badRequest, notFound, conflict } = require("./errors");
const { createSeedState } = require("./seed");

function money(value) {
  return Math.round(value * 100) / 100;
}

function stockConflict(productName, requested, available) {
  if (available <= 0) {
    return conflict(`"${productName}" is out of stock, so it cannot be reserved right now.`);
  }

  const noun = available === 1 ? "item is" : "items are";
  return conflict(
    `Not enough stock for "${productName}". You asked for ${requested}, but only ${available} ${noun} available.`
  );
}

function createStore() {
  let state = createSeedState();

  function categoryById(id) {
    return state.categories.find((category) => category.id === id);
  }

  function productById(id) {
    return state.products.find((product) => product.id === id);
  }

  function reservationById(id) {
    return state.reservations.find((reservation) => reservation.id === id);
  }

  function toCategory(category) {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
    };
  }

  function toProduct(product) {
    const category = categoryById(product.categoryId);
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
      categoryName: category ? category.name : null,
      image: product.image || "/images/placeholder.svg",
    };
  }

  function toReservation(reservation) {
    const product = productById(reservation.productId);
    return {
      id: reservation.id,
      productId: reservation.productId,
      productName: product ? product.name : null,
      unitPrice: reservation.unitPrice,
      quantity: reservation.quantity,
      total: reservation.total,
      status: reservation.status,
      customer: {
        name: reservation.customer.name,
        email: reservation.customer.email,
        phone: reservation.customer.phone,
        address: reservation.customer.address,
        city: reservation.customer.city,
        postalCode: reservation.customer.postalCode,
      },
      notes: reservation.notes,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }

  function requireCategory(id) {
    const category = categoryById(id);
    if (!category) throw notFound(`No category with id ${id} was found.`);
    return category;
  }

  function requireProduct(id) {
    const product = productById(id);
    if (!product) throw notFound(`No product with id ${id} was found.`);
    return product;
  }

  function requireReservation(id) {
    const reservation = reservationById(id);
    if (!reservation) throw notFound(`No reservation with id ${id} was found.`);
    return reservation;
  }

  function assertCategoryNameAvailable(name, ignoreId) {
    const taken = state.categories.some(
      (category) => category.id !== ignoreId && category.name.toLowerCase() === name.toLowerCase()
    );

    if (taken) {
      throw conflict(`A category named "${name}" already exists.`);
    }
  }

  function assertCategoryExists(categoryId) {
    if (!categoryById(categoryId)) {
      throw badRequest("Some fields are missing or invalid.", {
        categoryId: `No category with id ${categoryId} was found.`,
      });
    }
  }

  return {
    reset() {
      state = createSeedState();
    },

    listCategories() {
      return state.categories.map(toCategory);
    },

    getCategory(id) {
      return toCategory(requireCategory(id));
    },

    createCategory(input) {
      assertCategoryNameAvailable(input.name);
      const category = {
        id: state.nextCategoryId++,
        name: input.name,
        description: input.description,
      };
      state.categories.push(category);
      return toCategory(category);
    },

    updateCategory(id, input) {
      const category = requireCategory(id);
      assertCategoryNameAvailable(input.name, id);
      category.name = input.name;
      category.description = input.description;
      return toCategory(category);
    },

    deleteCategory(id) {
      const category = requireCategory(id);
      const used = state.products.filter((product) => product.categoryId === id);

      if (used.length > 0) {
        const noun = used.length === 1 ? "product still uses" : "products still use";
        throw conflict(
          `Cannot delete the category "${category.name}" because ${used.length} ${noun} it. Delete those products or move them to another category first.`
        );
      }

      state.categories = state.categories.filter((item) => item.id !== id);
    },

    listProducts(filters) {
      let items = state.products.slice();

      if (filters.categoryId !== undefined) {
        items = items.filter((product) => product.categoryId === filters.categoryId);
      }

      if (filters.search) {
        const needle = filters.search.toLowerCase();
        items = items.filter(
          (product) =>
            product.name.toLowerCase().includes(needle) ||
            product.description.toLowerCase().includes(needle)
        );
      }

      if (filters.maxPrice !== undefined) {
        items = items.filter((product) => product.price <= filters.maxPrice);
      }

      if (filters.inStock === true) {
        items = items.filter((product) => product.stock > 0);
      }

      if (filters.inStock === false) {
        items = items.filter((product) => product.stock === 0);
      }

      return items.map(toProduct);
    },

    getProduct(id) {
      return toProduct(requireProduct(id));
    },

    createProduct(input) {
      assertCategoryExists(input.categoryId);
      const product = {
        id: state.nextProductId++,
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        categoryId: input.categoryId,
        image: input.image || "/images/placeholder.svg",
      };
      state.products.push(product);
      return toProduct(product);
    },

    updateProduct(id, input) {
      const product = requireProduct(id);
      assertCategoryExists(input.categoryId);
      product.name = input.name;
      product.description = input.description;
      product.price = input.price;
      product.stock = input.stock;
      product.categoryId = input.categoryId;
      if (input.image !== undefined) product.image = input.image || "/images/placeholder.svg";
      return toProduct(product);
    },

    deleteProduct(id) {
      const product = requireProduct(id);
      const used = state.reservations.filter((reservation) => reservation.productId === id);

      if (used.length > 0) {
        const noun = used.length === 1 ? "reservation still uses" : "reservations still use";
        throw conflict(
          `Cannot delete "${product.name}" because ${used.length} ${noun} it. Delete those reservations first.`
        );
      }

      state.products = state.products.filter((item) => item.id !== id);
    },

    listReservations(filters) {
      let items = state.reservations.slice();

      if (filters.status !== undefined) {
        items = items.filter((reservation) => reservation.status === filters.status);
      }

      if (filters.productId !== undefined) {
        items = items.filter((reservation) => reservation.productId === filters.productId);
      }

      return items.map(toReservation);
    },

    getReservation(id) {
      return toReservation(requireReservation(id));
    },

    createReservation(input) {
      const product = productById(input.productId);

      if (!product) {
        throw badRequest("Some fields are missing or invalid.", {
          productId: `No product with id ${input.productId} was found.`,
        });
      }

      if (input.quantity > product.stock) {
        throw stockConflict(product.name, input.quantity, product.stock);
      }

      product.stock -= input.quantity;
      const now = new Date().toISOString();
      const reservation = {
        id: state.nextReservationId++,
        productId: product.id,
        unitPrice: product.price,
        quantity: input.quantity,
        total: money(product.price * input.quantity),
        status: "pending",
        customer: input.customer,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      };
      state.reservations.push(reservation);
      return toReservation(reservation);
    },

    updateReservation(id, patch) {
      const reservation = requireReservation(id);
      const product = productById(reservation.productId);

      if (!product) {
        throw notFound(`No product with id ${reservation.productId} was found.`);
      }

      const nextStatus = patch.status !== undefined ? patch.status : reservation.status;
      const nextQuantity = patch.quantity !== undefined ? patch.quantity : reservation.quantity;

      if (
        reservation.status === "cancelled" &&
        nextStatus === "cancelled" &&
        patch.quantity !== undefined &&
        patch.quantity !== reservation.quantity
      ) {
        throw conflict(
          "This reservation is cancelled, so changing the quantity does not reserve anything. Set status to pending if you want to reserve the items."
        );
      }

      const currentlyHeld = reservation.status === "cancelled" ? 0 : reservation.quantity;
      const nextHeld = nextStatus === "cancelled" ? 0 : nextQuantity;
      const extraNeeded = nextHeld - currentlyHeld;

      if (extraNeeded > product.stock) {
        throw stockConflict(product.name, nextQuantity, product.stock + currentlyHeld);
      }

      product.stock -= extraNeeded;
      reservation.status = nextStatus;
      reservation.quantity = nextQuantity;
      reservation.total = money(reservation.unitPrice * nextQuantity);

      if (patch.customer) reservation.customer = patch.customer;
      if (patch.notes !== undefined) reservation.notes = patch.notes;

      reservation.updatedAt = new Date().toISOString();
      return toReservation(reservation);
    },

    deleteReservation(id) {
      const reservation = requireReservation(id);

      if (reservation.status !== "cancelled") {
        const product = productById(reservation.productId);
        if (product) product.stock += reservation.quantity;
      }

      state.reservations = state.reservations.filter((item) => item.id !== id);
    },
  };
}

module.exports = { createStore };
