const {
  PAGE_login,
  PAGE_logout,
  PAGE_my_inventory,
  PAGE_policy_documents,
  getAllPages,
  getAllActions,
} = require("./roles");

const jwt = require("jsonwebtoken");
const secret = require("./config.json");
const {Op,QueryTypes, json } = require("sequelize");
const db = require("./db");
const { sequelize } = require("./db");
const { MachineStatusDeleteValidator } = require("./validators/req-validators");
const user = require("./models/userModel");
const { Query } = require("pg");

let getPageById = async (id) => {
  let data;
  let all = await getAllPages();
  for (let item in all) {
    if (all[item].id == id) {
      data = all[item];
    }
  }
  return data;
};


let getRolePages = async (roleid, models) => {
  let rows = await models.sequelize.query(`Select * from roles_pages 
  where roles_pages.role_id = '${roleid}'`,
  //  {type: QueryTypes.SELECT}
   );
  if (rows.length > 0) {
    let data = await Promise.all(
      rows.map(async (doc) => {
        doc = JSON.parse(JSON.stringify(doc));
        let obj = { ...doc };
        let page = await getPageById(doc.page_id);
        obj.page_name = page ? page.name: null;
        return obj;
      })
    );
    return data;
  }
};

let getActionById = async (id) => {
  let data=false;
  let all = await getAllActions();
  for(let[key,elem] of Object.entries(all)){
    if (elem.id == id) {
      data = elem;
    }
  }
  return data;
};

let getRoleActions = async (roleid, models) => {
  // let rows = await models.sequelize.query(`Select * from roles_actions where roles_actions.role_id='${roleid}'`, 
  // {type:QueryTypes.SELECT})
  let rows = await models.RolesAction.findAll({
    where: { role_id: roleid },
  });
  if (rows.length > 0) {
    let data = await Promise.all(
      rows.map(async (doc) => {
        doc = JSON.parse(JSON.stringify(doc));
        let obj = { ...doc };
        let action = await getActionById(doc.action_id);
        obj.action_name = action.name;
        return obj;
      })
    );
    rows =  data;
  }
  return rows;
};

let getUserDetailInfo =async(userid,req,models)=>{
  let r_error=1;
  let r_message = "";
  user_bank_detail = await getUserBankDetail(userid,req,models);
  user_profile_detail =await getUserprofileDetail(userid,req,models);
  user_assign_machine = await getUserAssignMachines(userid,req,models);
  let Return ={};
  Return.error=r_error;
  Return.data.user_profile_detail;
  Return.data.user_bank_detail;
  Return.data.user_assign_machine;
  return Return;
}

let getUserBankDetail=async(userid,req,models)=>{
  let query=await models.sequelize.query(`SELECT * FROM user_bank_details WHERE "user_Id" = ${userid}`,
  // {type:QueryTypes.SELECT}
  )
  let arr="";
  arr=query;
  return arr;
}
let getUserprofileDetail=async(userid,req,models)=>{
  let query=await models.sequelize.query(`SELECT users.status, users.username, users.type, user_profile.* 
  FROM users 
  LEFT JOIN user_profile ON users.id = user_profile."user_Id" 
  where 
  users.status = 'Enabled' AND users.id = ${userid}`,
  // {type:QueryTypes.SELECT}
  )
  if(query[0].type==Admin){
    delete query[0].holding_comments;
  }
  return query;
}
// let registerRole=async(user)=>{
// let allRoles=await db.Role.findOne({where:{name:user.type}});
// await db.UserRole.create(user.id,allRoles.id);
// }

// let getRoleNotifications = async (roleid, models) => {
//   let query =
//     await models.RolesNotification.findAll({
//       where: { role_id: roleid },
//     });
//   if (query.length > 0) {
//     let getNotificationById = async (id) => {
//       let data;
//       let all = await getAllNotifications();
//       for (let item in all) {
//         if (all[item].id == id) {
//           // return item;
//           data = all[item];
//         }
//       }
//       return data;
//     };
//     let data = await Promise.all(
//       query.map(async (doc) => {
//         doc = JSON.parse(JSON.stringify(doc));
//         let obj = { ...doc };
//         let notification =
//           await getNotificationById(
//             doc.notification_id
//           );
//         obj.notification_name = notification.name;
//         return obj;
//       })
//     );
//     return data;
//   }
// };
// configured new laptop
let getRolePagesForSuperAdmin = async () => {
  let data = await getGenericPagesForAllRoles();
  let allPages = await getAllPages();
  allPages.forEach((page) => {
    newPage = { page_id: page.id, page_name: page.name };
    data.push(newPage);
  });
  let sorted_Data = data.sort();
  return sorted_Data;
};


let getGenericPagesForAllRoles = async () => {
  let data = [];
  let allPages = await getAllPages();
  for (let page in allPages) {
    let pid = allPages[page].id;
    if (
      pid == PAGE_login ||
      pid == PAGE_logout ||
      pid == PAGE_policy_documents ||
      pid == PAGE_my_inventory
    ) {
      let newPage = {
        page_id: allPages[page].id,
        page_name: allPages[page].name,
      };
      data.push(newPage);
    }
  }
  return data;
};


// let _getEmployeeProfilePhoto = async (profileInfo) => {
//   let profileImage;
//   if (
//     profileInfo.slack_profile.profile.image_original != null
//   ) {
//     profileImage = profileInfo.slack_profile.image_original;
//   } else {
//     let uploadedImage;
//     if (profileInfo.image != null) {
//       uploadedImage = profileInfo.image;
//     }
//     if (uploadedImage != null) {
//       if (uploadedImage.indexOf("avatar.slack") !== false) {
//         profileImage = uploadedImage;
//       } else {
//         profileImage = `${process.env.BASEURL}backend/attendance/uploads/profileImages/${profileInfo["image"]}`;
//       }
//     }
//   }
//   return profileImage;
// };

let getUserInfo = async (userid, models) => {
  try {
    let isAdmin;
    let q = await models.sequelize.query(`SELECT users.*, user_profile.*, 
    roles.id as role_id, 
    roles.name as role_name FROM users 
    LEFT JOIN user_profile ON users.id = user_profile.user_Id 
    LEFT JOIN user_roles ON users.id = user_roles.user_id 
    LEFT JOIN roles ON user_roles.role_id = roles.id where users.id = ${userid} `,
    // {type: QueryTypes.SELECT}
    );
    if(isAdmin == null){
      delete q.holding_comments;
    }
    // let userSlackInfo = await getSlackUserInfo(q.work_email);
    // q.slack_profile = userSlackInfo;
    return q;
  } catch (error) {
    console.log(error)
    throw new Error(error);
  }
};


let getUserInfoByWorkEmail = async (workEmailId, models) => {
  let userProfile = await models.UserProfile.findOne({
    where: { work_email: workEmailId },
  });
  let user = await models.User.findOne({ where: { id: userProfile.user_Id } });
  let user_roles = await models.UserRole.findOne({
    where: { user_id: user.id },
  });
  let roles = await models.Role.findOne({
    where: { id: user_roles.role_id },
  });
  //  let userSlackInfo = getSlackUserInfo(workEmailId);
  let data = [];
  data.userProfile = userProfile;
  data.user = user;
  data.user_roles;
  data.roles = roles;
  //  data.slack_profile = userSlackInfo;
  return data;
};


let getRoleCompleteDetails = async (roleId, models) => {
  let data;
  let query = await models.sequelize.query(`SELECT * from roles where roles.id = ${roleId} `,
  // {type: QueryTypes.SELECT}
  )
  query = JSON.parse(JSON.stringify(query));
  if (query.length > 0) {
    let role = query[0];
    let pages = await getRolePages(roleId, models)
    let actions = await getRoleActions(roleId, models);
    // let notification = await getRoleNotifications(
    //   roleId, models
    // );
    role.role_pages = pages;
    role.role_actions = actions;

    // role.role_notifications = notification;
    data = role;
  }
  return data;
};


let getUserRole = async (userId, models) => {
  let data = false;
  let userInfo = await getUserInfo(userId, models);
  if ((typeof userInfo[0].role_id !== undefined) && ( userInfo[0].role_id !== null)) {
    let roleCompleteDetails = await getRoleCompleteDetails(
      userInfo[0].role_id,
      models
    );

    data = roleCompleteDetails;
  }
  return data;
};


let getRolePagesForApiToken = async (roleid, models) => {
  let data = await getGenericPagesForAllRoles();
  let rolesPages = await getRolePages(roleid, models);
  if (rolesPages != null) {
    rolesPages.forEach((rp) => {
      data.push(rp);
    });
  }
  let sorted_Data = data.sort();
  return sorted_Data;
};



let checkifPageEnabled = async (page_id, models) => {
  let query = await models.RolesPage.findAll({
    where: {
      [Op.and]: [{ page_id: page_id }, { is_enabled: true }],
    },
  });
  if (query.length > 0) {
    return true;
  } else {
    return false;
  }
};


let getInventoriesRequestedForUnassign = async (models) => {
  let query = await models.MachineList.findAll(
    { attributes: [["id", "machine_id"]] },
    { where: { is_unassign_request: 1 } }
  );
  return query;
};

let getInventoriesRequestedForOwnershipChange = async (models) => {
  let query = await models.MachineList.findAll(
    { attributes: [["id", "machine_id"]] },
    { where: { ownership_change_req_by_user: 1 } }
  );
  return query;
};

let randomString = async(length) => {
  let result           = '';
  let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}


