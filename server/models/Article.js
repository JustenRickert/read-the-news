const { assertValidArticle } = require('../../shared/data-assersions')

module.exports = function(sequelize, DataTypes) {
  const Article = sequelize.define(
    'Article',
    {
      title: DataTypes.TEXT(),
      content: DataTypes.TEXT(),
      href: DataTypes.STRING(2000),
      authors: DataTypes.JSON(),
      publicationDate: DataTypes.DATE(),
    },
    {
      validate: {
        validArticle: function() {
          assertValidArticle(this)
        },
      },
    }
  )

  Article.associate = function(models) {
    Article.belongsTo(models.NewsSource, {
      foreignKey: 'sourceName',
    })
  }
  return Article
}
