module.exports = function(sequelize, DataTypes) {
  const NewsSource = sequelize.define('NewsSource', {
    site: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  })

  return NewsSource
}