let getUserInventories = async (userid, models, userRole = false) => {
  let data = false;
  let query = await models.MachineUser.findAll({ where: { user_Id: userid } });
  let roleName;
  if (userRole == false) {
    let roleDetails = await getUserRole(userid, models);
// console.log(23432);
//     console.log(roleDetails.name);
    if (typeof roleDetails.name!="undefined") {
      roleName = roleDetails.name;
    }
  } else {
    roleName = userRole;
  }
  if (
    roleName.toLowerCase() == "hr" ||
    roleName.toLowerCase() == "inventory manager"
  ) {
    let unassignRequestInventories = await getInventoriesRequestedForUnassign(
      models
    );
    query = query.concat(unassignRequestInventories);
    if (query.length > 1) {
      let tempExists = [];
     for(let [key,inv] of Object.entries(query)){
        if (tempExists.includes(inv.machine_id)) {
          delete key;
        }
        tempExists.push(inv.machine_id)
    }
    }
  }
  if (
    roleName.toLowerCase() == "hr" ||
    roleName.toLowerCase() == "inventory manager"
  ) {
    let ownershipChangeRequestInventories =
      await getInventoriesRequestedForOwnershipChange(models);
    query = query.concat(ownershipChangeRequestInventories);
    if (query.length > 1) {
      let tempExists = [];
      for(let[key,inv] of Object.entries(query)){
        if (tempExists.includes(inv.machine_id)) {
          delete key;
        }
        tempExists.push(inv.machine_id);
      }
    }
  }
  if (query.length == 0) {
  } else {
    data = query;
  }
  return data;
};

let getRolesForPage = async (page_id, models) => {
  let roles = [];
  let query = await models.sequelize.query(`SELECT * FROM roles_pages WHERE page_id = ${page_id}`,
  // {type:QueryTypes.SELECT}
  );
  
  for (let ele in query) {
    let role = await getRoleCompleteDetails(query[ele].role_id, models);
    roles.push(role.name.toLowerCase());
  }
  return roles;
};

let getInventoryComments = async (inventory_id, models) => {
  let row = await models.sequelize.query(`SELECT inventory_comments.*, 
  p1.name as updated_by_user, 
  p1.jobtitle as updated_by_user_job_title, 
  p2.name as assign_unassign_user_name, 
  p2.jobtitle as assign_unassign_job_title FROM inventory_comments 
  LEFT JOIN user_profile as p1 ON inventory_comments.updated_by_user_id = p1.user_Id 
  LEFT JOIN user_profile as p2 ON inventory_comments.assign_unassign_user_id = p2.user_Id 
  where inventory_id=${inventory_id} ORDER BY updated_at DESC`,
  // {type: QueryTypes.SELECT}
  );
  // JSON.parse(JSON.stringify(row))
  return row;
};


let getInventoryHistory = async (inventory_id, models) => {
  let inventoryComments = await getInventoryComments(inventory_id, models);
  return inventoryComments;
};


let _getDateTimeData = async () => {
  let data = {};
  let currentTimeStamp = Math.floor(new Date().getTime() / 1000);
  data.current_timestamp = currentTimeStamp;
  data.current_date_number = new Date().getDate();
  data.current_month_number = new Date().getMonth() + 1;
  data.current_year_number = new Date().getFullYear();
  let date = new Date();
  data.todayDate_Y_m_d =
    date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  return data;
};


let getInvenoryAuditFullDetails = async (audit_id, models) => {
  let Return = {};
  let q = await models.sequelize.query(`select 
  inventory_audit_month_wise.id,
  inventory_audit_month_wise.inventory_id,
  inventory_audit_month_wise.month,
  inventory_audit_month_wise.year,
  inventory_audit_month_wise.updated_at,
  user_profile.name as audit_done_by_user_name,
  user_profile.work_email audit_done_by_user_email,
  inventory_comments.comment as audit_comment,
  inventory_comments.comment_type
  from 
  inventory_audit_month_wise
  left join user_profile on inventory_audit_month_wise.audit_done_by_user_id = user_profile.user_Id
  left join inventory_comments on inventory_comments.id = inventory_audit_month_wise.inventory_comment_id
  where 
  inventory_audit_month_wise.id = ${audit_id}`,
  // {type:QueryTypes.SELECT}
  );
  if (q.length==0){

  }else{
    Return = q[0];
  }
  return Return
};


let getInventoryAuditStatusforYearMonth = async (inventory_id, year,month, models) => {
  let data = [];
  let q = await models.InventoryAuditMonthWise.findAll({
    where: {
      [Op.and]: [
        { inventory_id: inventory_id },
        { year: year },
        { month: month },
      ],
    },
  });
  if (q.length == 0) {
  } else {
    let row = q[0];
    data = await getInvenoryAuditFullDetails(row.id, models);
  }
  return data;
};


