module.exports = function(sequelize, DataTypes) {
  const NewsSource = sequelize.define('NewsSource', {
    sourceName: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    href: DataTypes.STRING(500),
  })

  return NewsSource
}
