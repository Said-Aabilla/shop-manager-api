const express = require("express");
const { wrap, requireJson } = require("../http");
const { parseRouteId, parseCategoryBody } = require("../validators");

function categoryRoutes(store) {
  const router = express.Router();

  router.get(
    "/",
    wrap((req, res) => {
      res.json(store.listCategories());
    })
  );

  router.get(
    "/:id",
    wrap((req, res) => {
      const id = parseRouteId(req.params.id);
      res.json(store.getCategory(id));
    })
  );

  router.post(
    "/",
    requireJson,
    wrap((req, res) => {
      const input = parseCategoryBody(req.body);
      const created = store.createCategory(input);
      res.status(201).location(`/api/categories/${created.id}`).json(created);
    })
  );

  router.put(
    "/:id",
    requireJson,
    wrap((req, res) => {
      const id = parseRouteId(req.params.id);
      const input = parseCategoryBody(req.body);
      res.json(store.updateCategory(id, input));
    })
  );

  router.delete(
    "/:id",
    wrap((req, res) => {
      const id = parseRouteId(req.params.id);
      store.deleteCategory(id);
      res.status(204).send();
    })
  );

  return router;
}

module.exports = { categoryRoutes };