let getInventoryFullDetails = async (id,hide_assigned_user_info = false,models) => {
 let row = await models.sequelize.query(`select 
  machines_list.*,
  machines_user.user_Id,
  machines_user.assign_date,
  user_profile.name,
  user_profile.work_email,
  f1.file_name as fileInventoryInvoice,
  f2.file_name as fileInventoryWarranty,
  f3.file_name as fileInventoryPhoto 
  from 
  machines_list 
  left join machines_user on machines_list.id = machines_user.machine_id 
  left join user_profile on machines_user.user_Id = user_profile.user_Id 
  left join files as f1 ON machines_list.file_inventory_invoice = f1.id 
  left join files as f2 ON machines_list.file_inventory_warranty = f2.id 
  left join files as f3 ON machines_list.file_inventory_photo = f3.id 
  where 
  machines_list.id = ${id}`,
  // {type:QueryTypes.SELECT}
  )
  let r_error = 0;
  let inventoryHistory = await getInventoryHistory(id, models);
      row=JSON.parse(JSON.stringify(row));
  row[0].history = inventoryHistory;
  let assignedUserInfo = [];
  if (hide_assigned_user_info == false) {
    if (row.user_Id != null) {
      let raw_assignedUserInfo = await getUserInfo(
        row.user_Id,
        models
      );
      assignedUserInfo.name = raw_assignedUserInfo.name;
      assignedUserInfo.jobtitle = raw_assignedUserInfo.jobtitle;
      assignedUserInfo.work_email = raw_assignedUserInfo.work_email;
      // userProfileImage = await _getEmployeeProfilePhoto(raw_assignedUserInfo);
      // assignedUserInfo.profileImage = userProfileImage;
    }
  } 
  row[0].assigned_user_info = assignedUserInfo;
  if (
    typeof row.ownership_change_req_by_user != "undefined" &&
    row.ownership_change_req_by_user * 1 > 0
  ) {
    let ownershipRequestedByUser = await getUserInfo(
      row.ownership_change_req_by_user,models
    );
    if (typeof ownershipRequestedByUser.name !== "undefined") {
      row.ownership_change_req_by_user = ownershipRequestedByUser.name;
    }
  }
  let currentMonthAuditStatus = {};
  let dateTimeData = await _getDateTimeData();
  currentMonthAuditStatus.year = dateTimeData.current_year_number;
  currentMonthAuditStatus.month = dateTimeData.current_month_number;
  currentMonthAuditStatus.status = await getInventoryAuditStatusforYearMonth(id,dateTimeData.current_year_number,dateTimeData.current_month_number,models );
  row[0].audit_current_month_status = currentMonthAuditStatus;
  if (
    typeof row.file_inventory_invoice != "undefined" &&
    row.file_inventory_invoice != null
  ) {
    row.file_inventory_invoice = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_invoice}`;
  }
  if (
    typeof row.file_inventory_warranty != "undefined" &&
    row.file_inventory_warranty != null
  ) {
    row.file_inventory_warranty = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_warranty}`;
  }
  if (
    typeof row.file_inventory_photo != "undefined" &&
    row.file_inventory_photo != null
  ) {
    row.file_inventory_photo = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_photo}`;
  }
  return row[0];
};

  let isInventoryAuditPending = async (userid, models) => {
    let isAuditPending = false;
    let userInventories = await getUserInventories(userid, models);             
    if (userInventories == false) {
    } else {
      let hide_assigned_user_info = true;
      for (let ele in userInventories) {
        let i_details = await getInventoryFullDetails(
          userInventories[ele].dataValues.machine_id,
          hide_assigned_user_info,
          models
        );
        console.log(i_details,12112)
        if (i_details.audit_current_month_status.status == null) {
          isAuditPending = true;
        }
      }
      return isAuditPending;
    }
  };


let getUserPolicyDocument = async (userid, models) => {
  let r_error = 1;
  let r_message;
  let r_data = [];

  let q1 = await models.UserProfile.findOne({ where: { user_Id: userid } });
  let ar0 = JSON.parse(q1.policy_document);
  let q2 = await models.Config.findOne({ where: { type: "policy_document" } });
  let ar1 = JSON.parse(q2.value);
  let arr = [];
  if (ar0 == null) {
    for (let v2 in ar1) {
      console.log(v2)
      ar1[v2].read = 0;
      let mandatory = 1;
      if (typeof ar1[v2].mandatory !== "undefined") {
        mandatory = ar1[v2].mandatory;
      }
      ar1[v2].mandatory = mandatory;
      arr.push(ar1[v2]);
    }
  }
  if (ar0 != null) {
    for (let v3 in ar1) {
      if (ar0.includes(ar1[v3].name)) {
        ar1[v3].read = 1;
        arr.push(ar1.v3);
      } else {
        ar1[v3].read = 1;
        arr.push(ar1[v3]);
      }
    }
  }
  r_error = 0;
  r_data = arr;
  let data = [];
  data.error = r_error;
  data.data = r_data;
  return data;
};

const is_policy_documents_read_by_user = async (userid, models) => {
  let data = true;
  let allDocumentsResult = await getUserPolicyDocument(userid, models);
  let allDocuments = allDocumentsResult.data;
  if (Array.isArray(allDocuments)) {
    for (let doc in allDocuments) {
      if (allDocuments[doc].read != 1 && allDocuments[doc].mandatory == 1) {
        data = false;
      }
    }
  }
  return data;
};


let isUnassignInventoriesRequestPending = async (models) => {
  let unassignRequestInventories = await getInventoriesRequestedForUnassign(
    models
  );
  if (unassignRequestInventories.length > 0) {
    return true;
  }
  return false;
};


let isOwnershipChangeInventoriesRequestPending = async (models) => {
  let ownershipChangeRequestInventories =
    await getInventoriesRequestedForOwnershipChange(models);
  if (ownershipChangeRequestInventories.length > 0) {
    return true;
  }
  return false;
};

let generateUserToken = async (userId, models,addOns = false) => {
  let userInfo = await getUserInfo(userId, models);
  let u;
  if (userInfo.length == 0) {
  } else {
    let userRole;
    if (userInfo[0].type.toLowerCase() == "admin") {
      userRole = userInfo[0].type;
    } else {
      let roleInfo = await getUserRole(userInfo[0].user_Id, models);
      if (roleInfo != null) {
        userRole = roleInfo.name;
      }
    }
    u = {
      id: userInfo[0].user_Id,
      username: userInfo[0].username,
      role: userRole,
      name: userInfo[0].name,
      jobtitle: userInfo[0].jobtitle,
      // profileImage : userProfileImage,
      login_time: new Date().getTime(),
      login_date_time: new Date(),
      // eth_token : userInfo.users.eth_token,
    };
    let roleAction = [];
    if (userInfo[0].type.toLowerCase() == "admin") {
      u.role_pages = await getRolePagesForSuperAdmin();
    } else {
      let roleInfo = await getUserRole(userInfo[0].user_Id, models);
      if (roleInfo != null&&typeof roleInfo.role_pages!="undefined") {
        let role_pages = await getRolePagesForApiToken(
          roleInfo.id,
          models
        );
          for (let [key,page] of Object.entries(role_pages)) {
          if (!await checkifPageEnabled(page.page_id, models)) {
            delete role_pages.page;
          }
        }
        u.role_pages = role_pages;
      }
      if (roleInfo !== null &&roleInfo.role_actions!="undefined") {
        let role_actions = roleInfo.role_actions;
        for(let[key,value] of Object.entries(role_actions)) {
          roleAction.push(value.action_name);
        }
      }
    }
    u.role_actions = roleAction;
    u.is_policy_documents_read_by_user = 1;
    u.is_inventory_audit_pending = 0;
    if (userInfo[0].type.toLowerCase() == "admin") {
      if (await isInventoryAuditPending(userInfo[0].user_Id, models)) {
        console.log("at line 717")
        let generic_pages = await getGenericPagesForAllRoles();
        u.right_to_skip_inventory_audit = 1;
        u.is_inventory_audit_pending = 1;
        generic_pages.forEach(async(ele) => {
          if (!await checkifPageEnabled(ele.page_id, models)) {
            delete key;
          }
        });
        u.role_pages = generic_pages;
      }

      // let isValidGoogleDriveTokenExistsStatus = await isValidGoogleDriveTokenExists();
      // u.is_valid_google_drive_token_exists = isValidGoogleDriveTokenExistsStatus
    } else {
      let generic_pages = await getGenericPagesForAllRoles();
      let is_policy_document_read_by_user =
        await is_policy_documents_read_by_user(
          userInfo[0].user_Id,
          models
        );
      if (is_policy_document_read_by_user == false) {
        u.is_policy_documents_read_by_user = 0;
        for(let[key,generic] of Object.entries(generic_pages) ){
          if (!await checkifPageEnabled(generic.page_id, models)) {
            delete key;
          }
        }
        u.role_pages = generic_pages;
      }
      let hasUnassignRequestInventories = false;
      let hasOwnershipChangeInventoriesRequestPending = false;
      if (userInfo[0].type.toLowerCase() == ("hr" || "inventory manager")) {
        hasUnassignRequestInventories =
          await isUnassignInventoriesRequestPending(models);
        hasOwnershipChangeInventoriesRequestPending =
          await isOwnershipChangeInventoriesRequestPending(models);
      }
      if (
        (await isInventoryAuditPending(userInfo[0].user_Id, models)) ||
        hasUnassignRequestInventories ||
        hasOwnershipChangeInventoriesRequestPending
      ) {
        u.is_inventory_audit_pending = 1;
        for(let[key,generic] of Object.entries(generic_pages)) {
          if (!await checkifPageEnabled(generic.page_id, models)) {
            delete key;
          }
        }
        // if (
        //   addOns.skip_inventory_audit &&
        //   userInfo[0].type.toLowerCase() ==
        //     ("hr" || "inventory manager" || "hr payroll manager")
        // ) {
        // } else {
        //   u.role_pages = generic_pages;
        // }
        u.role_pages = generic_pages;
      }
      if (
        userInfo[0].type.toLowerCase() ==
        ("hr" || "inventory manager" || "hr payroll manager")
      ) {
        if (u.is_inventory_audit_pending == 1) {
          // if (addOns.skip_inventory_audit) {
          //   u.is_inventory_audit_pending = 0;
          // } else {
          //   u.right_to_skip_inventory_audit = 1;
          // }
          u.right_to_skip_inventory_audit = 1;
        }
      }
    }

    for (let [key,page] of Object.entries(u.role_pages)) {
      let roles = await getRolesForPage(page.page_id, models);
      u.role_pages[key].roles = roles;
    }
  }
  // let token = jwt.sign({ data: u }, secret.jwtSecret, {
    let token = jwt.sign( u, secret.jwtSecret, {
    expiresIn: "2hr",
  });
  return token;
};

const refreshToken = async (oldToken, models, addOns = false) => {
  let Return = oldToken;
  let ReturnedData = await isValidTokenAgainstTime(oldToken);
  if (ReturnedData) {
    oldToken = oldToken.split(" ");
    const checkJwt = await jwt.verify(oldToken[1], secret.jwtSecret);
    let loggedUserInfo = jwt.decode(oldToken[1]);
    let loggedUserInfo_userid = loggedUserInfo.data.id;
    Return = await generateUserToken(loggedUserInfo_userid,models, addOns);
  }
  return Return;
};

const isValidTokenAgainstTime = async (token) => {
  let Return = true;
  token = token.split(" ");
  const checkJwt = await jwt.verify(token[1], secret.jwtSecret);
  let tokenInfo = jwt.decode(token[1]);
  if (typeof tokenInfo != undefined && tokenInfo.data.login_time != "") {
    let token_start_time = tokenInfo.data.login_time;
    let current_time = new Date().getTime();
    let time_diff = current_time - token_start_time;
    let mins = time_diff / 60000;
    if (mins > 60) {
      Return = false;
    }
  } else {
    Return = false;
  }
};

let getMachineDetail = async (id, models) => {
  try {
    let error = 1;
    let row = {};
    let q =await models.sequelize.query(`select 
      machines_list.*,
      machines_user.user_Id,
      machines_user.assign_date ,
      f1.file_name as fileInventoryInvoice,
      f2.file_name as fileInventoryWarranty,
      f3.file_name as fileInventoryPhoto
      from 
      machines_list 
      left join machines_user on machines_list.id = machines_user.machine_id
      left join files as f1 ON machines_list.file_inventory_invoice = f1.id
      left join files as f2 ON machines_list.file_inventory_warranty = f2.id
      left join files as f3 ON machines_list.file_inventory_photo = f3.id
      where 
      machines_list.id = ${id}`,
      // { type:QueryTypes.SELECT}
      );
      row.q=q;
    const inventoryHistory = await getInventoryHistory(id, models);
    row.history = inventoryHistory;
    let Return = {};
    Return.error = error;
    Return.data = row;
    return Return;
  } catch (error) {
    throw new Error("Unable to locate all users");
  }
};

const api_addInventoryAudit = async (
  loggedUserInfo,
  inventory_id,
  logged_user_id,
  audit_comment_type,
  audit_message,
  models,req
) => {
  const addInventoryAudit1=  await addInventoryAudit(loggedUserInfo,inventory_id,logged_user_id,audit_comment_type,audit_message,models,req);
  let messageBody = [];
  if (audit_comment_type == "issue" || audit_comment_type == "critical_issue") {
    let inventoryDetails = await getMachineDetail(inventory_id, models);
    messageBody.issueType =
      audit_comment_type == "issue" ? "Issue" : "Critical Issue";
    messageBody.inventoryName = inventoryDetails.data.machine_name;
    messageBody.inventoryType = inventoryDetails.data.machine_type;
    messageBody.message = audit_message;
  }
  if (
    typeof loggedUserInfo != "undefined" &&
    typeof loggedUserInfo.role != undefined
  ){
   let loggedUserRole =loggedUserInfo.role.toLowerCase();
   if(loggedUserRole=='admin'||loggedUserRole == 'hr'||loggedUserRole=='inventory manager'){
     if(typeof inventoryDetails!=undefined){
      inventoryDetails=await getMachineDetail(inventory_id,models)
     }
     if(typeof inventoryDetails.data!="undefined" &&typeof inventoryDetails.data.user_Id!="undefined"){
      let assignedUsedId = inventoryDetails.data.user_id;
      if(assignedUsedId!=null){
      audit_comment_type = audit_comment_type.replace("_"," ")
      audit_comment_type = audit_comment_type.toLowerCase().replace(/\b[a-z]/g, function(letter) {
      return letter.toUpperCase();
      });
      messageBody.issueType = audit_comment_type ;
      messageBody.inventoryName=inventoryDetails.data.machine_name;
      messageBody.inventoryType=inventoryDetails.data.machine_type;
      messageBody.message  = audit_message;
   }
  }
}
  }
  Return = [];
  Return.error = 0;
  Return.message = 'Audit added for inventory successfully!!';
  Return.data = [];
  return Return;

};

const addInventoryAudit= async(loggedUserInfo,inventory_id,updated_by_user_id,audit_comment_type,audit_comment,models,req)=>{
  inventory_id = typeof inventory_id!="undefined" ? inventory_id : "";
  audit_done_by_user_id = updated_by_user_id ? updated_by_user_id : "";
  audit_comment_type    = audit_comment_type ? audit_comment_type : "";
  audit_message         = audit_comment ? audit_comment : "";
  let dateTimeData = await _getDateTimeData();
  let audit_month  = dateTimeData.current_month_number;
  let audit_year   = dateTimeData.current_year_number;
  let inventory_comment_id  = await addInventoryComment(inventory_id,loggedUserInfo.id,models,req);
  let q = await models.sequelize.query(`INSERT INTO inventory_audit_month_wise
  ( inventory_id, month, year, audit_done_by_user_id, inventory_comment_id )
  VALUES
  (${inventory_id}, ${audit_month}, ${audit_year}, ${audit_done_by_user_id}, ${inventory_comment_id})
  `,
  //  {type:QueryTypes.INSERT}
   );
  return true;
}

let assignUserMachine = async (machine_id, userid, loggeduserid,req,models) => {
  let r_error=0;
  let r_message;
  let Return={};
  if (
    req.body.user_id === "" ||
    req.body.user_id == 0 ||
    req.body.user_id == null
  ) {
    Return=await removeMachineAssignToUser(machine_id, req,models,loggeduserid);
  } else {
    const machine_info = await getMachineDetail(machine_id,models);
    let checkpass = true;
    if (typeof machine_info.status!="undefined" && machine_info.status == "sold") {
      checkpass = false;
      r_error=1;
      r_message = "Sold status inventory cannnot be assign to any employee";
    }
    if(checkpass==true){
      let date=new Date().toISOString().slice(0, 10)
      let q=await models.sequelize.query(`select * from machines_user where machine_id =${machine_id}`,{type:QueryTypes.SELECT})
      if(q.length!=0){
        oldUserId=q[0].user_ID;
        let comment = "Inventory Removed"
        await addInventoryComment(machine_id,loggeduserid,models,req,comment,oldUserId)
        comment="Inventory Assigned",
        await addInventoryComment(machine_id,loggeduserid,models,req,comment,oldUserId)
        q=await models.sequelize.query(`UPDATE machines_user SET  user_Id = ${userid}, assign_date = '${date}' where id =${q[0].id}`,{type:QueryTypes.UPDATE})
      }else{
        let q= (`INSERT INTO machines_user ( machine_id, user_Id, assign_date ) VALUES ( machine_id, userid, date)`,{type:QueryTypes.INSERT});
        let comment="Inventory Assigned"
        await addInventoryComment(machine_id,loggeduserid,models,req,comment,userid)
      }
      r_message="Machine assigned Successfully !!";
    }

    Return.error=r_error;
    Return.message=r_message;
  }
    return Return;
};

let getMachineStatusList=async(models)=>{
  let r_error=1;
  let r_message="";
  let r_data=[];
  let q1 =await models.sequelize.query(`SELECT machine_status.*, (SELECT COUNT(*) FROM machines_list WHERE machines_list.status = machine_status.status) AS total_inventories FROM machine_status`, {type:QueryTypes.SELECT })
  JSON.parse(JSON.stringify(q1))
  if(q1.length==0){
    r_message="no machine status list found";
  }else{
    r_error = 0;
    r_data  = q1;
  }
  let Return =[];
  Return.error=r_error;
  Return.data=r_data;
  Return.message=r_message;
  return Return;

}

let getMachineCount=async(req,models)=>{
  let r_error=1;
  let r_message = "";
  let query=await models.sequelize.query( `SELECT machines_list.*, 
  machines_user.user_Id FROM machines_list 
  LEFT JOIN machines_user ON machines_list.id= machines_user.machine_id`,{type:QueryTypes.SELECT })
  JSON.parse(JSON.stringify(query))
  let arr_device={};
  if(query.length>0){ 
  for(let elem of query){
    let key=elem.machine_type.trim();
    let key2 = elem.status.toLowerCase().replace(/\b[a-z]/g, function(letter) {
      return letter.toUpperCase();
     });

      if(arr_device.hasOwnProperty(key)){
         arr_device[key].total++;
         if(arr_device[key].hasOwnProperty(key2)){
           arr_device[key][key2]++;
         }else{
           arr_device[key][key2]=1;
         }
         if(elem.user_Id!=""||elem.user_Id!=null){
          arr_device[key]["User_Assign"]++;
         }else{
           arr_device[key]["User_Not_Assign"]++;
         }
      }else{
        arr_device[key] ={'total':1}
        if(arr_device[key].hasOwnProperty(key2)){
          arr_device[key][key2]=+1;
        }else{
          arr_device[key][key2] =  1;
        }
        if(elem.user_Id!=""||elem.user_Id!=null){
          arr_device[key]["User_Assign"]=+1;
        }else{
          arr_device[key]["User_Not_Assign"]=+1;
        }
      }
  }
  }
  let a =Object.keys(arr_device).length;
  if(Object.keys(arr_device).length){
    r_error=0;
    r_message = "Data found";
  }else{
    r_error = 1;
    r_message = "No Data found";
  }
  Return = [];
  Return.error = r_error;
  Return.data= arr_device;
  Return.message = r_message;
  return Return;
}

let addInventoryComment = async (machine_id, loggeduserid,models,req,comment,oldUserId) => {
  let inventoryComment;
    if(comment){
      inventoryComment = await models.sequelize.query(`insert into inventory_comments 
      (inventory_id, updated_by_user_id, comment_type, comment) values 
      ('${machine_id}', '${loggeduserid}','${req.body.comment_type}', '${comment}')`, {type: QueryTypes.INSERT});
    }
    if(!comment && !oldUserId){
    inventoryComment = await models.InventoryCommentsModel.create({
    inventory_id: machine_id,
    updated_by_user_id: loggeduserid,
    comment_type: req.body.comment_type,
    comment: req.body.unassign_comment,
    });
   }
  if (oldUserId != null&&typeof req.body.assign_unassign_user_id !=="undefined") {
    inventoryComment = await models.InventoryCommentsModel.create({
      inventory_id: machine_id,
      updated_by_user_id: loggeduserid,
      comment_type: req.body.comment_type,
      comment: req.body.unassign_comment,
      assign_unassign_user_id: req.body.assign_unassign_user_id,
    });
  }

  return inventoryComment.id;
};

let addMachineType=async(req,models)=>{
  let r_error=1;
  let not_deleted="";
  let r_message="";
  let r_data=[];
  let ins={}
  ins.type=req.body.type;
  ins.value=req.body.value;
  let q=await models.sequelize.query(`select * from config where type ='${req.body.type}'`,{type:QueryTypes.SELECT})
  if(q.length==0){
    await models.Config.create(ins)
    let r_error=0;
    let r_message = "Variable Successfully Inserted";
    r_data.message= r_message;
  }
  let arr1=[]
  if(q.length!=0){
    for(i=0;i<q.length;i++){
      arr1.push(q[i].value)
    }
    let arr2=req.body;
    arr2=Object.values(arr2);
    let s = arr1
    .filter(x => !arr2.includes(x))
    .concat(arr2.filter(x => !arr1.includes(x)));
    if(s.length>0){
        for(let v of s){
        let query=await models.sequelize.query(`select * from machines_list where machine_type ='${v}'`,{type:QueryTypes.SELECT})
         if(query.length>0){
          r_data['not_delete']=v;
          arr2.push(v)
         }
      }
    }
    let res=JSON.stringify(req.body.dataValues);
   await models.Config.update({value:res},{
     where:{type:req.body.type}
   })
   let r_error=0;
   let r_message = "Variable updated successfully";
   r_data.message = r_message;
}
   let Return=[];
   Return.error=r_error;
   Return.data= r_data;
   return Return;
}

const AddMachineStatus =async(req,models)=>{
  let addInventoryStatusType1 = await addInventoryStatusType(req,models)
}
const getAllMachinesDetail =async(req,models,sort=null,status_sort=null)=>{
  try{
    let q;
  if(sort!==null){
   q=await models.sequelize.query(`select machines_list.*, 
   machines_user.user_Id, 
   machines_user.assign_date, user_profile.name, user_profile.work_email, 
   f1.file_name as fileInventoryInvoice, 
   f2.file_name as fileInventoryWarranty, 
   f3.file_name as fileInventoryPhoto from machines_list 
   left join machines_user on machines_list.id = machines_user.machine_id 
   left join user_profile on machines_user.user_Id = user_profile.user_Id 
   left join files as f1 ON machines_list.file_inventory_invoice = f1.id 
   left join files as f2 ON machines_list.file_inventory_warranty = f2.id 
   left join files as f3 ON machines_list.file_inventory_photo = f3.id 
   where machines_list.machine_type='${sort}' and machines_list.approval_status = 1`,{type:QueryTypes.SELECT})
  }
  if(status_sort!==null){
    q=await models.sequelize.query(`select machines_list.*, 
    machines_user.user_Id,machines_user.assign_date,user_profile.name,user_profile.work_email,
    f1.file_name as fileInventoryInvoice,
    f2.file_name as fileInventoryWarranty,
    f3.file_name as fileInventoryPhoto from machines_list 
    left join machines_user on machines_list.id = machines_user.machine_id 
    left join user_profile on machines_user.user_Id = user_profile.user_Id 
    left join files as f1 ON machines_list.file_inventory_invoice = f1.id 
    left join files as f2 ON machines_list.file_inventory_warranty = f2.id 
    left join files as f3 ON machines_list.file_inventory_photo = f3.id where machines_list.status='${status_sort}' and machines_list.approval_status = 1`,{type:QueryTypes.SELECT})
    }else{
      q=await models.sequelize.query(`select machines_list.*, 
      machines_user.user_Id,machines_user.assign_date,user_profile.name,user_profile.work_email,
      f1.file_name as fileInventoryInvoice,
      f2.file_name as fileInventoryWarranty,
      f3.file_name as fileInventoryPhoto from machines_list 
      left join machines_user on machines_list.id = machines_user.machine_id 
      left join user_profile on machines_user.user_Id = user_profile.user_Id 
      left join files as f1 ON machines_list.file_inventory_invoice = f1.id 
      left join files as f2 ON machines_list.file_inventory_warranty = f2.id 
      left join files as f3 ON machines_list.file_inventory_photo = f3.id where machines_list.approval_status = 1 ORDER BY machines_list.id DESC`,{type:QueryTypes.SELECT})
    }
    JSON.parse(JSON.stringify(q))
    for(let [key,row]of Object.entries(q)){
     let inventoryHistory= await getInventoryHistory(row.id,models);
     q[key]["history"]=inventoryHistory;
     if(typeof row['fileInventoryInvoice']!="undefined"&& row['fileInventoryInvoice']!="")
     {
      q[key]["file_inventory_invoice"] = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_invoice}`;
     }
     if (
      typeof row["file_inventory_photo"] != "undefined" &&
      row["file_inventory_photo"] != null
    ) {
      q[key]["file_inventory_photo"] = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_photo}`;
    }
    if (
      typeof row["file_inventory_warranty"] != "undefined" && row["file_inventory_warranty"] != null) {
      q[key]["file_inventory_warranty"] = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_warranty}`;
    }
    }
    let Return=[];
    Return.error=0;
    Return.data=q;
    return Return;
  }catch(error){
console.log(error);
throw new Error(error);
  }
}
const addInventoryStatusType = async(req,models)=>{
let r_error = 0;
let r_message = "";
let r_data    = [];
let newStatus = false;
if(typeof req.body.status==undefined || req.body.status==null||req.body.status==""){
r_error = 1;
r_message = "Status is empty.";
}
else{
 let data_status = req.body.status.trim();
 let q =await models.sequelize.query(`SELECT * FROM machine_status WHERE status = :status`, { replacements: { status: data_status }, type:QueryTypes.SELECT })
if(q.length>0){
  r_error   = 1;
  r_message = "data_status status already exists";
} else {
  let is_default=0;
  let color='';
  q=await models.MachineStatus.create(data_status,is_default,color)
  if (q!=null) {
      r_error   = 1;
      r_message = "Error in adding status."
  } else {
      r_error   = 0;
      r_message = "$data_status status added successfully.";
  }
}
}
let Return =[];
Return['error']   = r_error;
Return['message'] = r_message;
Return['data']    = r_data;
return Return;
}
const UpdateOfficeMachine=async(logged_user_id,req,models)=>{
try{
  let r_error=1;
  let r_message="";
  let r_data=[];
  let data =[];
  data.machine_type=req.body.machine_type;
  data.machine_name =req.body.machine_name;
  data.machine_price =req.body.machine_price;
  data.serial_number =req.body.serial_no;
  data.mac_address =req.body.mac_address;
  data.date_of_purchase =req.body.purchase_date;
  data.operating_system =req.body.operating_system;
  data.status =req.body.status;
  data.comments =req.body.comment;
  data.warranty_end_date =req.body.warranty;
  data.bill_number =req.body.bill_no;
  data.warranty_comment =req.body.warranty_comment;
  data.repair_comment =req.body.repair_comment;
  data.warranty_years =req.body.warranty_years;
  let inventory_id=req.body.id;
  let machine_detail=await getMachineDetail(inventory_id,models);
  let priorCheckError = false;
  let newStatus=data.status;
  let oldStatus=machine_detail.data.q[0].status
if(newStatus.toLowerCase()=='sold'&&newStatus!=oldStatus){
  if(typeof machine_detail['data'].q[0]['user_Id']!=="undefined"&&machine_detail.data.q[0].user_Id!=null){
    r_error=1;
    r_message="You need to unassign this inventory before setting its status to Sold";
    priorCheckError = true;
  }
}
if(priorCheckError==false){
  await addInventoryComment(inventory_id,logged_user_id,models,req)
  let whereField = 'id';
  let whereFieldVal = inventory_id ;
  let resp;
  let msg=[];
  for(let [key,value] of  Object.entries(machine_detail.data.q[0])){
    if(key in data){
      if (data[key]!= machine_detail.data.q[0].key) {
        let arr =[];
        arr[key]=data[key];
        resp = await DBupdateBySingleWhere('machines_list', whereField, whereFieldVal, arr,key,models);
        msg[key]=data[key]
    }
  }
}
if(resp==false){
  r_error = 1;
  r_message = "No fields updated into table";
  r_data.message = r_message;
}else{
  if (data['send_slack_msg'] == "") {
      if (sizeof(msg > 0)) {
          let updatedDetails = "";
          for(let [key,value] of  Object.entries(msg))
           {
            updatedDetails [key] = value;
          }
          $messageBody = [
              inventoryName =machine_detail['data'].q[0]['machine_name'],
              inventoryType= machine_detail['data']['machine_type'],
              updatedDetails= updatedDetails
          ];
          // $slackMessageStatus = self::sendNotification( "inventory_details_update", $logged_user_id, $messageBody);
      }
  }
  r_error = 0;
  r_message = "Successfully Updated into table";
  r_data.message = r_message;
}
}
Return = [];
Return.error = r_error;
Return.message = r_message;
return Return;
  }catch(error){
    console.log(error)
    throw new Error(error);
  }
}
let DBupdateBySingleWhere= async (tableName, whereField, whereFieldVal,updateData,key,models) =>{
 let Return = false;
//  let updateQuery=await models.sequelize.query(`UPDATE ${tableName} SET `,{type:QueryTypes.SELECT})
 if(Array.isArray(updateData)&& updateData!==null&&updateData!="undefined"){
   let updateFieldString='';
   for(let[key,fieldval] of Object.entries(updateData)){
    if( updateFieldString == '' ){
      updateFieldString.key= fieldval;
  }else{
      updateFieldString = updateFieldString.key=value;
  }
}
  updateQuery=await models.sequelize.query(`Update ${tableName} set ${key}='${updateData[key]}' where ${whereField}=${whereFieldVal}`,{type:QueryTypes.UPDATE})
   if(updateQuery.length>0){
     Return=true;
   }
 }
    return Return;
}
let api_getUnapprovedInventories= async(logged_user_id,req,models)=>{
  let error=0;
  let message='';
  let unapprovedInventories=[];
  let unapprovedInventoriesList=await getUnapprovedInventories(req,models);
  if(unapprovedInventoriesList==false){
    message="No unapproved inventories found!!";
  }
  else{
    for(ui of unapprovedInventoriesList ){
      i_details=getInventoryFullDetails(ui.id,hide_assigned_user_info,models)
      unapprovedInventories=i_details;
    }
  }
  Return ={};
  Return.message=message;
  Return.data=unapprovedInventories;
   return Return;
}
let getUnapprovedInventories=async(req,models)=>{
  let Return=false;
  let query=await models.sequelize.query(`select * from machines_list where approval_status = 0`,{type:QueryTypes.SELECT});
  if(query.length==0){}
  else{
    Return =query;
  }
  return Return;
}

