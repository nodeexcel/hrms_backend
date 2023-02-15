var express = require("express");
var router = express.Router();
const validators = require("../validators/req-validators");
const userController = require("../controllers/user-controller");
const handlers = require("../util/responseHandlers");
const middleware = require("../middleware/Auth");

router.post( // this api is working fine 
  "/register",
  validators.userCreationValidator,
  userController.userRegister,
  handlers.responseForData
);
router.post( // this api is working fine 
  "/login",
  validators.userLoginValidator,
  userController.userLogin,
  handlers.responseHandle
);
router.post( // this api is working fine 
  "/add_roles",
  middleware.AuthForHrAdmin,
  validators.addRoleValidator,
  userController.addUserRole,
  handlers.addNewEmployeeResponseHandle
);
router.get(  // this api is working fine
  "/list_all_roles",
  middleware.AuthForHrAdmin,
  userController.getUserRole,
  handlers.resForList
);
router.post(  // this api is working fine
  "/add_new_employee",
  middleware.AuthForHrAdmin,
  validators.addNewEmployeeValidator,
  userController.addNewEmployeeController,
  handlers.addNewEmployeeResponseHandle
);
router.post(  // this api is working fine
  "/assign_user_role", 
  middleware.AuthForHrAdmin,
  validators.assignUserRoleValidator,
  userController.assignUserRoleController,
  handlers.addNewEmployeeResponseHandle
);
router.post(    // this api is not working because there's a model name secretToken which is not defined
  "/get_enable_user",
  middleware.AuthForHrAdmin,
  userController.getEnableUser,
  handlers.newResponse
);
router.post(   // this api is working fine
  "/update_role",
  middleware.AuthForHrAdmin,
  validators.updateRoleValidators,
  userController.updateRoleController,
  handlers.responseHandle
);

// router.get("/list_all_roles", middleware.AuthForHr, userController.listAllRolesController, handlers.responseHandle);
module.exports = router;
