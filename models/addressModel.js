// function address(database, type) {
// 	const Address = database.define(
// 		'address',
// 		{
// 			city: type.STRING,
// 			state: type.STRING
// 		},
// 		{
// 			timestamps: true,
// 			freezeTableName: true
// 		}
// 	);

// 	Address.associate = function(models) {
// 		Address.belongsTo(models.User);
// 	};
// 	Address.createData = async (reqBody) => {
// 		try {
// 			await Address.create({
// 				detailId: reqBody.user_id,
// 				city: reqBody.city,
// 				state: reqBody.state
// 			});
// 		} catch (error) {
// 			throw new Error('Unable to create address');
// 		}
// 	};
// 	return Address;
// }

// module.exports = address;