let getUnassignedInventories=async(req,models)=>{
let Return= false;
let q =await models.sequelize.query(`select * from machines_list where id not in(select machine_id from machines_user) AND approval_status = 1`,{type:QueryTypes.SELECT})
JSON.parse(JSON.stringify(q))
if(q.length==0){
}else{
  return q;
}
return Return;
}

let api_getUnassignedInventories=async(userid,req,models)=>{
  let error=0;
  let message='';
  let unassignedInventories =[];
  let unassignedInventoriesList = await getUnassignedInventories(req,models);
  if(unassignedInventoriesList==false){
   message = "No unassigned inventories found!!";
  }else{
    for(elem of unassignedInventoriesList){
      i_details=await getInventoryFullDetails(elem.id,req,models);
      unassignedInventories.push(i_details);
    }
  }
  let Return=[];
  Return.error=error;
  Return.message=message;
  Return.data=unassignedInventories;
  return Return;

};

let copyExistingRoleRightsToNewRole = async (base_role_id, new_role_id) => {
  let baseRoleData = await getRoleCompleteDetails(base_role_id);
  if (baseRoleData != null && new_role_id != null) {
    if (
      typeof baseRoleData[role_pages] != undefined &&
      baseRoleData[role_pages].length > 0
    ) {
      let b_pages = baseRoleData[role_pages];
      for (let key in b_pages) {
        let b_page_id = b_pages[key].page_id;
        await addRolePage(new_role_id, b_page_id);
      }
    }
    if (
      typeof baseRoleData[role_actions] != undefined &&
      baseRoleData[role_actions].length > 0
    ) {
      let b_actions = baseRoleData.role_actions;
      for (let key in b_actions) {
        let b_action_id = b_action[key].action_id;
        await addRoleAction(new_role_id, b_action_id);
      }
    }
    if (
      typeof baseRoleData[role_notifications] != undefined &&
      baseRoleData[role_notifications].length > 0
    ) {
      let b_notifications = baseRoleData.role_notifications;
      for (let key in b_notifications) {
        let b_notification_id = b_notifications[key].notification_id;
        await addRoleNotification(new_role_id, b_notification_id);
      }
    }
  }
};

