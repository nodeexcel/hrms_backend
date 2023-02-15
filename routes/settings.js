const express = require("express");
const router = express.Router();
const validators = require("../validators/req-validators");
const settignsController = require("../controllers/settings-Controller");
const handlers = require("../util/responseHandlers");
const middleware = require("../middleware/Auth");

router.post(
  "/get_generic_configuration",
  // middleware.AuthForHrEmployee,
  settignsController.get_generic_configuration,
  handlers.newResponse
);

router.post(
  "/update_config",
  middleware.AuthForHrAdmin,
  settignsController.update_config,
  handlers.responseForAddMachine
);

router.post(
  "/get_average_working_hours",
  middleware.AuthForHrAdmin,
  settignsController.get_average_working_hours,
  handlers.responseForAddMachine
);
router.post(
  "/save_policy_document",
  middleware.AuthForHrAdmin,
  settignsController.save_policy_document,
  handlers.responseForAddMachine
);
router.post(
  "/get_all_secret_keys",
  middleware.AuthForHrAdmin,
  settignsController.get_all_secret_keys,
  handlers.responseForAddMachine
);
router.post(
  "/generate_secret_key",
  middleware.AuthForHrAdmin,
  settignsController.generate_secret_key,
  handlers.responseForAddMachine
);
router.post(
  "/regenerate_secret_key",
  middleware.AuthForHrAdmin,
  settignsController.regenerate_secret_key,
  handlers.responseForAddMachine
);
router.post(
  "/delete_secret_key",
  middleware.AuthForHrAdmin,
  settignsController.delete_secret_key,
  handlers.responseForAddMachine
);
router.post(
  "/get_all_pages",
  middleware.AuthForHrAdmin,
  settignsController.get_all_pages,
  handlers.responseForAddMachine
);
router.post(
  "/delete_attendance_stats_summary",
  middleware.AuthForHrAdmin,
  settignsController.delete_attendance_stats_summary,
  handlers.responseForAddMachine
);
router.post(
  "/get_employees_leaves_stats",
  middleware.AuthForHrAdmin,
  settignsController.get_employees_leaves_stats,
  handlers.responseForAddMachine
);
router.post(
  "/get_employees_history_stats",
  middleware.AuthForHrAdmin,
  settignsController.get_employees_history_stats,
  handlers.responseForAddMachine
);
router.post(
  "/get_stats_attendance_summary",
  middleware.AuthForHrAdmin,
  settignsController.get_stats_attendance_summary,
  handlers.responseForAddMachine
);
module.exports = router;