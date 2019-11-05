module.exports = function(sequelize, DataTypes) {
	var Article = sequelize.define('Article', {
		title: DataTypes.STRING(500),
		content: DataTypes.TEXT(),
		href: DataTypes.STRING(500),
		authors: DataTypes.STRING(500),
		publicationDate: DataTypes.DATE()
	});

	Article.associate = function(models) {
		Article.belongsTo(models.NewsSource, {
			foreignKey: 'sourceName'
		});
	};
	return Article;
};