let assignDefaultValuesToRole = async (new_role_id, roleName = false) => {
  let allpages = await getAllPages();
  for (let key in allpages) {
    if (
      typeof allpages[key].baseCheck != undefined &&
      allpages[key].baseCheck == "defaultForAllRoles"
    ) {
      await addRolePage(new_role_id, allpages[key].id);
      if (
        typeof allpages[key].actions_list != undefined &&
        allpages[key].actions_list > 0
      ) {
        for (let ele in allpages[key].actions_list) {
          await addRoleAction(new_role_id, allpages[key].actions_list[ele].id);
        }
      }
    }
    if (roleName != false) {
      if (
        allpages[key].defaultForRoles != undefined &&
        allpages[key].defaultForRoles > 0 &&
        allpages[key].defaultForRoles.includes(roleName)
      ) {
        await addRolePage(new_role_id, allpages[key].id);
        if (
          typeof allpages[key].actions_list != undefined &&
          allpages[key].actions_list > 0
        ) {
          for (let ele in allpages[key].actions_list) {
            await addRoleAction(new_role_id, allpages[key].actions_list[ele]);
          }
        }
      }
    }
  }
};

let getAllRole = async (models) => {
  let q = await models.sequelize.query(`select * from roles`, {type: QueryTypes.SELECT});
  return q;
};

