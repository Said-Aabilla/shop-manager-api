const express = require("express");
const { wrap, requireJson } = require("../http");
const {
  parseRouteId,
  parseReservationQuery,
  parseReservationCreate,
  parseReservationPatch,
} = require("../validators");

function reservationRoutes(store) {
  const router = express.Router();

  router.get(
    "/",
    wrap((req, res) => {
      const filters = parseReservationQuery(req.query);
      res.json(store.listReservations(filters));
    })
  );

  router.get(
    "/:id",
    wrap((req, res) => {
      const id = parseRouteId(req.params.id);
      res.json(store.getReservation(id));
    })
  );

  router.post(
    "/",
    requireJson,
    wrap((req, res) => {
      const input = parseReservationCreate(req.body);
      const created = store.createReservation(input);
      res.status(201).location(`/api/reservations/${created.id}`).json(created);
    })
  );

  router.patch(
    "/:id",
    requireJson,
    wrap((req, res) => {
      const id = parseRouteId(req.params.id);
      const current = store.getReservation(id);
      const patch = parseReservationPatch(req.body, current);
      res.json(store.updateReservation(id, patch));
    })
  );

  router.delete(
    "/:id",
    wrap((req, res) => {
      const id = parseRouteId(req.params.id);
      store.deleteReservation(id);
      res.status(204).send();
    })
  );

  return router;
}

module.exports = { reservationRoutes };
