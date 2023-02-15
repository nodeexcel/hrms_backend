function inventoryTempFiles(database, type) {
  const InventoryTempFiles = database.define(
    "inventory_temp_files",
    {
      file_id: type.INTEGER,
    },
    {
      timestamps: false,
    }
  );
  InventoryTempFiles.associate = (models) => {
    models.InventoryTempFiles.hasOne(models.FilesModel, {
      foreignKey: "file_id",
      as: "file",
    });
  };
  InventoryTempFiles.getTempFiles = async () => {
    try {
      let foundTempFiles = await InventoryTempFiles.findAll({});
      return foundTempFiles;
    } catch (error) {
      throw new Error(error);
    }
  };
  InventoryTempFiles.deleteTempFiles = async (reqBody) => {
    try {
      let tempFilesToDelete = await InventoryTempFiles.destroy({
        where: { file_id: reqBody.file_id },
      });
      return tempFilesToDelete;
    } catch (error) {
      throw new Error(error);
    }
  };

  return InventoryTempFiles;
}

module.exports = inventoryTempFiles;
