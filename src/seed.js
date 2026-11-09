/**
 * Fresh practice data. Called on startup and on POST /api/reset.
 * Stock numbers below are the shelf quantity before existing reservations.
 * createSeedState() then subtracts items already held by pending or confirmed reservations.
 */
function createSeedState() {
  const categories = [
    {
      id: 1,
      name: "Books",
      description: "Printed books and small things for reading.",
    },
    {
      id: 2,
      name: "Electronics",
      description: "Small devices, cables, and desk accessories.",
    },
    {
      id: 3,
      name: "Kitchen",
      description: "Everyday tools for cooking and drinking.",
    },
    {
      id: 4,
      name: "Outdoor",
      description: "Gear for walks, picnics, and trips.",
    },
  ];

  const products = [
    {
      id: 1,
      name: "Grid Notebook",
      description: "A5 notebook with dotted pages.",
      price: 4.5,
      stock: 40,
      categoryId: 1,
      image: "/images/notebook.svg",
    },
    {
      id: 2,
      name: "The Quiet Harbor",
      description: "A short novel about a coastal town.",
      price: 12,
      stock: 15,
      categoryId: 1,
      image: "/images/book.svg",
    },
    {
      id: 3,
      name: "Wireless Mouse",
      description: "Quiet click, works with a USB receiver.",
      price: 24.9,
      stock: 20,
      categoryId: 2,
      image: "/images/mouse.svg",
    },
    {
      id: 4,
      name: "USB-C Cable",
      description: "One meter cable for charging and data.",
      price: 9.5,
      stock: 50,
      categoryId: 2,
      image: "/images/cable.svg",
    },
    {
      id: 5,
      name: "Desk Lamp",
      description: "Warm light with three brightness levels.",
      price: 32,
      stock: 8,
      categoryId: 2,
      image: "/images/lamp.svg",
    },
    {
      id: 6,
      name: "Coffee Mug",
      description: "Ceramic mug, 300 ml.",
      price: 8,
      stock: 30,
      categoryId: 3,
      image: "/images/mug.svg",
    },
    {
      id: 7,
      name: "Tea Kettle",
      description: "Stovetop kettle in brushed steel.",
      price: 27.5,
      stock: 12,
      categoryId: 3,
      image: "/images/kettle.svg",
    },
    {
      id: 8,
      name: "Water Bottle",
      description: "Steel bottle, 750 ml, keeps drinks cold.",
      price: 14,
      stock: 18,
      categoryId: 4,
      image: "/images/bottle.svg",
    },
    {
      id: 9,
      name: "Picnic Blanket",
      description: "Fold-up blanket with a water resistant back.",
      price: 22,
      stock: 10,
      categoryId: 4,
      image: "/images/blanket.svg",
    },
  ];

  const reservations = [
    {
      id: 1,
      productId: 3,
      unitPrice: 24.9,
      quantity: 1,
      total: 24.9,
      status: "pending",
      customer: {
        name: "Lena Ortiz",
        email: "lena.ortiz@example.com",
        phone: "+33 6 12 00 11 22",
        address: "8 Avenue des Tilleuls",
        city: "Nantes",
        postalCode: "44000",
      },
      notes: "Please gift wrap it.",
      createdAt: "2026-11-02T09:15:00.000Z",
      updatedAt: "2026-11-02T09:15:00.000Z",
    },
    {
      id: 2,
      productId: 6,
      unitPrice: 8,
      quantity: 2,
      total: 16,
      status: "confirmed",
      customer: {
        name: "Noah Bernard",
        email: "noah.bernard@example.com",
        phone: null,
        address: "21 Quai Saint-Pierre",
        city: "Lyon",
        postalCode: "69005",
      },
      notes: "",
      createdAt: "2026-11-03T14:40:00.000Z",
      updatedAt: "2026-11-04T08:05:00.000Z",
    },
    {
      id: 3,
      productId: 2,
      unitPrice: 12,
      quantity: 1,
      total: 12,
      status: "cancelled",
      customer: {
        name: "Ines Morel",
        email: "ines.morel@example.com",
        phone: "+33 7 45 10 20 30",
        address: "3 Place du Marché",
        city: "Bordeaux",
        postalCode: "33000",
      },
      notes: "Cancelled because I already own this book.",
      createdAt: "2026-11-01T16:20:00.000Z",
      updatedAt: "2026-11-01T18:02:00.000Z",
    },
  ];

  for (const reservation of reservations) {
    if (reservation.status === "cancelled") continue;
    const product = products.find((item) => item.id === reservation.productId);
    product.stock -= reservation.quantity;
  }

  return {
    categories,
    products,
    reservations,
    nextCategoryId: 5,
    nextProductId: 10,
    nextReservationId: 4,
  };
}

module.exports = { createSeedState };
