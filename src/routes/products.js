const express = require("express");
const { wrap, requireJson } = require("../http");
const { parseRouteId, parseProductBody, parseProductQuery } = require("../validators");

function productRoutes(store) {
  const router = express.Router();

  router.get(
    "/",
    wrap((req, res) => {
      const filters = parseProductQuery(req.query);
      res.json(store.listProducts(filters));
    })
  );

  router.get(
    "/:id",
    wrap((req, res) => {
      const id = parseRouteId(req.params.id);
      res.json(store.getProduct(id));
    })
  );

  router.post(
    "/",
    requireJson,
    wrap((req, res) => {
      const input = parseProductBody(req.body);
      const created = store.createProduct(input);
      res.status(201).location(`/api/products/${created.id}`).json(created);
    })
  );

  router.put(
    "/:id",
    requireJson,
    wrap((req, res) => {
      const id = parseRouteId(req.params.id);
      const input = parseProductBody(req.body);
      res.json(store.updateProduct(id, input));
    })
  );

  router.delete(
    "/:id",
    wrap((req, res) => {
      const id = parseRouteId(req.params.id);
      store.deleteProduct(id);
      res.status(204).send();
    })
  );

  return router;
}

module.exports = { productRoutes };
