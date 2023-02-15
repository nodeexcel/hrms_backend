const express = require("express");
const router = express.Router();
const validators = require("../validators/req-validators");
const inventoryControllers = require("../controllers/inventory-controller");
const handlers = require("../util/responseHandlers");
const middleware = require("../middleware/Auth");

router.post(
  "/add_office_machine",
  middleware.AuthForHrAdmin,
  validators.machineCreationValidator,
  inventoryControllers.inventoryController,
  handlers.responseForData
);
router.post(
  "/assign_user_machine",
  middleware.AuthForHrAdmin,
  validators.AssignUserMachineValidator,
  inventoryControllers.AssignUserMachineController,
  handlers.responseForInventory
);
router.post(
  "/add_inventory_audit",
  middleware.AuthForHrEmployee,
  validators.inventoryAuditValidator,
  inventoryControllers.inventoryAuditController,
  handlers.responseForInventory
);

router.post(
  "/get_my_inventories",
  middleware.AuthForHrEmployee,
  inventoryControllers.getMyInventoryController,
  handlers.responseForInventory
); //done

router.post(
  "/get_machine",
  middleware.AuthForHrEmployee,
  inventoryControllers.getMachineController,
  handlers.responseForInventory
);

router.post(
  "/get_office_machine",
  middleware.AuthForAdmin,
  inventoryControllers.inventoryGetController,
  handlers.responseForInventory
);
router.post(
  "/get_machine_status_list",
  middleware.AuthForHrAdmin,
  inventoryControllers.getMachineStatusController,
  handlers.responseForInventory
); //done

router.post(
  "/add_machine_status",
  middleware.AuthForHrAdmin,
  validators.MachineStatusValidator,
  inventoryControllers.addMachineStatusController,
  handlers.responseForInventory
);
router.post(
  "/delete_machine_status",
  middleware.AuthForHrAdmin,
  validators.MachineStatusDeleteValidator,
  inventoryControllers.deleteMachineStatusController,
  handlers.responseForInventory
);

router.post(
  "/get_machine_count",
  middleware.AuthForHrAdmin,
  inventoryControllers.getMachineCountController,
  handlers.responseForInventory
);
router.post(
  "/get_machine_type_list",
  middleware.AuthForHrAdmin,
  inventoryControllers.getMachineTypeController,
  handlers.responseForInventory
);

router.post(
  "/add_machine_type",
  middleware.AuthForHrAdmin,
  validators.addMachineTypeValidator,
  inventoryControllers.addMachineTypeController,
  handlers.responseForAddMachine
);

router.post(
  "/get_machines_detail",
  middleware.AuthForHrAdmin,
  inventoryControllers.getMachinesDetailController,
  handlers.responseForInventory
);
router.post(
  "/get_unapproved_inventories",
  middleware.AuthForHrAdmin,
  inventoryControllers.getUnapprovedInventoryControllers,
  handlers.responseForInventory
);

router.post(
  "/update_office_machine",
  middleware.AuthForHrAdmin,
  validators.UpdateMachineValidator,
  inventoryControllers.inventoryUpdateMachineController,
  handlers.responseForInventory
);

router.post(
  "/get_unassigned_inventories",
  middleware.AuthForAdmin,
  inventoryControllers.getUnassignedInventoryController,
  handlers.responseForInventory
);
router.post(
  "/get_inventory_audit_status_month_wise",
  middleware.AuthForAdmin,
  inventoryControllers.monthwiseAuditStatusController,
  handlers.responseForInventory
);
router.post(
  "/get_temp_uploaded_inventory_files",
  middleware.AuthForAdmin,
  inventoryControllers.getTempFilesController,
  handlers.responseForInventory
);

router.post(
  "/delete_temp_uploaded_inventory_file",
  middleware.AuthForAdmin,
  inventoryControllers.deleteTempFilesControllers,
  handlers.responseForInventory
);
router.post(
  "/inventory_unassign_request",
  middleware.AuthForAdmin,
  validators.unassignRequestValidator,
  inventoryControllers.inventoryUnassignRequestController,
  handlers.responseForInventory
);
router.post(
  "/remove_machine_detail",
  middleware.AuthForAdmin,
  inventoryControllers.removeMachineController,
  handlers.responseForInventory
);

module.exports = router;