let manageUserTypeOnRoleChange = async (userid, models) => {
  let roleDetails = await getUserRole(userid, models);
  let currentRoleName = roleDetails.name;
  let q = await models.sequelize.query(`select * from users where users.id = '${userid}'`, {plain: true,type:QueryTypes.SELECT})
  let userType = q.type;
  if (
    currentRoleName.toLowerCase() == "admin" &&
    userType.toLowerCase() == "admin"
  ) {
    let q = await models.User.update(
      { type: "admin" },
      { where: { id: userid } }
    );
  }
  if (
    currentRoleName.toLowerCase() != "admin" &&
    userType.toLowerCase() == "admin"
  ) {
    let q = await models.User.update(
      { type: "employee" },
      { where: { id: userid } }
    );
  }
  return true;
};

let isOnlyOneAdminRoleChanging = async (userid, models) => {
  let roleInfo = await getUserRole(userid, models);
  if (typeof roleInfo.name !== "undefined" && roleInfo.name == "admin") {
    let q = await models.User.findAll({ where: { type: "admin" } });
    if (q.length == 1) {
      return true;
    }
  }
  return false;
};
let   getInventoriesAuditStatusForYearMonth= async(month, year,req,models)=>{
  try{
    let Return;
    let data;
    let error   = 0;
    let message = "";
    let q=await models.sequelize.query(
    `SELECT
    machines_list.id,
    machines_list.machine_type,
    machines_list.machine_name,
    machines_list.serial_number,
    machines_list.bill_number,
    machines_user.machine_id,
    machines_user.user_Id as assigned_user_id,
    files.file_name,
    inventory_audit_month_wise.id as audit_id,
    inventory_audit_month_wise.inventory_id,
    inventory_audit_month_wise.month,
    inventory_audit_month_wise.year,
    inventory_audit_month_wise.audit_done_by_user_id,
    inventory_comments.comment_type,
    inventory_comments.comment,
    up_audit.name as audit_done_by,
    up_assign.name as assigned_to
    FROM
    machines_list
    left join files on machines_list.file_inventory_photo = files.id
    left join inventory_audit_month_wise on machines_list.id = inventory_audit_month_wise.inventory_id
    AND inventory_audit_month_wise.month = ${month}
    AND inventory_audit_month_wise.year = ${year}
    left join user_profile as up_audit on inventory_audit_month_wise.audit_done_by_user_id = up_audit.user_Id
    left join inventory_comments on inventory_audit_month_wise.inventory_comment_id = inventory_comments.id
    left join machines_user on machines_list.id = machines_user.machine_id
    left join user_profile as up_assign on machines_user.user_Id = up_assign.user_Id
    ORDER BY audit_id DESC`,{type:QueryTypes.SELECT})
    JSON.parse(JSON.stringify(q))
    let inventoriesCount =q.length;
    let auditDoneCount                   = 0;
    let auditPendingCount                = 0;
    let unassignedInventoriesCount       = 0;
    let count_good_inventories           = 0;
    let count_issue_inventories          = 0;
    let count_critical_issue_inventories = 0;
    let unassignedInventories         = await getUnassignedInventories(req,models);

    if(unassignedInventories ){
      unassignedInventoriesCount = unassignedInventories.length;
    }

    if (inventoriesCount == 0) {
      message = "No Records Found.";
  }
  else{
    let tempCheckArray = [];

    for(row of q){
      if (typeof row.audit_id !="undefined" && row.audit_id  === "") {
        auditPendingCount++;
    } else {
        auditDoneCount++;
    }
    let inventoryAlreadyChecked = false;
    let invId  = row.id;

    if(tempCheckArray.includes(invId)){
      inventoryAlreadyChecked = true;
    }
    tempCheckArray.push(invId);
    if(inventoryAlreadyChecked == false && typeof row.comment_type !=="undefined"&&row.comment_type!=null)
    {
      let comment_type = row.comment_type;
      if(comment_type == "all_good"){
        count_good_inventories++;
      }else if(comment_type == "issue"){
        count_issue_inventories++;
      }else  if (comment_type == "critical_issue") {
        count_critical_issue_inventories++;
    }
    }
    let tempRow=[];
    tempRow=row;
    }
    message="Inventory Audit List";
    data={};
    data.audit_list_employee_wise= await inventoriesAuditEmployeeWise(q)
    data.stats={};
    data.stats.total_inventories=inventoriesCount,
    data.stats.audit_done=auditDoneCount,
    data.stats.audit_pending=auditPendingCount,
    data.stats.unassigned_inventories=unassignedInventoriesCount,
    data.stats.audit_good=count_good_inventories,
    data.stats.audit_issue=count_issue_inventories,
    data.stats.audit_critical_issue=count_critical_issue_inventories
    data.audit_list=q;
  } 
  Return={
    error: error,
    message: message,
    data:data
  };
  return Return;
}catch(error){
  console.log(error)
  throw new Error(error);
}
}


let inventoriesAuditEmployeeWise=async(data,req,models)=>{
  let employeeWiseData={};
  for([key,inventory] of Object.entries(data)){
    if(typeof inventory.assigned_user_id!="undefined" && inventory.assigned_user_id!=null )
    {
     let  assigned_user_id = inventory.assigned_user_id;
     if(typeof employeeWiseData.assigned_user_id=="undefined"){
      employeeWiseData.assigned_user_id={};
      employeeWiseData.assigned_user_id.audit_good=0;
      employeeWiseData.assigned_user_id.audit_issue=0;
      employeeWiseData.assigned_user_id.audit_critical_issue=0;
      employeeWiseData.assigned_user_id.audit_done_count=0;
      employeeWiseData.assigned_user_id.audit_pending_count=0;
      employeeWiseData.assigned_user_id.employee=[];
      employeeWiseData.assigned_user_id.inventories=[];
      employeeWiseData.assigned_user_id.employee.emp_userid=inventory.assigned_user_id;
      employeeWiseData.assigned_user_id.employee.emp_name =inventory.assigned_to;
     }
     let addInventoryToList = true;
     for([key,inv] in employeeWiseData.assigned_user_id.inventories){
      if(inv.id==inventory.id){
        addInventoryToList = false;
        break;
      }
     }
     if (addInventoryToList){
       if(typeof inventory.comment_type!="undefined"&&inventory.comment_type!=null){
       let comment_type = inventory.comment_type;
       if (comment_type == "all_good") {
        employeeWiseData.assigned_user_id.audit_good++;
       }else if(comment_type == "issue"){
        employeeWiseData.assigned_user_id.audit_issue++;
       }else if(comment_type == "critical_issue"){
        employeeWiseData.assigned_user_id.audit_critical_issue++;
       }
     }
     if (typeof inventory.audit_id!="undefined" || inventory.audit_id == "") {
      employeeWiseData.assigned_user_id.audit_pending_count++;
     }else{
      employeeWiseData.assigned_user_id.audit_done_count++;
     }
     employeeWiseData.assigned_user_id.inventories=[];
     employeeWiseData.assigned_user_id.inventories =inventory;
    }
  }
}

if(employeeWiseData!==null){
 let  sort_audit_critical_issue=employeeWiseData.audit_critical_issue;
 let sort_audit_issue = employeeWiseData.audit_issue;
}
  return employeeWiseData;
}



let assignUserRole = async (userid, roleid, models) => {
  let error = 1;
  let message;
  if (await isOnlyOneAdminRoleChanging(userid, models)) {
    message = "Role cannot be change, as only one admin is left!!";
  } else {
    if (roleid == 0) {
      let q = await models.UserRole.destroy({ user_id: userid });
      error = 0;
      message = "User Role removed!!";
    } else {
      let q = await models.sequelize.query(`select * from user_roles where user_roles.user_id = ${userid}`, {type: QueryTypes.SELECT});
      // let q = await models.UserRole.findAll({ where: { user_id: userid } });
      if (q.length == 0) {
        let creation = await models.UserRole.create({
          user_id: userid,
          role_id: roleid,
        });
        error = 0;
        message = "User role assigned!!";
      } else {
        let q = await models.UserRole.update(
          { role_id: roleid },
          { where: { user_id: userid } }
        );
        error = 0;
        message = "User role updated!!";
      }
    }
    await manageUserTypeOnRoleChange(userid, models);
  }
  let Return = {
    error: error,
    message: message,
  };
  return Return;
};

let assignAdminRoleToUserTypeAdminIfNoRoleAssigned = async (roles, models) => {
  let q = await models.sequelize.query(`select * from users where 
  users.type = 'admin' and users.status = 'Enabled'`, {type: QueryTypes.SELECT})
  if (q.length > 0) {
    let adminRoleDetails = null;
    for (let key in roles) {
      if (roles[key].name == "admin") {
        adminRoleDetails = roles[key];
      }
    }
    if (adminRoleDetails != null) {
      for (let key in q) {
        let roleInfo = await getUserRole(q[key].id, models);
        if (
          roleInfo == null ||
          (typeof roleInfo.name != undefined && roleInfo.name != "admin")
        ) {
          await assignUserRole(q[key].id, adminRoleDetails.id, models);
        }
      }
    }
  }
};

let validateSecretKey = async (secret_key, models) => {
  let Return = false;
  let q = await models.SecretTokens.findOne({
    where: { secret_key: secret_key },
  });
  if (q.length > 0) {
    Return = true;
  }
  return Return;
};

