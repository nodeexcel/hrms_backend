let responseHandle = async (req, res) => {
  res.status(res.status_code).json({
    error: res.error,
    data: {
      token: res.token,
      message: res.message,
      userid: res.data,
    },
  });
};

let responseForData = async (req, res) => {
  res.status(res.status_code).json({
    error: res.error,
    message: res.message,
    data: {
      inventory_id: res.inventory_id,
    },
  });
};

let responseForInventory = async (req, res) => {
  res.status(res.status_code).json({
    error: res.error,
    message: res.message,
    data: res.data,
  });
};
let responseForEmployee = async (req, res) => {
  res.status(res.status_code).json({
    error: res.error,
    message: res.message,
    Data: {
      data: res.data,
    },
  });
};
let responseForEmployee1 = async (req, res) => {
  res.status(res.status_code).json({
    error: res.error,
    message: res.message,
    data: res.data,
  });
};
let responseForAddMachine = async (req, res) => {
  res.status(res.status_code).json({
    error: res.error,
    Data: {
      message: res.message,
      data:res.data
    },
  });
};
let newResponse = async (req, res) => {
  res.status(res.status_code).json({
    error: res.error,
    data: res.data,
    message:res.message,
  });
};

let resForList = async (req, res) => {
  res.status(res.status_code).json(res.data);
};

let addNewEmployeeResponseHandle = async (req, res) => {
  res.status(res.status_code).json({
    error: res.error,
    message: res.message,
    data: res.data,
  });
};
let responseForEmployee2 = async (req, res) => {
  res.status(res.status_code).json({
    error: res.error,
    data: res.data,
  });
};
let responseForLeaveApis = async (req, res) => {
  res.status(res.status_code).json({
    error: res.error,
    message: res.message,
    data: res.data,
  });
};
module.exports = {
  responseHandle,
  responseForData,
  responseForInventory,
  responseForEmployee,
  addNewEmployeeResponseHandle,
  responseForAddMachine,
  newResponse,
  resForList,
  responseForLeaveApis,responseForEmployee1,responseForEmployee2
};
