const assert = require('assert')
const { assertValidArticle } = require('../../shared/data-assertions')

module.exports = function(sequelize, DataTypes) {
  const Article = sequelize.define(
    'Article',
    {
      href: {
        type: DataTypes.STRING(2000),
        primaryKey: true,
      },
      site: DataTypes.STRING,
      title: DataTypes.TEXT(),
      content: DataTypes.TEXT(),
      authors: DataTypes.JSON(),
      publicationDate: DataTypes.DATE(),
    },
    {
      validate: {
        needsSiteToAssociateTo: function() {
          assert(
            this.site,
            'Should be able to determine `site` information from payload'
          )
        },
        validArticle: function() {
          assertValidArticle(this)
        },
      },
    }
  )

  Article.associate = function(models) {
    Article.belongsTo(models.NewsSource, {
      foreignKey: 'site',
      as: 'newsSource',
    })
  }
  return Article
}