let getEnabledUsersList = async (sorted_by=false, models) => {
  try {
    let q;
    let isAdmin;
    if (sorted_by == "salary") {
      q = await models.sequelize.query(
        "SELECT users.*, user_profile.*,salary.total_salary,roles.id as role_id,roles.name as role_name FROM users LEFT JOIN user_profile ON users.id = user_profile.user_Id LEFT JOIN user_roles ON users.id = user_roles.user_id LEFT JOIN roles ON user_roles.role_id = roles.id LEFT JOIN ( SELECT user_Id, MAX(total_salary) as total_salary FROM salary GROUP BY user_Id ) as salary ON users.id = salary.user_Id where users.status = 'Enabled' ORDER BY salary.total_salary DESC",
        { type: QueryTypes.SELECT }
      );
    } else if (sorted_by == "dateofjoining") {
      q = await models.sequelize.query(
        `SELECT users.*, user_profile.*,
        roles.id as role_id,roles.name as role_name FROM users 
        LEFT JOIN user_profile ON users.id = user_profile.user_Id 
        LEFT JOIN user_roles ON users.id = user_roles.user_id 
        LEFT JOIN roles ON user_roles.role_id = roles.id where users.status = 'Enabled' ORDER BY user_profile.dateofjoining ASC `,
        { type: QueryTypes.SELECT }
      );
    } else {
      q = await models.sequelize.query(
        `SELECT users.*, user_profile.*,
        roles.id as role_id, 
        roles.name as role_name FROM users 
        LEFT JOIN user_profile ON users.id = user_profile.user_Id 
        LEFT JOIN user_roles ON users.id = user_roles.user_id 
        LEFT JOIN roles ON user_roles.role_id = roles.id where users.status = 'Enabled' `,
        { type: QueryTypes.SELECT }
      );
    }
    let newRows = [];
    for (let pp in q) {
      delete q[pp].total_salary;
      if (isAdmin === null) {
        delete q[pp].holding_comments;
      }
      q[pp].slack_profile = [];
      newRows.push(q[pp]);
    }
    // we have mker function related to slack user php code line no. 585 getSlackUsersList();
    // if(newRows.length>0){
    //  for(let key in newRow
    //     newRows[key][profileImage] = await _getEmployeeProfilePhoto(newRows[key].profileImage.values());
    //   }
    // }
    return newRows;
  } catch (error) {
    console.log(error)
    throw new Error(error);
  }
};
let getEnabledUsersListWithoutPass = async (models,role = null,sorted_by = null,) => {
  let row = await getEnabledUsersList(sorted_by, models);
  let rows = [];
  let secureKeys = [
    "bank_account_num",
    "blood_group",
    "address1",
    "address2",
    "emergency_ph1",
    "emergency_ph2",
    "medical_condition",
    "dob",
    "marital_status",
    "city",
    "state",
    "zip_postal",
    "country",
    "home_ph",
    "mobile_ph",
    "work_email",
    "other_email",
    "special_instructions",
    "pan_card_num",
    "permanent_address",
    "current_address",
    "slack_id",
    "policy_document",
    "training_completion_date",
    "termination_date",
    "training_month",
    "slack_msg",
    "signature",
    "role_id",
    "role_name",
    "eth_token",
  ];
  for (let val of row) {
    delete val.password;
    if(role !==null){
    if (role.toLowerCase() == "guest") {
      for (let key in val) {
        for (let secureKey in secureKeys) {
          if (val[key] == secureKeys[secureKey]) {
            delete val[key];
          }
        }
      }
    }
    rows.push(val);
  }
  return rows;
  };
}
const api_getMyInventories = async (user_id,user_role,models) => {
  let error = 0;
  let message = "";
  let data = {};
  let Return = {};
  let userInventories = await getUserInventories(user_id,models,user_role = false);
  if (!userInventories) {
    message = "no inventories assigned to user";
  } else {
    let roleName;
    if (user_role == false) {
      let roleDetails = await getUserRole(user_id, models);
      if (typeof roleDetails.name != "undefined") {
        roleName = roleDetails.name;
      }
    } else {
      roleName = user_role;
    }
    roleName = roleName.toLowerCase();
    let user_assign_machine =[];
    let hide_assigned_user_info = true;
    let inventoryData = await Promise.all(
    userInventories.map(async(userInventories)=>
     {
      let i_details = await getInventoryFullDetails(userInventories.dataValues.machine_id,hide_assigned_user_info,models)
      if (typeof i_details.is_unassign_request != undefined &&
        i_details.is_unassign_request == 1) {
        if (roleName == "admin" ||roleName == "hr" ||roleName == "inventory manager") {
          i_details.is_unassign_request_handler = 1;
        }
      }
      if (typeof i_details.ownership_change_req_by_user != undefined &&
        i_details.ownership_change_req_by_user == 1) {
        if (
          roleName == "admin" ||
          roleName == "hr" ||
          roleName == "inventory manager"
        ) {
          i_details.is_ownership_change_req_handler = 1;
        }
      }
      user_assign_machine.push(JSON.parse(JSON.stringify(i_details)));
      return i_details
    }))
    // console.log(inventoryData,1212211)
    // console.log(user_assign_machine)
    data.user_assign_machine = inventoryData;
    let user_profile_detail = await getUserInfo(user_id, models);
    let upd = {};
    for(i=0;i<user_profile_detail.length;i++){
    upd.name = user_profile_detail[i].name;
    upd.jobtitle = user_profile_detail[i].jobtitle;
    upd.work_email = user_profile_detail[i].work_email;
    upd.slack_profile = user_profile_detail[i].slack_profile;
    upd.role_name = user_profile_detail[i].role_name;
    upd.gender = user_profile_detail[i].gender;
    upd.user_Id = user_profile_detail[i].user_Id;
    }
    data.user_profile_detail = upd;
    Return.data=data;
  }
  Return.error = error;
  Return.message = message;
  return Return;
};
let API_getTempUploadedInventoryFiles=async(req,models)=>{
  let message="";
let query1=await models.sequelize.query(`SELECT 
inventory_temp_files.*,
files.updated_by_user_id as updated_by_user_id,
files.file_name as file_name,
files.google_drive_path as google_drive_path
FROM inventory_temp_files
LEFT JOIN files on inventory_temp_files.file_id = files.id`,{type:QueryTypes.SELECT});
if(Array.isArray(query1)&&query1.length>0){
  for([key,row] of Object.entries(query1)){
    if(typeof row.file_name!="undefined"&&row.file_name!=null){
      //working on it
      query1.key.file_name=`$_ENV['ENV_BASE_URL'].'attendance/uploads/inventories/'.$row['file_name'];` 
      //will be working on it   
    }
  }
}
if(query1.length==0){
  message="no temp uploaded inventory file present"
}
let Return={}
Return.error=0;
Return.message=message;
Return.data=query1;
return Return;

}
let removeMachineDetails = async(inventory_id,logged_user_id,req,models)=>{
  try {
    let error=0;
  let r_message;
  let inventoryDetails=await getMachineDetail(inventory_id,models)
  if(typeof inventoryDetails.data.q.user_ID !="undefined" && inventoryDetails.data.q.user_ID !=null){
    error=1;
    r_message="You need to Unassign this inventory first!!";
  }else{
    
    await removeInventoryAudits(inventory_id,req,models);
    await removeInventoryComments(inventory_id,req,models);
    await removeMachineAssignToUser(inventory_id,req,models);
    // inventory_id =1;
    let query1=await models.sequelize.query(`Delete from machines_list where id=${inventory_id}`,{type:QueryTypes.DELETE});
    error=0;
    r_message= "Inventory deleted successfully";
  }
  Return = [];
  Return.error = error;
  Return.message= r_message;
  return Return;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}
let removeMachineAssignToUser =async(inventory_id,req,models,loggeduserid)=>{
  const machine_Info = await getMachineDetail(inventory_id,models);
    if (machine_Info.data.q.user_ID != null) {
      const message = [];
      message.inventoryName = machine_Info.machine_name;
      message.invetoryType = machine_Info.machine_type;
    // let loggeduserid=req.userData.data.id;
    let loggeduserid=req.userData.id;
      addInventoryComment(inventory_id, loggeduserid, req, db);
    }
    await models.sequelize.query(`Delete from machines_user where machine_id=${inventory_id}`,{type:QueryTypes.DELETE});
    let Return ={};
    Return.error=0;
    Return.message="User removed successfully";
    return Return;

}
let removeInventoryAudits =async(inventory_id,req,models)=>{
  let query=await models.sequelize.query(`Delete from inventory_audit_month_wise where inventory_id=${inventory_id}`,{type:QueryTypes.DELETE});
}
let removeInventoryComments=async(inventory_id,req,models)=>{
  let query=await models.sequelize.query(`Delete from inventory_comments where inventory_id=${inventory_id}`,{type:QueryTypes.DELETE})
}
let inventoryUnassignRequest =async(inventoryId,req,models)=>{
  let machine_info=await getMachineDetail(inventoryId,models)
  let query=await models.sequelize.query(`UPDATE machines_list set is_unassign_request=1 WHERE id=${inventoryId}`,{type:QueryTypes.UPDATE})
  //for slack message
  // if(machine_info.data.q[0].user_id!=null){
  // let userid =machine_info.data.q[0].user_Id;
  // let messageBody={};
  // messageBody.inventoryName=machine_info.data.q[0].machine_name;
  // messageBody.inventoryType=machine_info.data.q[0].machine_type;
  // }
 Return ={};
 Return.error=0;
 Return.message= "Inventory unassign notification has been sent. You will be contacted soon.";

 return Return;
}

let API_deleteTempUploadedInventoryFile=async(req,models)=>{
  let r_error   = 1;
  let r_message = "";
  if(typeof req.body.temp_id !=="undefined" && req.body.temp_id!==null){
    let tempId = req.body.temp_id;
    let query1= await models.sequelize.query(`DELETE FROM inventory_temp_files WHERE id=${tempId}`,{type:QueryTypes.DELETE});
    r_error   = 0;
    r_message = "Uploaded inventory photo deleted successfully!!" ;
  }else{
    r_message = "temp_id is empty in request!!";
  }
  let Return={};
  Return.error=r_error;
  Return.message=r_message;
  return Return;
}
let inventoryOwnershipChangeRequest=async(logged_user_id,req,models)=>{
  let r_error=1;
  let r_message = "";
  if( typeof(req.body.inventory_serial_number)!="undefined" && req.body.inventory_serial_number!=null ){
    let inventory_serial_number = req.body.inventory_serial_number;
    let inventory = await getInventoryBySerialNumber(inventory_serial_number,models);
    if(inventory==false){
      r_message = "No inventory found with serial number $inventory_serial_number";
    }else{
      let inventoryId = inventory.id;
      let q = await models.sequelize.query(`UPDATE machines_list set ownership_change_req_by_user=${logged_user_id} WHERE id=${inventoryId}`,{type:QueryTypes.UPDATE});
      r_error = 0;
      r_message = "Inventory ownership change request submitted successfully!! Please wait for HR to approve your request!!";
    }
}else{
  r_error=0;
  r_message="Empty Inventory Serial Number";
}
let Return={};
Return.error=r_error;
Return.message=r_message;
return Return;
}
let getInventoryBySerialNumber=async(serialNumber,models)=>{
let Return=false;
let q =await models.sequelize.query(`select * from machines_list where serial_number = ${serialNumber}`,{type:QueryTypes.SELECT});
if(q.length>0){
  Return=q;
}
return Return;
}
let getMachineTypeList = async (req,models) => {
  try {
    let r_error=1;
    let r_data;
    let r_message="";
    let q1= await models.sequelize.query(`select * from config where type ='machine_type'`,{type:QueryTypes.SELECT})
    JSON.parse(JSON.stringify(q1))
    if(q1.length!==0){
      r_error=0
      let nextInventoryId=await getNextInternalSerialNumberOfInventory(req,models);
      q1[0].nextInternalSerialNo=nextInventoryId;
      r_data=q1;
    }else{
        r_message="no machine type list found"
    }
   let Return =[];
    Return.error=r_error;
    Return.data= r_data[0];
    Return.message=r_message
  return Return
  } catch (error) {
    console.log(error)
    throw new Error("Unable to locate all machine types");
  }
};
let getNextInternalSerialNumberOfInventory=async(req,models)=>{
 let q=await models.sequelize.query(`select * from machines_list ORDER BY id DESC LIMIT 1`,{type:QueryTypes.SELECT})
 JSON.parse(JSON.stringify(q))
 if( q == null ){
  return 1;
} else {
  return q[0]['id'] + 1;
}
}

let getSystemDefaultRoles = async() => {
  let array = [
    {"name": "Admin","description":"Role Admin", "sortOrder" : 1 },
    {"name": "HR Payroll Manager","description":"Role HR Payroll Manager", "sortOrder" : 2 },
    {"name": "HR","description":"Role HR", "sortOrder" : 3 },
    {"name": "Inventory Manager","description":"Role Inventory Manager", "sortOrder" : 4 },
    {"name": "Attendance Uploader","description":"Role Attendance Uploader", "sortOrder" : 5 },
    {"name": "Employee","description":"Role Employee", "sortOrder" : 6 },
    // {"name": "Admin","description":"Role Admin", "sortOrder" : 7 },
  ]
  return array;
}


let addRoleAction = async(roleid, actionid, models) => {
  let q = await models.sequelize.query(`SELECT * FROM roles_actions WHERE role_id = ${roleid} AND action_id = ${actionid}`, {type:QueryTypes.SELECT});
  if(q.length == 0){
    let newQ = await models.sequelize.query(`insert into roles_actions (role_id, action_id) values (${roleid}, ${actionid})`, {type: QueryTypes.INSERT});
  }
}

let addPagesActions = async(roleid,pageid, models) => {
  try {
  let allPages = await getAllPages();
  let selectedPage = false;
  for(let page of allPages){
    if(page.id == pageid){
      selectedPage = page;
      break;
    }
  }
  if(selectedPage != false && typeof selectedPage[actions_list] !== "undefined"){
    actionsToAdd = selectedPage[actions_list];
      for(let ac of actionsToAdd){
        await addRoleAction(roleid, ac[id], models)
      }
    } 
  }catch(error){
    throw new Error(error);
  }
}
  let insertDefaultConfigByType = async(type) => {
    try {
      let d = new Date();
      let date = `${d.getDate()}-${d.getMonth() +1}-${d.getFullYear()}`;
      let defaultConfigValue;
      let arr;
      switch(type){
        case "attendance_csv":
          defaultConfigValue = JSON.stringify({
            "user_id": [],
            "time": [],
          })
          break;
        case 'reset_password':
          defaultConfigValue =  JSON.stringify({
              "days": "",
              "status": 0,
              "last_updated": date
          });
          break;
        case 'web_show_salary':
          defaultConfigValue = "0";
          break;
        case 'login_types':
          defaultConfigValue =  JSON.stringify({
              "normal_login": true,
              "google_login": false,
              "google_auth_client_id": ""
          });
          break;
        case 'alternate_saturday':
          arr = [];
          defaultConfigValue = JSON.stringify(arr);
          break;
        case 'page_headings':
          arr = [];
          defaultConfigValue = JSON.stringify(arr);
          break;
        case 'inventory_audit_comments':
          defaultConfigValue = JSON.stringify({
            "all_good": "Nothing To Report (all good)",
            "issue": "Issue To Report",
            "critical_issue": "Critical Issue To Report"
          });
          break;
        case 'attendance_late_days':
          defaultConfigValue = "0";
          break;
        case 'rh_config':
          defaultConfigValue = JSON.stringify({                    
            'rh_per_quater': 1,
            'rh_extra': 1,
            'rh_rejection_setting': false
          });
          break;
        default:
        break;
      }
    if( defaultConfigValue !== "" ){
      let q =await models.sequelize.query(`INSERT INTO config( type, value ) VALUES( '${type}', '${defaultConfigValue}' )`,{type: QueryTypes.INSERT});
    }
    } catch (error) {
      throw new Error(error);
    }
  }

  let removeRoleAction = async(roleid, actionid, models) =>{
    let q = models.sequelize.query(`DELETE FROM roles_actions 
    WHERE role_id = ${roleid} AND action_id = ${actionid}`,
    {type:QueryTypes.DELETE});
  }

  let removePageActions = async(roleid, pageid) => {
    try {
      let allPages = await getAllPages();
      let selectedPage = false;
      for(let page of allPages){
      if(page.id == pageid){
        selectedPage = page;
        break;
      }
    }
    if(selectedPage != false && typeof selectedPage[actions_list] !== "undefined"){
      actionsToRemove = selectedPage[actions_list];
        for(let ac of actionsToRemove){
          await removeRoleAction(roleid, ac[id], models)
        }
      }  
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  let getConfigByType = async(type, models) =>{
    try {
      let q =await models.sequelize.query(`select * from config where type='${type}'`,{type:QueryTypes.SELECT});
      let result;
      if(q.length == 0){
        await insertDefaultConfigByType(type);
        result = await getConfigByType(type, models);
        return result;
      }else{
        result = JSON.parse(q[0].value);
        return result;
      }
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  let Inventory_insertDefaultStatuses = async(models) =>{
    try {
      let checkExists = await getMachineStatusList(models);
      if(typeof checkExists.data !== "undefined" && checkExists.data.length > 0){
      }else{
        let defaultInventoryStatuses = [
          {
            "status": "Working",
            "color" : "#008b02",
          },
          {
              "status": "Not working",
              "color" : "#db3e00",
          },
          {
              "status": "Old",
              "color" : "#fef3bd",
          },
          {
              "status": "Repair",
              "color" : "#006b76",
          },
          {
              "status": "Need To Sell",
              "color" : "#1273de",
          },
          {
              "status": "Sold",
              "color" : "#fccb00",
          },
        ]
        for(let [key, status] of Object.entries(defaultInventoryStatuses)){
          let s = status.status;
          let c = status.color;
          let q = models.sequelize.query(`INSERT into machine_status (status, color, is_default) VALUES ('${s}', '${c}', 1 )`,{type: QueryTypes.INSERT});
        }
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  module.exports = {
    Inventory_insertDefaultStatuses,
    // registerRole,
    getConfigByType,
    API_getTempUploadedInventoryFiles,
    getEnabledUsersListWithoutPass,
    validateSecretKey,
    assignUserRole,
    getAllRole,
    getRolePagesForSuperAdmin,
    getGenericPagesForAllRoles,
    getRolePages,
    getRolesForPage,
    getRoleActions,
    //   getRoleNotifications,
    randomString,
    //   _getEmployeeProfilePhoto
    getUserInventories,
    getUserInfo,
    getUserInfoByWorkEmail,
    getUserRole,
    getRolePagesForApiToken,
    checkifPageEnabled,
    getInventoryHistory,
    getInventoryFullDetails,
    isInventoryAuditPending,
    isUnassignInventoriesRequestPending,
    is_policy_documents_read_by_user,
    isOwnershipChangeInventoriesRequestPending,
    generateUserToken,
    refreshToken,
    isValidTokenAgainstTime,
    api_addInventoryAudit,
    addInventoryAudit,
    addInventoryComment ,
    getMachineDetail,
    AddMachineStatus,
    addMachineType,
    addInventoryStatusType,
    getMachineStatusList,
    getMachineCount,
    getAllMachinesDetail,
    UpdateOfficeMachine,
    copyExistingRoleRightsToNewRole,
    assignDefaultValuesToRole,
    assignAdminRoleToUserTypeAdminIfNoRoleAssigned,
    getSystemDefaultRoles,
    api_getMyInventories,
    api_getUnapprovedInventories,
    api_getUnassignedInventories,
    _getDateTimeData,
    getInventoriesAuditStatusForYearMonth,
    API_deleteTempUploadedInventoryFile,
    removeMachineDetails,inventoryUnassignRequest,
    inventoryOwnershipChangeRequest,
    assignUserMachine,
    getMachineTypeList,
    addPagesActions,
    removePageActions,
    DBupdateBySingleWhere
  }